/**
 * グローバルナビゲーションをDOM生成で構築する
 * 
 * データソース:
 * ①メガメニューデータ: header-megamenu-sample.json からメニュー構造を取得
 * ②オーサリング情報: /global-nav (EDSのdoc) から以下を取得
 *   - Section 1: ロゴ画像
 *   - Section 2: タイトル（法人のお客さま）とリンク
 *   - Section 3: ユーティリティメニュー（お問い合わせ、ビジネスブログ）
 */

import { loadFragment } from '../blocks/fragment/fragment.js';
import { getMetadata } from './aem.js';
import decorateSearchWidget from '../blocks/header/header-search-widget.js';

// 定数定義
const MEGAMENU_FILENAME = 'header-megamenu.json';
const AUTHORING_INFO_PATH = '/global-nav';

/**
 * 外部リンクかどうかを判定する
 * lifecycle.jsの処理と同じロジックを使用
 * @param {string} href リンクのhref属性
 * @returns {boolean} 外部リンクの場合true
 */
function isExternalLink(href) {
  if (!href) return false;
  
  // 内部サイトのURLパターン
  const internalPatterns = [
    'https://main--softbank-eds-develop--aquaring.aem.page/',
    'https://main--aem-eds--softbankbtob.aem.page/',
    'https://www.softbank.jp/biz/',
    'http://localhost:3000/',
    'http://localhost:3000/',
    'https://feature-header-test--demo--ax1270.aem.page/',
  ];
  
  return !internalPatterns.some(pattern => href.includes(pattern));
}

/**
 * セクションからpタグの情報を取得するヘルパー関数
 * @param {Element} section セクション要素
 * @returns {Object|null} {text, href, hasLink} または null
 */
function extractParagraphInfo(section) {
  if (!section) return null;
  
  const p = section.querySelector('p');
  if (!p) return null;

  const link = p.querySelector('a');
  let text = '';
  let href = '';
  let hasLink = false;

  if (link) {
    href = link.getAttribute('href') || '';
    text = link.textContent.trim();
    hasLink = !!href;
  } else {
    text = p.textContent.trim();
  }

  if (!text) return null;

  return { text, href, hasLink };
}

/**
 * メガメニューデータを取得する関数
 * @param {string} navPath ナビゲーションパス
 * @returns {Promise<Array>} メガメニューデータ
 */
async function fetchMegaMenuData(navPath) {
  const navDir = navPath.substring(0, navPath.lastIndexOf('/'));
  const megamenuPath = `${navDir}/${MEGAMENU_FILENAME}`;
  // const megamenuPath = `/business/scripts/header-megamenu-sample.json`;
  
  try {
    const response = await fetch(megamenuPath);
    if (response.ok) {
      const json = await response.json();
      return json.data || [];
    }
    console.error(`Failed to fetch megamenu: ${response.status} ${response.statusText}`);
    return [];
  } catch (error) {
    console.error('Error fetching megamenu:', error);
    return [];
  }
}

/**
 * フラットデータを階層構造に変換
 */
function convertFlatToHierarchy(data) {
  if (!data || data.length === 0) return [];

  const itemsMap = new Map();
  const rootItems = [];

  // ノードを作成（typeは後で自動判定）
  data.forEach((item) => {
    const node = {
      id: item.id,
      label: item.label,
      link: item.link || null,
      target: item.target || null,
      parentId: item.parentId || null,
      children: [],
    };
    itemsMap.set(item.id, node);
  });

  // 親子関係を構築
  itemsMap.forEach((node) => {
    if (!node.parentId || node.parentId === '') {
      rootItems.push(node);
    } else {
      const parent = itemsMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        console.warn(`Parent not found: ${node.id}`);
        rootItems.push(node);
      }
    }
  });

  // typeを階層構造から自動判定
  itemsMap.forEach((node) => {
    if (!node.parentId || node.parentId === '') {
      // 1階層目：子要素があればmegadropdown、なければlink
      node.type = node.children.length > 0 ? 'megadropdown' : 'link';
    } else {
      // 2階層目以降：子要素があればaccordion、なければlink
      node.type = node.children.length > 0 ? 'accordion' : 'link';
    }
  });

  return rootItems;
}

/**
 * PCグローバルナビゲーションアイテム生成
 */
function createGlobalNavItem(menuItem) {
  const li = document.createElement('li');
  li.className = 'sb-appshell-v1-header-nav_globalnav-item';

  const hasMegaMenu = menuItem.type === 'megadropdown' && menuItem.children && menuItem.children.length > 0;

  if (hasMegaMenu) {
    // メガメニューありの場合はdiv
    const div = document.createElement('div');
    div.className = 'sb-appshell-v1-header-nav_globalnav-link';
    div.setAttribute('data-href', menuItem.id);

    const span = document.createElement('span');
    span.className = 'sb-appshell-v1-header-nav_globalnav-link-inner';
    span.textContent = menuItem.label;

    div.appendChild(span);
    li.appendChild(div);
  } else {
    // 通常リンク
    const a = document.createElement('a');
    a.href = menuItem.link || '#';
    a.className = 'sb-appshell-v1-header-nav_globalnav-link';
    
    // 外部リンク判定（自動判定を優先、JSONのtargetは将来廃止予定）
    if (isExternalLink(a.href)) {
      a.target = '_blank';
    } else if (menuItem.target) {
      a.target = menuItem.target;
    }

    const span = document.createElement('span');
    span.className = 'sb-appshell-v1-header-nav_globalnav-link-inner';
    span.textContent = menuItem.label;

    a.appendChild(span);
    li.appendChild(a);
  }

  return li;
}

/**
 * Lv4アイテム生成
 */
function createLv4Item(item) {
  const li = document.createElement('li');
  li.className = 'sb-appshell-v1-header-nav_megadropdown-lv4-item';

  const container = document.createElement('div');
  container.className = 'sb-appshell-v1-header-nav_megadropdown-lv4-link-container';

  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    // アコーディオン
    const span = document.createElement('span');
    span.className = 'sb-appshell-v1-header-nav_megadropdown-lv4-link sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion';
    span.textContent = item.label;
    container.appendChild(span);
    li.appendChild(container);

    // Lv5サブメニュー
    const lv5Div = document.createElement('div');
    lv5Div.className = 'sb-appshell-v1-header-nav_megadropdown-lv5 _ga_area_category_nav disp-none';
    lv5Div.style.height = 'auto';

    const lv5Inner = document.createElement('div');
    lv5Inner.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-inner';

    // Lv5トップリンク（親要素のlabel + " トップ"を自動生成）
    if (item.link) {
      const lv5Top = document.createElement('div');
      lv5Top.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-top';

      const topLink = document.createElement('a');
      topLink.href = item.link;
      topLink.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-link';
      topLink.textContent = `${item.label} トップ`;
      
      // 外部リンク判定
      if (isExternalLink(topLink.href)) {
        topLink.target = '_blank';
      } else if (item.target) {
        topLink.target = item.target;
      }

      lv5Top.appendChild(topLink);
      lv5Inner.appendChild(lv5Top);
    }

    // Lv5リンクリスト（全ての子要素）
    if (item.children.length > 0) {
      const lv5Links = document.createElement('div');
      lv5Links.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-links';

      const lv5LinksList = document.createElement('ul');
      lv5LinksList.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-links-list';

      item.children.forEach((child) => {
        const lv5Item = document.createElement('li');
        lv5Item.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-links-item';

        const lv5Link = document.createElement('a');
        lv5Link.href = child.link || '#';
        lv5Link.className = 'sb-appshell-v1-header-nav_megadropdown-lv5-link';
        lv5Link.textContent = child.label;
        
        // 外部リンク判定
        if (isExternalLink(lv5Link.href)) {
          lv5Link.target = '_blank';
        } else if (child.target) {
          lv5Link.target = child.target;
        }

        lv5Item.appendChild(lv5Link);
        lv5LinksList.appendChild(lv5Item);
      });

      lv5Links.appendChild(lv5LinksList);
      lv5Inner.appendChild(lv5Links);
    }

    lv5Div.appendChild(lv5Inner);
    li.appendChild(lv5Div);
  } else {
    // 通常リンク
    const link = document.createElement('a');
    link.href = item.link || '#';
    link.className = 'sb-appshell-v1-header-nav_megadropdown-lv4-link';
    link.textContent = item.label;
    
    // 外部リンク判定（自動判定を優先、JSONのtargetは将来廃止予定）
    if (isExternalLink(link.href)) {
      link.target = '_blank';
    } else if (item.target) {
      link.target = item.target;
    }

    container.appendChild(link);
    li.appendChild(container);
  }

  return li;
}

/**
 * メガドロップダウンのカテゴリアイテム生成
 */
function createMegadropdownCategoryItem(menuItem) {
  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'sb-appshell-v1-header-nav_megadropdown-category-item';
  categoryDiv.setAttribute('data-sb-megadropdown-category', menuItem.id);

  // ヘッダー（親要素のlabel + " トップ"を自動生成）
  const header = document.createElement('div');
  header.className = 'sb-appshell-v1-header-nav_megadropdown-lv3-header';

  const headerLinkDiv = document.createElement('div');
  headerLinkDiv.className = 'sb-appshell-v1-header-nav_megadropdown-lv3-header-link';

  // 親要素のlinkがある場合はリンクとして生成
  if (menuItem.link) {
    const headerLink = document.createElement('a');
    headerLink.href = menuItem.link;
    headerLink.className = 'sb-appshell-v1-header-nav_megadropdown-lv3-header-link-text';
    headerLink.textContent = `${menuItem.label} トップ`;
    
    // 外部リンク判定
    if (isExternalLink(headerLink.href)) {
      headerLink.target = '_blank';
    } else if (menuItem.target) {
      headerLink.target = menuItem.target;
    }
    
    headerLinkDiv.appendChild(headerLink);
  } else {
    const headerSpan = document.createElement('span');
    headerSpan.className = 'sb-appshell-v1-header-nav_megadropdown-lv3-header-link-text-nolink';
    headerSpan.textContent = `${menuItem.label} トップ`;
    headerLinkDiv.appendChild(headerSpan);
  }

  header.appendChild(headerLinkDiv);
  categoryDiv.appendChild(header);

  // セクション
  const section = document.createElement('div');
  section.className = 'sb-appshell-v1-header-nav_megadropdown-lv3-section';

  const lv4Div = document.createElement('div');
  lv4Div.className = 'sb-appshell-v1-header-nav_megadropdown-lv4';

  const lv4List = document.createElement('ul');
  lv4List.className = 'sb-appshell-v1-header-nav_megadropdown-lv4-list';

  // 全ての子要素を処理
  menuItem.children.forEach((child) => {
    const lv4Item = createLv4Item(child);
    lv4List.appendChild(lv4Item);
  });

  lv4Div.appendChild(lv4List);
  section.appendChild(lv4Div);
  categoryDiv.appendChild(section);

  return categoryDiv;
}

/**
 * PCメガドロップダウン全体を生成
 */
function createPCMegadropdown(menuStructure) {
  const megadropdown = document.createElement('div');
  megadropdown.className = 'sb-appshell-v1-header-nav_megadropdown _ga_area_category_nav';

  const view = document.createElement('div');
  view.className = 'sb-appshell-v1-header-nav_megadropdown-view';

  const viewInner = document.createElement('div');
  viewInner.className = 'sb-appshell-v1-header-nav_megadropdown-view-inner';

  // ヘッダー
  const headerDiv = document.createElement('div');
  headerDiv.className = 'sb-appshell-v1-header-nav_megadropdown-header';

  const headerInner = document.createElement('div');
  headerInner.className = 'sb-appshell-v1-header-nav_megadropdown-header-inner';

  const searchDiv = document.createElement('div');
  searchDiv.id = 'sb-appshell-v1-header-nav_megadropdown-header-search';
  searchDiv.className = 'sb-appshell-v1-header-nav_megadropdown-header-search';

  const closeButton = document.createElement('button');
  closeButton.className = 'sb-appshell-v1-header-nav_megadropdown-header-close-button';
  closeButton.textContent = '閉じる';

  headerInner.appendChild(searchDiv);
  headerInner.appendChild(closeButton);
  headerDiv.appendChild(headerInner);
  viewInner.appendChild(headerDiv);

  // コンテンツ
  const contents = document.createElement('div');
  contents.className = 'sb-appshell-v1-header-nav_megadropdown-contents';

  menuStructure.forEach((menuItem) => {
    if (menuItem.type === 'megadropdown' && menuItem.children && menuItem.children.length > 0) {
      const categoryItem = createMegadropdownCategoryItem(menuItem);
      contents.appendChild(categoryItem);
    }
  });

  viewInner.appendChild(contents);

  // フッター
  const footer = document.createElement('div');
  footer.className = 'sb-appshell-v1-header-nav_megadropdown-footer';

  const footerSupport = document.createElement('div');
  footerSupport.className = 'sb-appshell-v1-header-nav_megadropdown-footer-support';

  const footerSupportList = document.createElement('div');
  footerSupportList.className = 'sb-appshell-v1-header-nav_megadropdown-footer-support-list';

  const documentsLink = document.createElement('a');
  documentsLink.href = '/biz/resources/documents/';
  documentsLink.className = 'sb-appshell-v1-header-nav_megadropdown-footer-support-link sb-appshell-v1-header-nav_megadropdown-footer-support-link-documents';
  documentsLink.textContent = '資料ダウンロード';
  
  // 外部リンク判定
  if (isExternalLink(documentsLink.href)) {
    documentsLink.target = '_blank';
  }

  footerSupportList.appendChild(documentsLink);
  footerSupport.appendChild(footerSupportList);
  footer.appendChild(footerSupport);

  viewInner.appendChild(footer);
  view.appendChild(viewInner);
  megadropdown.appendChild(view);

  return megadropdown;
}

/**
 * PCナビゲーション生成
 */
function createPCNavigation(menuStructure) {
  const nav = document.createElement('nav');
  nav.id = 'sb-appshell-v1-header-nav';
  nav.className = 'sb-appshell-v1-header-nav';
  nav.setAttribute('role', 'navigation');

  // グローバルナビ
  const globalNav = document.createElement('div');
  globalNav.className = 'sb-appshell-v1-header-nav_globalnav _ga_area_category_nav';

  const globalNavList = document.createElement('ul');
  globalNavList.className = 'sb-appshell-v1-header-nav_globalnav-list';

  menuStructure.forEach((menuItem) => {
    const navItem = createGlobalNavItem(menuItem);
    globalNavList.appendChild(navItem);
  });

  globalNav.appendChild(globalNavList);
  nav.appendChild(globalNav);

  // メガドロップダウン
  const megadropdown = createPCMegadropdown(menuStructure);
  nav.appendChild(megadropdown);

  return nav;
}

/**
 * SPメニューのLv3アイテム生成
 */
function createSPLv3Item(menuItem) {
  const li = document.createElement('li');
  li.className = 'sb-appshell-v1-menu_sitemap-lv3-item';

  const hasChildren = menuItem.type === 'megadropdown' && menuItem.children && menuItem.children.length > 0;

  if (hasChildren) {
    const span = document.createElement('span');
    span.className = 'sb-appshell-v1-menu_sitemap-lv3-title sb-appshell-v1-menu_sitemap-lv3-title--accordion';
    span.setAttribute('aria-controls', `js-sunshine-v1-accordion-${menuItem.id}`);
    span.setAttribute('aria-expanded', 'false');
    span.textContent = menuItem.label;

    li.appendChild(span);

    const lv4Div = document.createElement('div');
    lv4Div.className = 'sb-appshell-v1-menu_sitemap-lv4 _ga_area_category_nav disp-none';
    lv4Div.setAttribute('aria-hidden', 'true');
    lv4Div.id = `js-sunshine-v1-accordion-${menuItem.id}`;
    lv4Div.style.height = 'auto';

    const lv4List = document.createElement('ul');
    lv4List.className = 'sb-appshell-v1-menu_sitemap-lv4-list';

    // 全ての子要素を処理
    menuItem.children.forEach((child) => {
      const lv4Item = createSPLv4Item(child);
      lv4List.appendChild(lv4Item);
    });

    lv4Div.appendChild(lv4List);
    li.appendChild(lv4Div);
  } else {
    const link = document.createElement('a');
    link.href = menuItem.link || '#';
    link.className = 'sb-appshell-v1-menu_sitemap-lv3-title';
    link.textContent = menuItem.label;
    
    // 外部リンク判定（自動判定を優先、JSONのtargetは将来廃止予定）
    if (isExternalLink(link.href)) {
      link.target = '_blank';
    } else if (menuItem.target) {
      link.target = menuItem.target;
    }

    li.appendChild(link);
  }

  return li;
}

/**
 * SPメニューのLv4アイテム生成
 */
function createSPLv4Item(item) {
  const li = document.createElement('li');
  li.className = 'sb-appshell-v1-menu_sitemap-lv4-item';

  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    const span = document.createElement('span');
    span.className = 'sb-appshell-v1-menu_sitemap-lv4-title sb-appshell-v1-menu_sitemap-lv4-title--accordion';
    span.setAttribute('aria-controls', `js-sunshine-v1-accordion-${item.id}`);
    span.setAttribute('aria-expanded', 'false');
    span.textContent = item.label;

    li.appendChild(span);

    const lv5Div = document.createElement('div');
    lv5Div.className = 'sb-appshell-v1-menu_sitemap-lv5 disp-none';
    lv5Div.setAttribute('aria-hidden', 'true');
    lv5Div.id = `js-sunshine-v1-accordion-${item.id}`;
    lv5Div.style.height = 'auto';

    const lv5List = document.createElement('ul');
    lv5List.className = 'sb-appshell-v1-menu_sitemap-lv5-list';

    // 親要素のlinkがある場合、" トップ"リンクを最初に追加
    if (item.link) {
      const topItem = document.createElement('li');
      topItem.className = 'sb-appshell-v1-menu_sitemap-lv5-item';

      const topLink = document.createElement('a');
      topLink.href = item.link;
      topLink.className = 'sb-appshell-v1-menu_sitemap-lv5-title';
      topLink.textContent = `${item.label} トップ`;
      
      // 外部リンク判定（自動判定を優先、JSONのtargetは将来廃止予定）
      if (isExternalLink(topLink.href)) {
        topLink.target = '_blank';
      } else if (item.target) {
        topLink.target = item.target;
      }

      topItem.appendChild(topLink);
      lv5List.appendChild(topItem);
    }

    // 全ての子要素を追加
    item.children.forEach((child) => {
      const lv5Item = document.createElement('li');
      lv5Item.className = 'sb-appshell-v1-menu_sitemap-lv5-item';

      const link = document.createElement('a');
      link.href = child.link || '#';
      link.className = 'sb-appshell-v1-menu_sitemap-lv5-title';
      link.textContent = child.label;
      
      // 外部リンク判定（自動判定を優先、JSONのtargetは将来廃止予定）
      if (isExternalLink(link.href)) {
        link.target = '_blank';
      } else if (child.target) {
        link.target = child.target;
      }

      lv5Item.appendChild(link);
      lv5List.appendChild(lv5Item);
    });

    lv5Div.appendChild(lv5List);
    li.appendChild(lv5Div);
  } else {
    const link = document.createElement('a');
    link.href = item.link || '#';
    link.className = 'sb-appshell-v1-menu_sitemap-lv4-title';
    link.textContent = item.label;
    
    // 外部リンク判定（自動判定を優先、JSONのtargetは将来廃止予定）
    if (isExternalLink(link.href)) {
      link.target = '_blank';
    } else if (item.target) {
      link.target = item.target;
    }

    li.appendChild(link);
  }

  return li;
}

/**
 * SPメニューヘッダーを生成
 * @param {Element} fragment オーサリング情報（fragment）
 */
function createSPMenuHeader(fragment) {
  const header = document.createElement('div');
  header.className = 'sb-appshell-v1-menu_header';

  // ホームリンク
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.className = 'sb-appshell-v1-menu_link-home';
  homeLink.innerHTML = `<svg class="sb-appshell-v1-menu_link-home-icon">
    <use xlink:href="#sunshine-icon-menu_link-home">
      <svg viewBox="0 0 32 32" id="sunshine-icon-menu_link-home">
        <path d="M31.82 17L16.41 2.26a.59.59 0 0 0-.82 0L.18 17a.61.61 0 0 0 0 .84.61.61 0 0 0 .84 0l2.83-2.74v14.21a.56.56 0 0 0 .18.42.58.58 0 0 0 .41.17h7.68a.59.59 0 0 0 .59-.6v-9.53h6.58v9.53a.59.59 0 0 0 .59.6h7.68a.58.58 0 0 0 .41-.17.56.56 0 0 0 .18-.42V15.1L31 17.83a.57.57 0 0 0 .41.16.61.61 0 0 0 .43-.18.61.61 0 0 0-.02-.81zM27 28.72h-6.53v-9.54a.58.58 0 0 0-.59-.59h-7.76a.58.58 0 0 0-.59.59v9.53H5V14L16 3.51 27 14z" fill="#cbcccc"></path>
      </svg>
    </use>
  </svg>ホーム`;

  header.appendChild(homeLink);

  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'sb-appshell-v1-menu_button-close';
  closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 35 36" width="17.5" height="18" class="sb-appshell-v1-menu_button-close-line">
    <title>メニューを閉じる</title>
    <g>
      <path d="M0.211,33.167 L32.667,0.711 L34.789,2.834 L2.334,35.290 L0.211,33.167 Z"></path>
      <path d="M34.789,33.167 L2.334,0.711 L0.211,2.834 L32.667,35.290 L34.789,33.167 Z"></path>
    </g>
  </svg>`;

  header.appendChild(closeButton);

  // ユーティリティメニュー（オーサリング情報から生成）
  const utility = document.createElement('div');
  utility.className = 'sb-appshell-v1-menu_utility';

  const utilityList = document.createElement('div');
  utilityList.className = 'sb-appshell-v1-menu_utility-list';

  // オーサリング情報: Section 3からユーティリティメニューを取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 2) {
      const thirdSection = sections[2];
      const ul = thirdSection.querySelector('ul');

      if (ul) {
        const listItems = ul.querySelectorAll('li');

        listItems.forEach((li) => {
          const link = li.querySelector('a');
          const iconSpan = li.querySelector('.icon');
          let itemText = '';
          let itemHref = '';
          let hasLink = false;

          if (link) {
            itemHref = link.getAttribute('href') || '';
            itemText = link.textContent.trim();
            hasLink = !!itemHref;
          } else {
            const clonedLi = li.cloneNode(true);
            const clonedIconSpan = clonedLi.querySelector('.icon');
            if (clonedIconSpan) {
              clonedIconSpan.remove();
            }
            itemText = clonedLi.textContent.trim();
          }

          if (itemText) {
            const utilityItem = document.createElement('div');
            utilityItem.className = 'sb-appshell-v1-menu_utility-item';

            if (hasLink) {
              const utilityLink = document.createElement('a');
              utilityLink.href = itemHref;
              utilityLink.className = 'sb-appshell-v1-menu_utility-search';

              // アイコンがある場合はそのまま追加（クラス名をSP用に変更）
              if (iconSpan) {
                const clonedIcon = iconSpan.cloneNode(true);
                clonedIcon.className = 'sb-appshell-v1-menu_utility-search-icon';
                utilityLink.appendChild(clonedIcon);
              }

              // テキストノードを直接追加
              utilityLink.appendChild(document.createTextNode(itemText));
              utilityItem.appendChild(utilityLink);
            } else {
              const utilitySpan = document.createElement('span');
              utilitySpan.className = 'sb-appshell-v1-menu_utility-search';
              utilitySpan.style.cursor = 'default';

              if (iconSpan) {
                const clonedIcon = iconSpan.cloneNode(true);
                clonedIcon.className = 'sb-appshell-v1-menu_utility-search-icon';
                utilitySpan.appendChild(clonedIcon);
              }

              utilitySpan.appendChild(document.createTextNode(itemText));
              utilityItem.appendChild(utilitySpan);
            }

            utilityList.appendChild(utilityItem);
          }
        });
      }
    }
  }

  utility.appendChild(utilityList);
  header.appendChild(utility);

  return header;
}

/**
 * SPメニューフッターを生成
 */
function createSPMenuFooter() {
  const footer = document.createElement('div');
  footer.className = 'sb-appshell-v1-menu_footer';

  // サポートセクション
  const support = document.createElement('div');
  support.className = 'sb-appshell-v1-menu_support';

  const supportList = document.createElement('div');
  supportList.className = 'sb-appshell-v1-menu_support-list sb-appshell-v1-menu_support-list-w100p';

  // お問い合わせ
  const contactItem = document.createElement('div');
  contactItem.className = 'sb-appshell-v1-menu_support-item';

  const contactLink = document.createElement('a');
  contactLink.href = '/biz/contact/';
  contactLink.className = 'sb-appshell-v1-menu_support-contact';
  contactLink.innerHTML = `<svg class="sb-appshell-v1-menu_support-contact-icon">
    <use xlink:href="#sunshine-icon-menu_support-contact">
      <svg viewBox="0 0 50 50" id="sunshine-icon-menu_support-contact">
        <path d="M45.63 5.09H24.94a4.36 4.36 0 0 0-4.37 4.37v5.6H4.37A4.37 4.37 0 0 0 0 19.43v13.21A4.37 4.37 0 0 0 4.37 37h1.12l-1.76 6.85a.93.93 0 0 0 .39.87.9.9 0 0 0 1 0l10-7.78h9.92a4.37 4.37 0 0 0 4.37-4.37V27h5.43l10 7.78a.9.9 0 0 0 .95 0 .94.94 0 0 0 .39-.87L44.51 27h1.12A4.37 4.37 0 0 0 50 22.67V9.46a4.37 4.37 0 0 0-4.37-4.37zM27.94 32.3a3.13 3.13 0 0 1-3.13 3.13H14.33l-2 1.58-6.55 5.27L7.21 37l.43-1.58h-3a3.13 3.13 0 0 1-3.15-3.12V19.77a3.13 3.13 0 0 1 3.13-3.13h20.19a3.13 3.13 0 0 1 3.13 3.13V32.3zm20.57-10a3.13 3.13 0 0 1-3.13 3.13h-3l.41 1.57 1.43 5.27L37.64 27l-2-1.58h-6.21v-6a4.37 4.37 0 0 0-4.37-4.37h-3V9.8a3.13 3.13 0 0 1 3.13-3.13h20.19a3.13 3.13 0 0 1 3.13 3.13z" fill="#8a8c8e"></path>
        <rect x="13.72" y="30.36" width="2.19" height="2.16" rx=".9" fill="#8a8c8e"></rect>
        <path d="M15 20.45h-.42a.9.9 0 0 0-.9.92l.21 6.82a.9.9 0 0 0 1.79 0l.22-6.82a.9.9 0 0 0-.9-.92z" fill="#8a8c8e"></path>
        <rect x="34.28" y="19.85" width="2.05" height="2.02" rx=".85" fill="#8a8c8e"></rect>
        <path d="M35.28 10.35a4.84 4.84 0 0 0-2.91.91.83.83 0 0 0-.29 1 .86.86 0 0 0 1.28.42 3.2 3.2 0 0 1 1.84-.56c1.2 0 1.95.69 1.95 1.57 0 .7-.37 1-1.34 1.81a3.34 3.34 0 0 0-1.42 2.72.85.85 0 0 0 .84.9h.18a.85.85 0 0 0 .85-.79 2.39 2.39 0 0 1 1-1.8c1-.93 1.74-1.57 1.74-2.9 0-1.63-1.31-3.28-3.72-3.28z" fill="#8a8c8e"></path>
      </svg>
    </use>
  </svg>お問い合わせ`;

  contactItem.appendChild(contactLink);
  supportList.appendChild(contactItem);

  // 法人コンシェルサイト
  const concierItem = document.createElement('div');
  concierItem.className = 'sb-appshell-v1-menu_support-item sb-appshell-v1-menu_support-item-ml0';

  const concierLink = document.createElement('a');
  concierLink.href = 'https://portal.business.mb.softbank.jp/portal/BPS0001/';
  concierLink.className = 'sb-appshell-v1-menu_support-bizconciersite';
  
  // 外部リンク判定
  if (isExternalLink(concierLink.href)) {
    concierLink.target = '_blank';
  }
  concierLink.innerHTML = `<svg class="sb-appshell-v1-menu_support-bizconciersite-icon">
    <use xlink:href="#sunshine-icon-menu_utility-bizconciersite02">
      <svg viewBox="0 0 80 80" id="sunshine-icon-menu_utility-bizconciersite02">
        <path d="M65.8 60.59H14.2a1.14 1.14 0 1 0 0 2.28h51.6a1.14 1.14 0 1 0 0-2.28zM41.17 26.82v-7.36H48a1.17 1.17 0 1 0 0-2.33H32a1.17 1.17 0 1 0 0 2.33h6.8v7.36A27.14 27.14 0 0 0 13 53.89a2.29 2.29 0 0 0 2.28 2.29h49.57A2.12 2.12 0 0 0 67 54.06a27.14 27.14 0 0 0-25.83-27.24zM15.45 53.89a24.56 24.56 0 1 1 49.11 0z" fill="#8a8c8e"></path>
      </svg>
    </use>
  </svg>法人コンシェルサイト`;

  concierItem.appendChild(concierLink);
  supportList.appendChild(concierItem);

  // 資料ダウンロード
  const documentsItem = document.createElement('div');
  documentsItem.className = 'sb-appshell-v1-menu_support-item sb-appshell-v1-menu_support-item-ml0';

  const documentsLink = document.createElement('a');
  documentsLink.href = '/biz/resources/documents/';
  documentsLink.className = 'sb-appshell-v1-menu_support-documents';
  
  // 外部リンク判定
  if (isExternalLink(documentsLink.href)) {
    documentsLink.target = '_blank';
  }
  documentsLink.innerHTML = `<svg class="sb-appshell-v1-menu_support-documents-icon">
    <use xlink:href="#sunshine-icon-menu_utility-documents"></use>
  </svg> 資料ダウンロード`;

  documentsItem.appendChild(documentsLink);
  supportList.appendChild(documentsItem);

  support.appendChild(supportList);
  footer.appendChild(support);

  // SVGシンボル定義
  const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgContainer.style.display = 'none';
  svgContainer.innerHTML = `<symbol viewBox="0 0 185.272 191.737" id="sunshine-icon-menu_utility-documents">
    <g>
      <path fill="#8a8c8e" stroke="rgba(0,0,0,0)" stroke-miterlimit="10" d="M86.587 179.272h-74.75a11.352 11.352 0 0 1-11.338-11.34V11.838A11.351 11.351 0 0 1 11.838.5h125.675a11.351 11.351 0 0 1 11.338 11.338V77.3a60.746 60.746 0 0 0-7.408-2.133V11.838a3.935 3.935 0 0 0-3.93-3.931H11.838a3.936 3.936 0 0 0-3.932 3.931v156.094a3.937 3.937 0 0 0 3.932 3.933h68.031a61.492 61.492 0 0 0 6.716 7.405Z"></path>
      <path fill="none" stroke="#8a8c8e" stroke-width="8" d="M34.772 50.025h79"></path>
      <path fill="none" stroke="#8a8c8e" stroke-width="8" d="M34.772 88.025h66.5"></path>
      <path fill="none" stroke="#8a8c8e" stroke-width="8" d="M34.772 126.025h39.9"></path>
      <g fill="none" stroke="#8a8c8e">
        <g stroke-width="8" transform="translate(71.035 77.501)">
          <circle cx="57.118" cy="57.118" r="57.118" stroke="none"></circle>
          <circle cx="57.118" cy="57.118" r="53.118"></circle>
        </g>
        <g stroke-width="9">
          <path d="m102.251 118.022 25.9 25.9 25.9-25.9"></path>
          <path d="M128.154 100.709v39.375"></path>
        </g>
        <path stroke-width="8" d="M100.809 161.705h55.295"></path>
      </g>
    </g>
  </symbol>`;

  footer.appendChild(svgContainer);

  return footer;
}

/**
 * SPメニュー生成
 * @param {Array} menuStructure メニュー構造
 * @param {Element} fragment オーサリング情報（fragment）
 */
function createSPMenu(menuStructure, fragment) {
  const menu = document.createElement('nav');
  menu.id = 'sb-appshell-v1-menu';
  menu.className = 'sb-appshell-v1-menu _ga_area_category_nav sb-appshell-v1-menu--hide visible-sp';

  const menuView = document.createElement('div');
  menuView.className = 'sb-appshell-v1-menu_view';

  // ヘッダー
  const menuHeader = createSPMenuHeader(fragment);
  menuView.appendChild(menuHeader);

  // タブパネル
  const tabDiv = document.createElement('div');
  tabDiv.className = 'sb-appshell-v1-menu_tab';

  const tabPanels = document.createElement('div');
  tabPanels.className = 'sb-appshell-v1-menu_tab-panels';

  const tabPanel = document.createElement('div');
  tabPanel.id = 'sb-appshell-v1-menu_tab-panel5';
  tabPanel.className = 'sb-appshell-v1-menu_tab-panel';
  tabPanel.setAttribute('role', 'tabpanel');
  tabPanel.setAttribute('aria-hidden', 'false');

  const dl = document.createElement('dl');

  const dt = document.createElement('dt');
  dt.className = 'sb-appshell-v1-menu_sitemap-category-title';
  dt.textContent = '法人のお客さま';

  const dd = document.createElement('dd');
  dd.className = 'sb-appshell-v1-menu_sitemap-lv3';

  const lv3List = document.createElement('ul');
  lv3List.className = 'sb-appshell-v1-menu_sitemap-lv3-list';

  menuStructure.forEach((menuItem) => {
    const lv3Item = createSPLv3Item(menuItem);
    lv3List.appendChild(lv3Item);
  });

  dd.appendChild(lv3List);
  dl.appendChild(dt);
  dl.appendChild(dd);
  tabPanel.appendChild(dl);
  tabPanels.appendChild(tabPanel);
  tabDiv.appendChild(tabPanels);
  menuView.appendChild(tabDiv);

  // フッター
  const menuFooter = createSPMenuFooter();
  menuView.appendChild(menuFooter);

  menu.appendChild(menuView);

  return menu;
}

/**
 * PC メガメニューの初期化とホバー処理
 */
function initPCMegaMenu(globalNav) {
  const globalnavLinks = globalNav.querySelectorAll('.sb-appshell-v1-header-nav_globalnav-link');
  const hSearch = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-search');
  const megadropdown = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown');
  const megadropdownContent = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-contents');

  if (!globalnavLinks.length || !megadropdown) return;

  // ステータス変数
  let isDropDownMenuOpen = false;
  let isNavigatorHover = false;
  let isDropDownMenuHover = false;

  // メニューを閉じる関数
  function closeMenuDropDown() {
    megadropdown.classList.remove('sb-appshell-v1-header-nav_megadropdown--show');
    Object.assign(megadropdown.style, {
      display: 'none',
      opacity: '0',
      height: 'auto',
      top: '28px',
    });
    if (megadropdownContent) {
      megadropdownContent.style = '';
    }
    globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-category-item').forEach((item) => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current'));
    if (hSearch) {
      hSearch.classList.remove('sb-appshell-v1-header-nav_megadropdown-header-search--open');
    }
    isDropDownMenuOpen = false;
  }

  // グローバルナビリンクのホバー処理
  globalnavLinks.forEach((globalnavLink) => {
    // マウスが乗ったとき
    globalnavLink.addEventListener('mouseenter', (e) => {
      isNavigatorHover = true;
      const menuHref = e.target.getAttribute('data-href');
      if (menuHref) {
        const categoryTarget = globalNav.querySelector(`.sb-appshell-v1-header-nav_megadropdown-category-item[data-sb-megadropdown-category="${menuHref}"]`);
        if (categoryTarget) {
          if (isDropDownMenuOpen && !categoryTarget.classList.contains('sb-appshell-v1-header-nav_megadropdown-category-item--current')) {
            // 既にメニューが開いている場合、カテゴリを切り替える
            globalnavLinks.forEach((link) => link.classList.remove('sb-appshell-v1-header-nav_globalnav-link--open'));
            e.target.classList.add('sb-appshell-v1-header-nav_globalnav-link--open');

            // 前のカテゴリをアニメーション
            const prevTarget = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-category-item.sb-appshell-v1-header-nav_megadropdown-category-item--current');
            if (prevTarget) {
              prevTarget.classList.add('sb-appshell-v1-header-nav_megadropdown-category-item--preview');
              prevTarget.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current');
              setTimeout(() => {
                prevTarget.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--preview');
              }, 700);

              // 高さのアニメーション
              if (megadropdownContent) {
                megadropdownContent.style.height = `${prevTarget.offsetHeight}px`;
                megadropdownContent.style.transition = 'height 0.4s';
                megadropdownContent.style.height = `${categoryTarget.offsetHeight}px`;
                setTimeout(() => {
                  megadropdownContent.style.height = 'auto';
                }, 400);
              }
            }

            // 現在のカテゴリをアクティブに
            categoryTarget.classList.add('sb-appshell-v1-header-nav_megadropdown-category-item--current');
          } else {
            // メニューを開く
            megadropdown.classList.add('sb-appshell-v1-header-nav_megadropdown--show');
            Object.assign(megadropdown.style, {
              display: 'block',
              opacity: '1',
              height: 'auto',
              top: '28px',
            });
            if (hSearch) {
              hSearch.classList.add('sb-appshell-v1-header-nav_megadropdown-header-search--open');
            }
            e.target.classList.add('sb-appshell-v1-header-nav_globalnav-link--open');
            categoryTarget.classList.add('sb-appshell-v1-header-nav_megadropdown-category-item--current');
            if (megadropdownContent) {
              megadropdownContent.style.height = 'auto';
            }
          }
          isDropDownMenuOpen = true;
        }
      } else if (isDropDownMenuOpen) {
        closeMenuDropDown();
      }
    });

    // マウスが離れたとき
    globalnavLink.addEventListener('mouseleave', (e) => {
      isNavigatorHover = false;
      e.target.classList.remove('sb-appshell-v1-header-nav_globalnav-link--open');
      setTimeout(() => {
        if (!isDropDownMenuHover && !isNavigatorHover) {
          closeMenuDropDown();
        }
      }, 100);
    });
  });

  // メガドロップダウンのホバー処理
  megadropdown.addEventListener('mouseenter', () => {
    isDropDownMenuHover = true;
  });

  megadropdown.addEventListener('mouseleave', () => {
    isDropDownMenuHover = true;

    setTimeout(() => { isDropDownMenuHover = false; }, 50);
    setTimeout(() => {
      if (!isDropDownMenuHover && !isNavigatorHover) {
        closeMenuDropDown();
      }
    }, 100);
  });

  // クローズボタン
  const closeButton = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-close-button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeMenuDropDown();
    });
  }

  // レベル5アコーディオン処理
  const lv5Items = globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5');
  if (lv5Items.length) {
    lv5Items.forEach((el) => {
      const lv4Item = el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item');
      const lv4Link = lv4Item?.querySelector('.sb-appshell-v1-header-nav_megadropdown-lv4-link');
      if (lv4Link && !lv4Link.classList.contains('sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion')) {
        lv4Link.classList.add('sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion');
        el.classList.add('disp-none');
        el.style.height = 'auto';
      }
    });

    globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion').forEach((accordion) => {
      accordion.addEventListener('click', (e) => {
        const el = e.target;
        const elParent = el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item');
        const targetItem = elParent.querySelector('.sb-appshell-v1-header-nav_megadropdown-lv5');
        const megadropdownWidth = megadropdown.clientWidth;
        const targetItemPosition = (el.getBoundingClientRect().left + window.scrollX)
          - (megadropdown.getBoundingClientRect().left + window.scrollX);

        if (elParent.classList.contains('sb-appshell-v1-header-nav_megadropdown-lv4--open')) {
          elParent.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open');
        } else {
          globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-item').forEach((item) => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open'));
          globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').forEach((item) => {
            item.classList.add('disp-none');
            item.style.setProperty('height', 'auto', 'important');
          });
          elParent.classList.add('sb-appshell-v1-header-nav_megadropdown-lv4--open');
        }

        Object.assign(targetItem.style, {
          width: `${megadropdownWidth}px`,
          transform: `translateX(-${targetItemPosition}px)`,
        });
        let initialHeight = targetItem.offsetHeight;
        if (targetItem.classList.contains('disp-none')) {
          targetItem.classList.remove('disp-none');
          initialHeight = targetItem.offsetHeight;
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: '0px' },
            { height: `${initialHeight}px` },
          ], { duration: 250, fill: 'forwards' });
        } else {
          targetItem.animate([
            { height: `${initialHeight}px` },
            { height: '0px' },
          ], { duration: 250, fill: 'forwards' });
        }
        e.stopImmediatePropagation();
      });
    });
  }
}

/**
 * SP メニューの初期化と操作
 */
function initSPMenu(globalNav) {
  const headerSpBtnOpen = globalNav.querySelector('.sb-appshell-v1-header_menu-button');
  const headerSpBtnClose = globalNav.querySelector('.sb-appshell-v1-menu_button-close');
  const headerSpMenu = globalNav.querySelector('#sb-appshell-v1-menu');

  if (!headerSpBtnOpen || !headerSpMenu) return;

  // メニューを開く
  headerSpBtnOpen.addEventListener('click', () => {
    if (headerSpMenu.classList.contains('sb-appshell-v1-menu--hide')) {
      headerSpMenu.classList.remove('sb-appshell-v1-menu--hide');
      headerSpMenu.classList.add('sb-appshell-v1-menu--show');
      Object.assign(headerSpMenu.style, {
        opacity: '0',
        display: 'block',
        top: '0',
        height: '100vh',
        'overflow-y': 'scroll',
      });

      headerSpMenu.animate([
        { opacity: 0 },
        { opacity: 1 },
      ], { duration: 400, fill: 'forwards' });
    } else {
      headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
      headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
      headerSpMenu.animate([
        { opacity: 1 },
        { opacity: 0 },
      ], { duration: 400, fill: 'forwards' }).onfinish = () => {
        headerSpMenu.style = '';
      };
    }
  });

  // メニューを閉じる
  if (headerSpBtnClose) {
    headerSpBtnClose.addEventListener('click', () => {
      headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
      headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
      headerSpMenu.animate([
        { opacity: 1 },
        { opacity: 0 },
      ], { duration: 400, fill: 'forwards' }).onfinish = () => {
        headerSpMenu.style = '';
      };
    });
  }

  // リサイズ時の処理
  const initHeaderSP = () => {
    if (document.documentElement.clientWidth >= 769 && headerSpMenu) {
      headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
      headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
      headerSpMenu.style = '';
    }
  };
  initHeaderSP();
  window.addEventListener('resize', () => {
    initHeaderSP();
  });

  // アコーディオン レベル3
  const lv4Items = globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4');
  if (lv4Items.length) {
    lv4Items.forEach((el) => {
      const lv3Item = el.closest('.sb-appshell-v1-menu_sitemap-lv3-item');
      const lv3Title = lv3Item?.querySelector('.sb-appshell-v1-menu_sitemap-lv3-title');
      if (lv3Title && !lv3Title.classList.contains('sb-appshell-v1-menu_sitemap-lv3-title--accordion')) {
        lv3Title.classList.add('sb-appshell-v1-menu_sitemap-lv3-title--accordion');
        el.classList.add('disp-none');
        el.style.height = 'auto';
      }
    });

    globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv3-title--accordion').forEach((accordion) => {
      accordion.addEventListener('click', (e) => {
        const el = e.target;
        const elParent = el.closest('.sb-appshell-v1-menu_sitemap-lv3-item');
        const targetItem = elParent.querySelector('.sb-appshell-v1-menu_sitemap-lv4');
        if (elParent.classList.contains('sb-appshell-v1-menu_sitemap-lv4--open')) {
          elParent.classList.remove('sb-appshell-v1-menu_sitemap-lv4--open');
          el.setAttribute('aria-expanded', 'false');
        } else {
          elParent.classList.add('sb-appshell-v1-menu_sitemap-lv4--open');
          el.setAttribute('aria-expanded', 'true');
        }
        let initialHeight = targetItem.offsetHeight;
        if (targetItem.classList.contains('disp-none')) {
          targetItem.classList.remove('disp-none');
          initialHeight = targetItem.offsetHeight;
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: '0px' },
            { height: `${initialHeight}px` },
          ], { duration: 250, fill: 'forwards' }).onfinish = () => {
            targetItem.style.setProperty('height', 'auto', 'important');
          };
        } else {
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: `${initialHeight}px` },
            { height: '0px' },
          ], { duration: 250, fill: 'forwards' }).onfinish = () => {
            targetItem.classList.add('disp-none');
            targetItem.style.setProperty('height', 'auto', 'important');
          };
        }
      });
    });
  }

  // アコーディオン レベル4
  const lv5Items = globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv5');
  if (lv5Items.length) {
    lv5Items.forEach((el) => {
      const lv4Item = el.closest('.sb-appshell-v1-menu_sitemap-lv4-item');
      const lv4Title = lv4Item?.querySelector('.sb-appshell-v1-menu_sitemap-lv4-title');
      if (lv4Title && !lv4Title.classList.contains('sb-appshell-v1-menu_sitemap-lv4-title--accordion')) {
        lv4Title.classList.add('sb-appshell-v1-menu_sitemap-lv4-title--accordion');
        el.classList.add('disp-none');
        el.style.height = 'auto';
      }
    });

    globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4-title--accordion').forEach((accordion) => {
      accordion.addEventListener('click', (e) => {
        const el = e.target;
        const elParent = el.closest('.sb-appshell-v1-menu_sitemap-lv4-item');
        const targetItem = elParent.querySelector('.sb-appshell-v1-menu_sitemap-lv5');
        if (elParent.classList.contains('sb-appshell-v1-menu_sitemap-lv5--open')) {
          elParent.classList.remove('sb-appshell-v1-menu_sitemap-lv5--open');
          el.setAttribute('aria-expanded', 'false');
        } else {
          elParent.classList.add('sb-appshell-v1-menu_sitemap-lv5--open');
          el.setAttribute('aria-expanded', 'true');
        }
        let initialHeight = targetItem.offsetHeight;
        if (targetItem.classList.contains('disp-none')) {
          targetItem.classList.remove('disp-none');
          initialHeight = targetItem.offsetHeight;
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: '0px' },
            { height: `${initialHeight}px` },
          ], { duration: 250, fill: 'forwards' }).onfinish = () => {
            targetItem.style.setProperty('height', 'auto', 'important');
          };
        } else {
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: `${initialHeight}px` },
            { height: '0px' },
          ], { duration: 250, fill: 'forwards' }).onfinish = () => {
            targetItem.classList.add('disp-none');
            targetItem.style.setProperty('height', 'auto', 'important');
          };
        }
        e.stopImmediatePropagation();
      });
    });
  }
}

/**
 * メインの公開関数：グローバルナビゲーション（ヘッダー全体）を構築する
 * @param {boolean} isDesktop デスクトップ表示かどうか（true: PC, false: SP）
 * @returns {Promise<HTMLElement>} グローバルナビゲーション要素（ヘッダー全体）
 */
export async function buildGlobalNav(isDesktop = true) {

  // オーサリング情報の取得
  const navMeta = getMetadata('global-nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : AUTHORING_INFO_PATH;
  const fragment = await loadFragment(navPath);

  // メガメニューデータ取得（header-megamenu-sample.json）
  const menuData = await fetchMegaMenuData(navPath);
  const menuStructure = convertFlatToHierarchy(menuData);

  // 全体のコンテナ
  const container = document.createElement('div');
  container.className = 'smb solutions globalnavi';

  if (isDesktop) {
    // PC用: PCヘッダーのみ生成
    const pcHeader = createPCHeader(menuStructure, fragment);
    container.appendChild(pcHeader);

    // PCイベント初期化（DOM追加後に実行）
    setTimeout(() => {
      initPCMegaMenu(container);
    }, 0);
  } else {
    // SP用: SPヘッダーとメニューのみ生成
    const { spFixedArea, spMenu } = createSPHeader(menuStructure, fragment);
    container.appendChild(spFixedArea);
    container.appendChild(spMenu);

    // SPイベント初期化（DOM追加後に実行）
    setTimeout(() => {
      initSPMenu(container);
    }, 0);
  }

  return container;
}

/**
 * PCヘッダー全体を生成
 */
function createPCHeader(menuStructure, fragment) {
  const pcHeader = document.createElement('div');
  pcHeader.className = 'header visible-pc header02';

  // ヘッダー内部
  const headerInner = document.createElement('div');
  headerInner.className = 'header__inner';

  // ロゴとタイトル部分の生成
  const headerTtl = document.createElement('div');
  headerTtl.className = 'header__ttl';

  // ロゴ部分
  const logoDiv = document.createElement('div');
  logoDiv.className = 'header__ttl__logo';
  const logoLink = document.createElement('a');
  logoLink.href = '/';

  // オーサリング情報: Section 1からロゴ画像を取得
  let logoImg = null;
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];
      let img = firstSection.querySelector('img');

      if (!img) {
        const p = firstSection.querySelector('p');
        if (p) {
          const link = p.querySelector('a');
          if (link) {
            const imgUrl = link.textContent.trim();
            if (imgUrl && (imgUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || imgUrl.includes('placehold'))) {
              img = document.createElement('img');
              img.src = imgUrl;
              img.alt = 'SoftBank';
            }
          }
        }
      }

      if (img) {
        logoImg = img.cloneNode ? img.cloneNode(true) : img;
        logoImg.alt = logoImg.alt || 'SoftBank';
      }
    }
  }

  if (logoImg) {
    logoLink.appendChild(logoImg);
  }
  logoDiv.appendChild(logoLink);
  headerTtl.appendChild(logoDiv);

  // オーサリング情報: Section 2からタイトル（法人のお客さま）を取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 1) {
      const info = extractParagraphInfo(sections[1]);
      
      if (info) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'header__ttl__item';

        if (info.hasLink) {
          const titleLink = document.createElement('a');
          titleLink.href = info.href;
          titleLink.textContent = info.text;
          titleDiv.appendChild(titleLink);
        } else {
          const titleSpan = document.createElement('span');
          titleSpan.textContent = info.text;
          titleDiv.appendChild(titleSpan);
        }

        headerTtl.appendChild(titleDiv);
      }
    }
  }

  headerInner.appendChild(headerTtl);
  pcHeader.appendChild(headerInner);

  // PCナビゲーション追加
  const pcNav = createPCNavigation(menuStructure);
  pcHeader.appendChild(pcNav);

  // ユーティリティメニュー（section3から取得）
  const utility = createUtilityMenu(fragment);
  pcHeader.appendChild(utility);

  return pcHeader;
}

/**
 * ユーティリティメニュー生成
 */
function createUtilityMenu(fragment) {
  const utility = document.createElement('div');
  utility.className = 'sb-appshell-v1-header_utility';

  const utilityList = document.createElement('div');
  utilityList.className = 'sb-appshell-v1-header_utility-list';

  // オーサリング情報: Section 3からユーティリティメニュー（お問い合わせ、ビジネスブログ）を取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 2) {
      const thirdSection = sections[2];
      const ul = thirdSection.querySelector('ul');

      if (ul) {
        const listItems = ul.querySelectorAll('li');

        listItems.forEach((li) => {
          const link = li.querySelector('a');
          const iconSpan = li.querySelector('.icon');
          let itemText = '';
          let itemHref = '';
          let hasLink = false;

          if (link) {
            itemHref = link.getAttribute('href') || '';
            itemText = link.textContent.trim();
            hasLink = !!itemHref;
          } else {
            const clonedLi = li.cloneNode(true);
            const clonedIconSpan = clonedLi.querySelector('.icon');
            if (clonedIconSpan) {
              clonedIconSpan.remove();
            }
            itemText = clonedLi.textContent.trim();
          }

          if (itemText) {
            const utilityItem = document.createElement('div');
            utilityItem.className = 'sb-appshell-v1-header_utility-item';

            if (hasLink) {
              const utilityLink = document.createElement('a');
              utilityLink.href = itemHref;
              utilityLink.className = 'sb-appshell-v1-header_utility-link';

              if (iconSpan) {
                utilityLink.appendChild(iconSpan.cloneNode(true));
              }

              const utilitySpan = document.createElement('span');
              utilitySpan.className = 'sb-appshell-v1-header_utility-link-inner';
              utilitySpan.textContent = itemText;

              utilityLink.appendChild(utilitySpan);
              utilityItem.appendChild(utilityLink);
            } else {
              const utilitySpan = document.createElement('span');
              utilitySpan.className = 'sb-appshell-v1-header_utility-link';
              utilitySpan.style.cursor = 'default';

              if (iconSpan) {
                utilitySpan.appendChild(iconSpan.cloneNode(true));
              }

              const textSpan = document.createElement('span');
              textSpan.className = 'sb-appshell-v1-header_utility-link-inner';
              textSpan.textContent = itemText;

              utilitySpan.appendChild(textSpan);
              utilityItem.appendChild(utilitySpan);
            }

            utilityList.appendChild(utilityItem);
          }
        });
      }
    }
  }

  // 検索ウィジェットを追加
  const searchUtilityItem = document.createElement('div');
  searchUtilityItem.className = 'sb-appshell-v1-header_utility-item sb-appshell-v1-header_utility-item--search';
  
  // 検索ウィジェット用のコンテナ
  const searchWidgetContainer = document.createElement('div');
  searchWidgetContainer.className = 'header-search-widget-container';
  
  searchUtilityItem.appendChild(searchWidgetContainer);
  utilityList.appendChild(searchUtilityItem);

  // 検索ウィジェットを初期化（DOMに追加された後に実行）
  setTimeout(() => {
    decorateSearchWidget(searchWidgetContainer);
  }, 0);

  // オーサリング情報: Section 4からボタンを取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 3) {
      const info = extractParagraphInfo(sections[3]);

      if (info) {
        const utilityItem = document.createElement('div');
        utilityItem.className = 'sb-appshell-v1-header_utility-item sb-appshell-v1-header_utility-item--bordered';

        if (info.hasLink) {
          const utilityLink = document.createElement('a');
          utilityLink.href = info.href;
          utilityLink.className = 'sb-appshell-v1-header_utility-link';

          const utilitySpan = document.createElement('span');
          utilitySpan.className = 'sb-appshell-v1-header_utility-link-inner';
          utilitySpan.textContent = info.text;

          utilityLink.appendChild(utilitySpan);
          utilityItem.appendChild(utilityLink);
        } else {
          const utilitySpan = document.createElement('span');
          utilitySpan.className = 'sb-appshell-v1-header_utility-link';
          utilitySpan.style.cursor = 'default';

          const textSpan = document.createElement('span');
          textSpan.className = 'sb-appshell-v1-header_utility-link-inner';
          textSpan.textContent = info.text;

          utilitySpan.appendChild(textSpan);
          utilityItem.appendChild(utilitySpan);
        }

        utilityList.appendChild(utilityItem);
      }
    }
  }

  utility.appendChild(utilityList);
  return utility;
}

/**
 * SPヘッダー全体を生成
 */
function createSPHeader(menuStructure, fragment) {
  // SPヘッダー（固定エリア）
  const spFixedArea = document.createElement('div');
  spFixedArea.id = 'sb-appshell-v1-header-fixed-area';
  spFixedArea.className = 'sb-appshell-v1-header-fixed-area header visible-sp';

  const spFixedAreaInner = document.createElement('div');
  spFixedAreaInner.className = 'sb-appshell-v1-header-fixed-area_inner';

  const spHeader = document.createElement('header');
  spHeader.id = 'sb-appshell-v1-header';
  spHeader.className = 'sb-appshell-v1-header _ga_area_header';

  // SPヘッダー内のロゴとタイトル
  const spHeaderInner = document.createElement('div');
  spHeaderInner.className = 'sb-appshell-v1-header_inner';

  const spLogo = document.createElement('div');
  spLogo.className = 'sb-appshell-v1-header_inner__logo';
  const spLogoLink = document.createElement('a');
  spLogoLink.href = '/';
  spLogoLink.className = 'sb-appshell-v1-header_inner__logo__image';

  // fragmentから画像を取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];
      let img = firstSection.querySelector('img');

      if (!img) {
        const p = firstSection.querySelector('p');
        if (p) {
          const link = p.querySelector('a');
          if (link) {
            const imgUrl = link.textContent.trim();
            if (imgUrl && (imgUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || imgUrl.includes('placehold'))) {
              spLogoLink.style.backgroundImage = `url(${imgUrl})`;
            }
          }
        }
      } else if (img.src) {
        spLogoLink.style.backgroundImage = `url(${img.src})`;
      }
    }
  }

  spLogo.appendChild(spLogoLink);
  spHeaderInner.appendChild(spLogo);

  // SPタイトル部分（section2から取得）
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 1) {
      const info = extractParagraphInfo(sections[1]);

      if (info) {
        const spItem = document.createElement('div');
        spItem.className = 'sb-appshell-v1-header_inner__item';

        if (info.hasLink) {
          const spItemLink = document.createElement('a');
          spItemLink.href = info.href;
          spItemLink.textContent = info.text;
          spItem.appendChild(spItemLink);
        } else {
          const spItemSpan = document.createElement('span');
          spItemSpan.textContent = info.text;
          spItem.appendChild(spItemSpan);
        }

        spHeaderInner.appendChild(spItem);
      }
    }
  }

  // SPユーティリティ（MENUボタン）
  const spUtility = document.createElement('div');
  spUtility.className = 'sb-appshell-v1-header_utility';

  const menuButton = document.createElement('button');
  menuButton.className = 'sb-appshell-v1-header_button-category sb-appshell-v1-header_menu-button sb-appshell-v1-header_menu-button--active';
  menuButton.setAttribute('role', 'button');
  menuButton.setAttribute('tabindex', '0');
  menuButton.setAttribute('data-sb-appshell-v1-button', 'category-menu');
  menuButton.setAttribute('aria-pressed', 'false');

  const borderTop = document.createElement('span');
  borderTop.className = 'sb-appshell-v1-header_menu-button-border sb-appshell-v1-header_menu-button-border-top';

  const borderMiddle = document.createElement('span');
  borderMiddle.className = 'sb-appshell-v1-header_menu-button-border sb-appshell-v1-header_menu-button-border-middle';

  const borderBottom = document.createElement('span');
  borderBottom.className = 'sb-appshell-v1-header_menu-button-border sb-appshell-v1-header_menu-button-border-bottom';

  const menuText = document.createElement('span');
  menuText.className = 'sb-appshell-v1-header_menu-button-text';
  menuText.textContent = 'MENU';

  menuButton.appendChild(borderTop);
  menuButton.appendChild(borderMiddle);
  menuButton.appendChild(borderBottom);
  menuButton.appendChild(menuText);

  spUtility.appendChild(menuButton);

  spHeader.appendChild(spHeaderInner);
  spHeader.appendChild(spUtility);

  spFixedAreaInner.appendChild(spHeader);
  spFixedArea.appendChild(spFixedAreaInner);

  // SPメニュー
  const spMenu = createSPMenu(menuStructure, fragment);

  return { spFixedArea, spMenu };
}

