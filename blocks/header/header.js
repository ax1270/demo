import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// 定数定義
const MEGAMENU_FILENAME = 'header-megamenu.json';

/**
 * メガメニューデータを取得する関数
 * @param {string} navPath ナビゲーションパス
 * @returns {Promise<Array>} メガメニューデータ
 */
async function fetchMegaMenuData(navPath) {
  // const navDir = navPath.substring(0, navPath.lastIndexOf('/'));
  // const megamenuPath = `${navDir}/${MEGAMENU_FILENAME}`;
  const megamenuPath = '/docs/header-megamenu-sample.json';
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
    if (menuItem.target) a.target = menuItem.target;

    const span = document.createElement('span');
    span.className = 'sb-appshell-v1-header-nav_globalnav-link-inner';
    span.textContent = menuItem.label;

    a.appendChild(span);
    li.appendChild(a);
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
    if (menuItem.target) {
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
      if (item.target) topLink.target = item.target;

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
        if (child.target) lv5Link.target = child.target;

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
    if (item.target) link.target = item.target;

    container.appendChild(link);
    li.appendChild(container);
  }

  return li;
}

/**
 * PCメガドロップダウン全体を生成
 */
function createPCMegadropdown(menuStructure) {
  const megadropdown = document.createElement('div');
  megadropdown.className = 'sb-appshell-v1-header-nav_megadropdown _ga_area_category_nav';
  megadropdown.style.cssText = 'display: none; opacity: 0; height: auto; top: 28px;';

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

  footerSupportList.appendChild(documentsLink);
  footerSupport.appendChild(footerSupportList);
  footer.appendChild(footerSupport);

  const footerEnglish = document.createElement('div');
  footerEnglish.className = 'sb-appshell-v1-header-nav_megadropdown-footer-english';

  const englishLink = document.createElement('a');
  englishLink.href = 'https://global.tm.softbank.jp/en/';
  englishLink.className = 'sb-appshell-v1-header-nav_megadropdown-footer-english-button';

  const englishSpan = document.createElement('span');
  englishSpan.className = 'sb-appshell-v1-header-nav_megadropdown-footer-english-button-inner';
  englishSpan.textContent = 'ENGLISH';

  englishLink.appendChild(englishSpan);
  footerEnglish.appendChild(englishLink);
  footer.appendChild(footerEnglish);

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
    if (menuItem.target) link.target = menuItem.target;

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
      if (item.target) topLink.target = item.target;

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
      if (child.target) link.target = child.target;

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
    if (item.target) link.target = item.target;

    li.appendChild(link);
  }

  return li;
}

/**
 * SPメニュー生成
 */
function createSPMenu(menuStructure) {
  const menu = document.createElement('nav');
  menu.id = 'sb-appshell-v1-menu';
  menu.className = 'sb-appshell-v1-menu _ga_area_category_nav sb-appshell-v1-menu--hide visible-sp';

  const menuView = document.createElement('div');
  menuView.className = 'sb-appshell-v1-menu_view';

  // ヘッダー部分は既存のフラグメントから取得するため、ここではスキップ

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
  menu.appendChild(menuView);

  return menu;
}

/**
 * ヘッダーのデコレート
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // メガメニューデータ取得
    const menuData = await fetchMegaMenuData(navPath);
  const menuStructure = convertFlatToHierarchy(menuData);

  // PCヘッダー
  const pcHeader = document.createElement('header');
  pcHeader.className = 'header visible-pc header02';

  // ヘッダー内部（既存のフラグメントから取得）
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

  // fragmentから画像を取得
  let logoImg = null;
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];
      
      // まずimgタグを探す（EDSが自動変換済みの場合）
      let img = firstSection.querySelector('img');
      
      // imgタグがない場合、p > a のテキストから画像URLを取得
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

  // 画像が取得できなかった場合のフォールバック
  if (!logoImg) {
    logoImg = document.createElement('img');
    logoImg.src = '//cdn.softbank.jp/site/set/common/sunshine/shared/img/logo-sb.svg';
    logoImg.alt = 'SoftBank';
  }

  logoLink.appendChild(logoImg);
  logoDiv.appendChild(logoLink);
  headerTtl.appendChild(logoDiv);

  // タイトル部分（section2から取得）
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 1) {
      const secondSection = sections[1];
      const p = secondSection.querySelector('p');
      if (p) {
        const link = p.querySelector('a');
        let titleText = '';
        let titleHref = '';
        let hasLink = false;
        
        if (link) {
          titleHref = link.getAttribute('href') || '';
          titleText = link.textContent.trim();
          hasLink = !!titleHref;
        } else {
          // リンクがない場合はpタグのテキストを使用
          titleText = p.textContent.trim();
        }
        
        // テキストがある場合のみタイトル部分を追加
        if (titleText) {
          const titleDiv = document.createElement('div');
          titleDiv.className = 'header__ttl__item';
          
          if (hasLink) {
            // リンクがある場合はaタグ
            const titleLink = document.createElement('a');
            titleLink.href = titleHref;
            titleLink.textContent = titleText;
            titleDiv.appendChild(titleLink);
          } else {
            // リンクがない場合はspanタグ
            const titleSpan = document.createElement('span');
            titleSpan.textContent = titleText;
            titleDiv.appendChild(titleSpan);
          }
          
          headerTtl.appendChild(titleDiv);
        }
      }
    }
  }

  headerInner.appendChild(headerTtl);

  pcHeader.appendChild(headerInner);

  // PCナビゲーション追加
  const pcNav = createPCNavigation(menuStructure);
  pcHeader.appendChild(pcNav);

  // ユーティリティメニュー（section3から取得）
  const utility = document.createElement('div');
  utility.className = 'sb-appshell-v1-header_utility';

  const utilityList = document.createElement('div');
  utilityList.className = 'sb-appshell-v1-header_utility-list';

  // section3からユーティリティメニュー項目を取得
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
            // リンクがない場合はliのテキストを使用（アイコン部分を除外）
            const clonedLi = li.cloneNode(true);
            const clonedIconSpan = clonedLi.querySelector('.icon');
            if (clonedIconSpan) {
              clonedIconSpan.remove();
            }
            itemText = clonedLi.textContent.trim();
          }
          
          // テキストがある場合のみアイテムを追加
          if (itemText) {
            const utilityItem = document.createElement('div');
            utilityItem.className = 'sb-appshell-v1-header_utility-item';
            
            if (hasLink) {
              // リンクがある場合はaタグ
              const utilityLink = document.createElement('a');
              utilityLink.href = itemHref;
              utilityLink.className = 'sb-appshell-v1-header_utility-link';
              
              // アイコンがある場合はそのまま追加
              if (iconSpan) {
                utilityLink.appendChild(iconSpan.cloneNode(true));
              }
              
              const utilitySpan = document.createElement('span');
              utilitySpan.className = 'sb-appshell-v1-header_utility-link-inner';
              utilitySpan.textContent = itemText;
              
              utilityLink.appendChild(utilitySpan);
              utilityItem.appendChild(utilityLink);
            } else {
              // リンクがない場合はspanタグ
              const utilitySpan = document.createElement('span');
              utilitySpan.className = 'sb-appshell-v1-header_utility-link';
              utilitySpan.style.cursor = 'default';
              
              // アイコンがある場合はそのまま追加
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

  utility.appendChild(utilityList);
  pcHeader.appendChild(utility);

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

  // fragmentから画像を取得（PC版と同じロジック）
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];

      // まずimgタグを探す
      let img = firstSection.querySelector('img');

      // imgタグがない場合、p > a のテキストから画像URLを取得
      if (!img) {
        const p = firstSection.querySelector('p');
        if (p) {
          const link = p.querySelector('a');
          if (link) {
            const imgUrl = link.textContent.trim();
            if (imgUrl && (imgUrl.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || imgUrl.includes('placehold'))) {
              // SP用はbackground-imageでロゴを表示するので、style属性に設定
              spLogoLink.style.backgroundImage = `url(${imgUrl})`;
            }
          }
        }
      } else if (img.src) {
        // imgタグがある場合もbackground-imageに設定
        spLogoLink.style.backgroundImage = `url(${img.src})`;
      }
    }
  }

  // 画像が取得できなかった場合のフォールバック（デフォルトロゴ）
  if (!spLogoLink.style.backgroundImage) {
    spLogoLink.style.backgroundImage = 'url(https://cdn.softbank.jp/site/set/common/sunshine/shared/img/logo-sb.svg)';
  }

  spLogoLink.textContent = 'SoftBank';
  spLogo.appendChild(spLogoLink);
  spHeaderInner.appendChild(spLogo);

  // SPタイトル部分（section2から取得、PC版と同じロジック）
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 1) {
      const secondSection = sections[1];
      const p = secondSection.querySelector('p');
      if (p) {
        const link = p.querySelector('a');
        let spTitleText = '';
        let spTitleHref = '';
        let spHasLink = false;
        
        if (link) {
          spTitleHref = link.getAttribute('href') || '';
          spTitleText = link.textContent.trim();
          spHasLink = !!spTitleHref;
        } else {
          // リンクがない場合はpタグのテキストを使用
          spTitleText = p.textContent.trim();
        }
        
        // テキストがある場合のみタイトル部分を追加
        if (spTitleText) {
          const spItem = document.createElement('div');
          spItem.className = 'sb-appshell-v1-header_inner__item';
          
          if (spHasLink) {
            // リンクがある場合はaタグ
            const spItemLink = document.createElement('a');
            spItemLink.href = spTitleHref;
            spItemLink.textContent = spTitleText;
            spItem.appendChild(spItemLink);
          } else {
            // リンクがない場合はspanタグ
            const spItemSpan = document.createElement('span');
            spItemSpan.textContent = spTitleText;
            spItem.appendChild(spItemSpan);
          }
          
          spHeaderInner.appendChild(spItem);
        }
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
  const spMenu = createSPMenu(menuStructure);

  // 全体のコンテナ
  const container = document.createElement('div');
  container.className = 'smb solutions globalnavi';
  container.appendChild(pcHeader);
  container.appendChild(spFixedArea);
  container.appendChild(spMenu);

  block.textContent = '';
  block.appendChild(container);

  // PC メガメニューの初期化
  initPCMegaMenu();

  // SP メニューの初期化
  initSPMenu();
}

/**
 * PC メガメニューの初期化とホバー処理
 */
function initPCMegaMenu() {
  const globalnavLinks = document.querySelectorAll('.sb-appshell-v1-header-nav_globalnav-link');
  const hSearch = document.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-search');
  const megadropdown = document.querySelector('.sb-appshell-v1-header-nav_megadropdown');
  const megadropdownContent = document.querySelector('.sb-appshell-v1-header-nav_megadropdown-contents');

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
    document.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-category-item').forEach((item) => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current'));
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
        const categoryTarget = document.querySelector(`.sb-appshell-v1-header-nav_megadropdown-category-item[data-sb-megadropdown-category="${menuHref}"]`);
        if (categoryTarget) {
          if (isDropDownMenuOpen && !categoryTarget.classList.contains('sb-appshell-v1-header-nav_megadropdown-category-item--current')) {
            // 既にメニューが開いている場合、カテゴリを切り替える
            globalnavLinks.forEach((link) => link.classList.remove('sb-appshell-v1-header-nav_globalnav-link--open'));
            e.target.classList.add('sb-appshell-v1-header-nav_globalnav-link--open');

            // 前のカテゴリをアニメーション
            const prevTarget = document.querySelector('.sb-appshell-v1-header-nav_megadropdown-category-item.sb-appshell-v1-header-nav_megadropdown-category-item--current');
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
  const closeButton = document.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-close-button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeMenuDropDown();
    });
  }

  // レベル5アコーディオン処理
  const lv5Items = document.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5');
  if (lv5Items.length) {
    lv5Items.forEach((el) => {
      const lv4Item = el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item');
      const lv4Link = lv4Item?.querySelector('.sb-appshell-v1-header-nav_megadropdown-lv4-link');
      if (lv4Link) {
        lv4Link.classList.add('sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion');
        el.classList.add('disp-none');
        // eslint-disable-next-line no-param-reassign
        el.style.height = 'auto';
      }
    });

    document.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion').forEach((accordion) => {
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
          document.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-item').forEach((item) => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open'));
          document.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').forEach((item) => {
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
          // eslint-disable-next-line no-param-reassign
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
function initSPMenu() {
  const headerSpBtnOpen = document.querySelector('.sb-appshell-v1-header_menu-button');
  const headerSpBtnClose = document.querySelector('.sb-appshell-v1-menu_button-close');
  const headerSpMenu = document.querySelector('#sb-appshell-v1-menu');

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
  const lv4Items = document.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4');
  if (lv4Items.length) {
    lv4Items.forEach((el) => {
      const lv3Item = el.closest('.sb-appshell-v1-menu_sitemap-lv3-item');
      const lv3Title = lv3Item?.querySelector('.sb-appshell-v1-menu_sitemap-lv3-title');
      if (lv3Title) {
        lv3Title.classList.add('sb-appshell-v1-menu_sitemap-lv3-title--accordion');
        el.classList.add('disp-none');
        // eslint-disable-next-line no-param-reassign
        el.style.height = 'auto';
      }
    });

    document.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv3-title--accordion').forEach((accordion) => {
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
          // eslint-disable-next-line no-param-reassign
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: '0px' },
            { height: `${initialHeight}px` },
          ], { duration: 250, fill: 'forwards' }).onfinish = () => {
            targetItem.style.setProperty('height', 'auto', 'important');
          };
        } else {
          // eslint-disable-next-line no-param-reassign
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
  const lv5Items = document.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv5');
  if (lv5Items.length) {
    lv5Items.forEach((el) => {
      const lv4Item = el.closest('.sb-appshell-v1-menu_sitemap-lv4-item');
      const lv4Title = lv4Item?.querySelector('.sb-appshell-v1-menu_sitemap-lv4-title');
      if (lv4Title) {
        lv4Title.classList.add('sb-appshell-v1-menu_sitemap-lv4-title--accordion');
        el.classList.add('disp-none');
        // eslint-disable-next-line no-param-reassign
        el.style.height = 'auto';
      }
    });

    document.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4-title--accordion').forEach((accordion) => {
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
          // eslint-disable-next-line no-param-reassign
          targetItem.style.height = '0px';
          targetItem.animate([
            { height: '0px' },
            { height: `${initialHeight}px` },
          ], { duration: 250, fill: 'forwards' }).onfinish = () => {
            targetItem.style.setProperty('height', 'auto', 'important');
          };
        } else {
          // eslint-disable-next-line no-param-reassign
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
