/**
 * グローバルナビゲーションをDOM生成で構築する
 * 
 * データソース:
 * ①メガメニューデータ: header-megamenu-sample.json からメニュー構造を取得
 * ②オーサリング情報: /global-nav (EDSのdoc) から以下を取得
 *   - Section 1: ロゴ画像
 *   - Section 2: タイトル（法人のお客さま）とリンク（PC／SP共通）
 *   - Section 3: ユーティリティメニュー（PC専用）
 *   - Section 4: ユーティリティメニュー（SP専用）
 *   - Section 5: 資料ダウンロード（PC／SP共通）
 */

import { loadFragment } from '../blocks/fragment/fragment.js';
import { getMetadata } from './aem.js';
import decorateSearchWidget from '../blocks/index-search-widget/index-search-widget.js';
import { wrapImgsInLinks, isExternalLink, extractParagraphInfo } from './utils/common.js';

// 定数定義
const MEGAMENU_FILENAME = 'header-megamenu.json';
const AUTHORING_INFO_PATH = '/global-nav';
const LANGUAGE_BUTTON_NAME = 'ENGLISH';

// リンク設定
const ENGLISH_LINK = '/sb/en/demo';

/**
 * メガメニューデータを取得する関数
 * @param {string} navPath ナビゲーションパス
 * @returns {Promise<Array>} メガメニューデータ
 */
async function fetchMegaMenuData(navPath) {
  const navDir = navPath.substring(0, navPath.lastIndexOf('/'));
  const megamenuPath = `${navDir}/${MEGAMENU_FILENAME}`;
  
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
 * ユーティリティエリアから[VertexAI]で始まるテキストを検索し、プレースホルダーとアイコンを取得
 * @param {Element} fragment オーサリング情報（fragment）
 * @param {number} sectionIndex セクションのインデックス（PC用は2、SP用は3）
 * @returns {{placeholderText: string|null, iconElement: Element|null}} プレースホルダーテキストとアイコン要素
 */
function getSearchWidgetInfo(fragment, sectionIndex) {
  const result = {
    placeholderText: null,
    iconElement: null
  };

  if (!fragment) return result;

  const sections = fragment.querySelectorAll('.section');
  if (sections.length <= sectionIndex) return result;

  const section = sections[sectionIndex];
  const ul = section.querySelector('ul');
  if (!ul) return result;

  const listItems = ul.querySelectorAll('li');
  
  // 全てのli要素をチェック
  for (const li of listItems) {
    let itemText = '';
    const link = li.querySelector('a');
    
    if (link) {
      itemText = link.textContent.trim();
    } else {
      const clonedLi = li.cloneNode(true);
      const iconSpan = clonedLi.querySelector('.icon');
      if (iconSpan) {
        iconSpan.remove();
      }
      itemText = clonedLi.textContent.trim();
    }

    // [VertexAI]で始まるかチェック
    if (itemText.startsWith('[VertexAI]')) {
      // [VertexAI]より後続の文字列をプレースホルダーとして取得
      result.placeholderText = itemText.substring('[VertexAI]'.length).trim();
      
      // アイコンを取得
      const iconSpan = li.querySelector('.icon');
      if (iconSpan) {
        result.iconElement = iconSpan.cloneNode(true);
      }
      
      return result;
    }
  }

  return result;
}

/**
 * 検索ウィジェットを生成する共通関数
 * @param {string} containerClassName 検索ウィジェットコンテナのクラス名
 * @param {string|null} placeholderTextContent プレースホルダーテキスト（nullの場合は設定しない）
 * @param {Element|null} iconElement アイコン要素（nullの場合は設定しない）
 * @returns {HTMLElement} 検索ウィジェットコンテナ
 */
function createSearchWidget(containerClassName, placeholderTextContent = null, iconElement = null) {
  const searchWidgetContainer = document.createElement('div');
  searchWidgetContainer.className = containerClassName;
  
  // プレースホルダーテキストがある場合のみp要素を追加
  if (placeholderTextContent) {
    const placeholderText = document.createElement('p');
    placeholderText.textContent = placeholderTextContent;
    searchWidgetContainer.appendChild(placeholderText);
  }
  
  // 検索ウィジェットを初期化（DOMに追加された後に実行）
  setTimeout(() => {
    decorateSearchWidget(searchWidgetContainer);
    
    // .search-iconが作成されるのを待つ
    const applyIconStyling = () => {
      const searchIcon = searchWidgetContainer.querySelector('.search-icon');
      if (searchIcon) {
        // アイコン要素が提供された場合、検索アイコンを置き換える
        if (iconElement) {
          // 既存のスタイルをクリア（背景画像を削除）
          searchIcon.style.backgroundImage = 'none';
          // オーサリングのアイコンを挿入
          searchIcon.innerHTML = '';
          searchIcon.appendChild(iconElement);
        } else {
          // アイコン要素がない場合は非表示にする
          searchIcon.style.display = 'none';
        }
        return true;
      }
      return false;
    };
    
    // 即座に試す
    if (!applyIconStyling()) {
      // 見つからない場合はMutationObserverで監視
      const observer = new MutationObserver(() => {
        if (applyIconStyling()) {
          observer.disconnect();
        }
      });
      
      observer.observe(searchWidgetContainer, {
        childList: true,
        subtree: true
      });
    }
  }, 0);

  return searchWidgetContainer;
}

/**
 * 資料ダウンロードリンクを生成する共通関数
 * @param {Element} fragment オーサリング情報（fragment）
 * @param {boolean} isSP SP用かどうか
 * @returns {HTMLElement|null} 資料ダウンロード要素（存在しない場合はnull）
 */
function createDocumentsLink(fragment, isSP = false) {
  if (!fragment) return null;

  const sections = fragment.querySelectorAll('.section');
  if (sections.length <= 4) return null;

  const fifthSection = sections[4];
  const info = extractParagraphInfo(fifthSection);

  if (!info || !info.text) return null;

  if (isSP) {
    // SP用: supportItemでラップ
    const supportItem = document.createElement('div');
    supportItem.className = 'sb-appshell-v1-menu_support-item sb-appshell-v1-menu_support-item-ml0';

    const element = info.hasLink ? document.createElement('a') : document.createElement('span');
    element.className = 'sb-appshell-v1-menu_support-documents';
    
    if (info.hasLink) {
      element.href = info.href;
      if (isExternalLink(element.href)) {
        element.target = '_blank';
      }
    } else {
      element.style.cursor = 'default';
    }

    // アイコンを追加
    const iconSpan = fifthSection.querySelector('.icon');
    if (iconSpan) {
      const clonedIcon = iconSpan.cloneNode(true);
      if (!clonedIcon.classList.contains('icon')) {
        clonedIcon.classList.add('icon');
      }
      clonedIcon.classList.add('sb-appshell-v1-menu_support-documents-icon');
      element.appendChild(clonedIcon);
    }

    element.appendChild(document.createTextNode(info.text));
    supportItem.appendChild(element);
    return supportItem;
  } else {
    // PC用: シンプルなaタグ
    const documentsLink = document.createElement('a');
    documentsLink.href = info.href;
    documentsLink.className = 'sb-appshell-v1-header-nav_megadropdown-footer-support-link sb-appshell-v1-header-nav_megadropdown-footer-support-link-documents';
    documentsLink.textContent = info.text;
    
    if (isExternalLink(documentsLink.href)) {
      documentsLink.target = '_blank';
    }

    return documentsLink;
  }
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
    // data-href属性にはlinkを使用（メガメニューとのマッチングに使用）
    div.setAttribute('data-href', menuItem.link || menuItem.id);

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
    
    // 外部リンク判定
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
    
    // 外部リンク判定
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
  // data-sb-megadropdown-category属性にはlinkを使用（グローバルナビとのマッチングに使用）
  categoryDiv.setAttribute('data-sb-megadropdown-category', menuItem.link || menuItem.id);

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
 * @param {Array} menuStructure メニュー構造
 * @param {Element} fragment オーサリング情報（fragment）
 */
function createPCMegadropdown(menuStructure, fragment) {
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

  // オーサリング情報: Section 5から資料ダウンロードを取得（PC専用）
  const documentsLink = createDocumentsLink(fragment, false);
  if (documentsLink) {
    footerSupportList.appendChild(documentsLink);
  }
  
  footerSupport.appendChild(footerSupportList);
  footer.appendChild(footerSupport);

  viewInner.appendChild(footer);
  view.appendChild(viewInner);
  megadropdown.appendChild(view);

  return megadropdown;
}

/**
 * PCナビゲーション生成
 * @param {Array} menuStructure メニュー構造
 * @param {Element} fragment オーサリング情報（fragment）
 */
function createPCNavigation(menuStructure, fragment) {
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
  const megadropdown = createPCMegadropdown(menuStructure, fragment);
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
    
    // 外部リンク判定
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
      
      // 外部リンク判定
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
      
      // 外部リンク判定
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
    
    // 外部リンク判定
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

  // ヘッダーナビゲーション（ホーム、ENGLISH）
  const headerNav = document.createElement('div');
  headerNav.className = 'sb-appshell-v1-menu_header-nav';

  // ホームリンク
  const homeLink = document.createElement('a');
  homeLink.className = 'sb-appshell-v1-menu_link-home';
  
  // オーサリング情報: Section 1からリンク先を取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];
      
      // aタグが存在する場合、そのhrefを使用
      const link = firstSection.querySelector('a');
      if (link && link.href) {
        homeLink.href = link.href;
      }
    }
  }
  
  // ホームアイコンを生成
  const homeIconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  homeIconSvg.setAttribute('class', 'sb-appshell-v1-menu_link-home-icon');
  homeIconSvg.innerHTML = `
    <use xlink:href="#sunshine-icon-menu_link-home">
      <svg viewBox="0 0 32 32" id="sunshine-icon-menu_link-home">
        <path d="M31.82 17L16.41 2.26a.59.59 0 0 0-.82 0L.18 17a.61.61 0 0 0 0 .84.61.61 0 0 0 .84 0l2.83-2.74v14.21a.56.56 0 0 0 .18.42.58.58 0 0 0 .41.17h7.68a.59.59 0 0 0 .59-.6v-9.53h6.58v9.53a.59.59 0 0 0 .59.6h7.68a.58.58 0 0 0 .41-.17.56.56 0 0 0 .18-.42V15.1L31 17.83a.57.57 0 0 0 .41.16.61.61 0 0 0 .43-.18.61.61 0 0 0-.02-.81zM27 28.72h-6.53v-9.54a.58.58 0 0 0-.59-.59h-7.76a.58.58 0 0 0-.59.59v9.53H5V14L16 3.51 27 14z" fill="#cbcccc"></path>
      </svg>
    </use>
  `;
  homeLink.appendChild(homeIconSvg);
  homeLink.appendChild(document.createTextNode('ホーム'));
  headerNav.appendChild(homeLink);

  // ENGLISHボタン
  const englishLink = document.createElement('a');
  englishLink.href = ENGLISH_LINK;
  englishLink.className = 'sb-appshell-v1-menu_link-english';
  englishLink.textContent = LANGUAGE_BUTTON_NAME;
  headerNav.appendChild(englishLink);

  header.appendChild(headerNav);

  // 検索ウィジェット
  const searchContainer = document.createElement('div');
  searchContainer.className = 'sb-appshell-v1-menu_header-search';
  
  // Section 4（SP用ユーティリティメニュー）からプレースホルダーテキストとアイコンを取得
  const searchWidgetInfo = getSearchWidgetInfo(fragment, 3);
  const searchWidgetContainer = createSearchWidget('sp-header-search-widget-container', searchWidgetInfo.placeholderText, searchWidgetInfo.iconElement);
  searchContainer.appendChild(searchWidgetContainer);
  header.appendChild(searchContainer);

  // 閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'sb-appshell-v1-menu_button-close';
  closeButton.setAttribute('aria-label', 'メニューを閉じる');

  header.appendChild(closeButton);

  return header;
}

/**
 * SPメニューフッターを生成
 * @param {Element} fragment オーサリング情報（fragment）
 */
function createSPMenuFooter(fragment) {
  const footer = document.createElement('div');
  footer.className = 'sb-appshell-v1-menu_footer';

  // サポートセクション
  const support = document.createElement('div');
  support.className = 'sb-appshell-v1-menu_support';

  const supportList = document.createElement('div');
  supportList.className = 'sb-appshell-v1-menu_support-list sb-appshell-v1-menu_support-list-w100p';

  // オーサリング情報: Section 4からすべてのユーティリティメニュー項目を取得（SP専用）
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 3) {
      const fourthSection = sections[3];
      const ul = fourthSection.querySelector('ul');

      if (ul) {
        const listItems = ul.querySelectorAll('li');
        let addedItemCount = 0; // 実際に追加されたアイテムの数

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

          // [VertexAI]で始まる項目はスキップ（検索ウィジェット用のみ）
          if (itemText && !itemText.startsWith('[VertexAI]')) {
            const supportItem = document.createElement('div');
            // 最初のアイテムはml0なし、2つ目以降はml0を追加
            supportItem.className = addedItemCount === 0 
              ? 'sb-appshell-v1-menu_support-item' 
              : 'sb-appshell-v1-menu_support-item sb-appshell-v1-menu_support-item-ml0';

            if (hasLink) {
              const supportLink = document.createElement('a');
              supportLink.href = itemHref;
              // 最初のアイテムはcontactクラス、2つ目以降は汎用クラス
              supportLink.className = addedItemCount === 0 
                ? 'sb-appshell-v1-menu_support-contact' 
                : 'sb-appshell-v1-menu_support-link';

              // 外部リンク判定
              if (isExternalLink(supportLink.href)) {
                supportLink.target = '_blank';
              }

              // アイコンがある場合
              if (iconSpan) {
                const clonedIcon = iconSpan.cloneNode(true);
                // iconクラスを確実に追加
                if (!clonedIcon.classList.contains('icon')) {
                  clonedIcon.classList.add('icon');
                }
                // 追加のクラスを付与
                if (addedItemCount === 0) {
                  clonedIcon.classList.add('sb-appshell-v1-menu_support-contact-icon');
                } else {
                  clonedIcon.classList.add('sb-appshell-v1-menu_support-link-icon');
                }
                supportLink.appendChild(clonedIcon);
              }

              // テキストノードを直接追加
              supportLink.appendChild(document.createTextNode(itemText));
              supportItem.appendChild(supportLink);
            } else {
              const supportSpan = document.createElement('span');
              supportSpan.className = 'sb-appshell-v1-menu_support-link';
              supportSpan.style.cursor = 'default';

              if (iconSpan) {
                const clonedIcon = iconSpan.cloneNode(true);
                // iconクラスを確実に追加
                if (!clonedIcon.classList.contains('icon')) {
                  clonedIcon.classList.add('icon');
                }
                // 追加のクラスを付与
                clonedIcon.classList.add('sb-appshell-v1-menu_support-link-icon');
                supportSpan.appendChild(clonedIcon);
              }

              supportSpan.appendChild(document.createTextNode(itemText));
              supportItem.appendChild(supportSpan);
            }

            supportList.appendChild(supportItem);
            addedItemCount++; // 追加されたアイテムをカウント
          }
        });
      }
    }

    // オーサリング情報: Section 5から資料ダウンロードを取得（SP専用）
    const documentsItem = createDocumentsLink(fragment, true);
    if (documentsItem) {
      supportList.appendChild(documentsItem);
    }
  }

  support.appendChild(supportList);
  footer.appendChild(support);

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

  // section2からテキストを取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 1) {
      const info = extractParagraphInfo(sections[1]);
      if (info && info.text) {
        const dt = document.createElement('dt');
        dt.className = 'sb-appshell-v1-menu_sitemap-category-title';
        
        if (info.hasLink) {
          const dtLink = document.createElement('a');
          dtLink.href = info.href;
          dtLink.textContent = info.text;
          dt.appendChild(dtLink);
        } else {
          dt.textContent = info.text;
        }
        
        dl.appendChild(dt);
      }
    }
  }

  const dd = document.createElement('dd');
  dd.className = 'sb-appshell-v1-menu_sitemap-lv3';

  const lv3List = document.createElement('ul');
  lv3List.className = 'sb-appshell-v1-menu_sitemap-lv3-list';

  menuStructure.forEach((menuItem) => {
    const lv3Item = createSPLv3Item(menuItem);
    lv3List.appendChild(lv3Item);
  });

  dd.appendChild(lv3List);
  dl.appendChild(dd);
  tabPanel.appendChild(dl);
  tabPanels.appendChild(tabPanel);
  tabDiv.appendChild(tabPanels);
  menuView.appendChild(tabDiv);

  // フッター
  const menuFooter = createSPMenuFooter(fragment);
  menuView.appendChild(menuFooter);

  menu.appendChild(menuView);

  return menu;
}

/**
 * メインの公開関数：グローバルナビゲーション（ヘッダー全体）を構築する
 * @returns {Promise<HTMLElement>} グローバルナビゲーション要素（ヘッダー全体）
 */
export async function buildGlobalNav() {

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

  // PCヘッダーを追加
  const pcHeader = createPCHeader(menuStructure, fragment);
  container.appendChild(pcHeader);

  // SPヘッダーを追加
  const { spFixedArea, spMenu } = createSPHeader(menuStructure, fragment);
  container.appendChild(spFixedArea);
  container.appendChild(spMenu);

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

  // オーサリング情報: Section 1からロゴ画像を取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];
      
      // pictureの後にaタグがある場合、pictureをaタグで囲む
      wrapImgsInLinks(firstSection);
      
      // aタグまたはpictureを取得してクローン（両方のヘッダーで使用するため）
      const content = firstSection.querySelector('a, picture');
      if (content) {
        logoDiv.appendChild(content.cloneNode(true));
      }
    }
  }
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
  const pcNav = createPCNavigation(menuStructure, fragment);
  pcHeader.appendChild(pcNav);

  // ユーティリティメニュー（section3から取得）
  const utility = createUtilityMenu(fragment);
  pcHeader.appendChild(utility);

  return pcHeader;
}

/**
 * ユーティリティメニュー生成（PC専用）
 */
function createUtilityMenu(fragment) {
  const utility = document.createElement('div');
  utility.className = 'sb-appshell-v1-header_utility';

  const utilityList = document.createElement('div');
  utilityList.className = 'sb-appshell-v1-header_utility-list';

  // オーサリング情報: Section 3からユーティリティメニューを取得（PC専用）
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

          // [VertexAI]で始まる項目はスキップ（検索ウィジェット用のみ）
          if (itemText && !itemText.startsWith('[VertexAI]')) {
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
  
  // Section 3（PC用ユーティリティメニュー）からプレースホルダーテキストとアイコンを取得
  const searchWidgetInfo = getSearchWidgetInfo(fragment, 2);
  const searchWidgetContainer = createSearchWidget('header-search-widget-container', searchWidgetInfo.placeholderText, searchWidgetInfo.iconElement);
  searchUtilityItem.appendChild(searchWidgetContainer);
  utilityList.appendChild(searchUtilityItem);

  // ENGLISHボタンを固定で追加（PC専用）
  const englishUtilityItem = document.createElement('div');
  englishUtilityItem.className = 'sb-appshell-v1-header_utility-item sb-appshell-v1-header_utility-item--bordered';

  const englishLink = document.createElement('a');
  englishLink.href = ENGLISH_LINK;
  englishLink.className = 'sb-appshell-v1-header_utility-link';

  const englishSpan = document.createElement('span');
  englishSpan.className = 'sb-appshell-v1-header_utility-link-inner';
  englishSpan.textContent = 'ENGLISH';

  englishLink.appendChild(englishSpan);
  englishUtilityItem.appendChild(englishLink);
  utilityList.appendChild(englishUtilityItem);

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
  spLogoLink.href = '/'; // デフォルト値
  spLogoLink.className = 'sb-appshell-v1-header_inner__logo__image';

  // fragmentから画像とリンク先を取得
  if (fragment) {
    const sections = fragment.querySelectorAll('.section');
    if (sections.length > 0) {
      const firstSection = sections[0];
      
      // aタグを取得（PC用でwrapImgsInLinksが実行されている）
      const logoAnchor = firstSection.querySelector('a');
      if (logoAnchor && logoAnchor.href) {
        spLogoLink.href = logoAnchor.href;
      }
      
      // 画像を取得
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


export function jsHeader(globalNav) {
	const globalnavLinks = globalNav.querySelectorAll('.sb-appshell-v1-header-nav_globalnav-link');
	const hSearch = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-search');
	const megadropdown = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown');
	const megadropdownContent = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-contents');

	// status variable
	let isDropDownMenuOpen = false;
	let isNavigatorHover = false;
	let isDropDownMenuHover = false;

	globalnavLinks.forEach(globalnavLink => {
		globalnavLink.addEventListener('mouseenter', e => {
			isNavigatorHover = true;
			const _this = e.target;
			const menuHref = _this.getAttribute('data-href');
			if (menuHref) {
				const categoryTarget = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-category-item[data-sb-megadropdown-category="' + menuHref + '"]');
				if (categoryTarget) {
					if (isDropDownMenuOpen && !categoryTarget.classList.contains('sb-appshell-v1-header-nav_megadropdown-category-item--current')) {
						// remove statement of link
						globalnavLinks.forEach(globalnavLink => globalnavLink.classList.remove('sb-appshell-v1-header-nav_globalnav-link--open'));
						_this.classList.add("sb-appshell-v1-header-nav_globalnav-link--open");

						//excute previous item
						const prevTarget = globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-category-item.sb-appshell-v1-header-nav_megadropdown-category-item--current');
						prevTarget.classList.add('sb-appshell-v1-header-nav_megadropdown-category-item--preview');
						prevTarget.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current');
						setTimeout(function () {
							prevTarget.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--preview');
						}, 700);

						//excute curent item
						categoryTarget.classList.add("sb-appshell-v1-header-nav_megadropdown-category-item--current");

						// animate height dropdown content
						megadropdownContent.style.height = prevTarget.offsetHeight + 'px';

						megadropdownContent.style.transition = "height 0.4s";
						megadropdownContent.style.height = categoryTarget.offsetHeight + "px";
						setTimeout(function () {
							megadropdownContent.style.height = "auto";
						}, 400);
					} else {
						megadropdown.classList.add('sb-appshell-v1-header-nav_megadropdown--show');
						Object.assign(megadropdown.style, {
							display: "block",
							opacity: "1",
							height: "auto",
							top: "28px"
						});
						hSearch.classList.add("sb-appshell-v1-header-nav_megadropdown-header-search--open");
						_this.classList.add("sb-appshell-v1-header-nav_globalnav-link--open");
						categoryTarget.classList.add("sb-appshell-v1-header-nav_megadropdown-category-item--current");
						megadropdownContent.style.height = "auto";
					}
					isDropDownMenuOpen = true;
				};
			} else {
				if (isDropDownMenuOpen) {
					closeMenuDropDown();
				};
			};
		});

		globalnavLink.addEventListener('mouseleave', (e) => {
			isNavigatorHover = false;
			const _this = e.target;
			_this.classList.remove("sb-appshell-v1-header-nav_globalnav-link--open");
			setTimeout(function () {
				if (!isDropDownMenuHover && !isNavigatorHover) {
					closeMenuDropDown();
				}
			}, 100);
		});
	});

	megadropdown?.addEventListener('mouseenter', () => {
		isDropDownMenuHover = true;
	});

	megadropdown?.addEventListener('mouseleave', () => {
		isDropDownMenuHover = true;

		setTimeout(() => { isDropDownMenuHover = false; }, 50);
		setTimeout(() => {
			if (!isDropDownMenuHover && !isNavigatorHover) {
				closeMenuDropDown();
			}
		}, 100);
	});

	function closeMenuDropDown() {
		megadropdown.classList.remove('sb-appshell-v1-header-nav_megadropdown--show');
		Object.assign(megadropdown.style, {
			display: "none",
			opacity: "0",
			height: "auto",
			top: "28px"
		});
		megadropdownContent.style = "";
		globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-category-item').forEach(item => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-category-item--current'));
		hSearch.classList.remove("sb-appshell-v1-header-nav_megadropdown-header-search--open");
		isDropDownMenuOpen = false;
	};

	if (globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-close-button')) {
		globalNav.querySelector('.sb-appshell-v1-header-nav_megadropdown-header-close-button').addEventListener('click', () => {
			closeMenuDropDown();
		});
	};

	if (globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').length) {
		globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').forEach((el) => {
			el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item').querySelector('.sb-appshell-v1-header-nav_megadropdown-lv4-link').classList.add('sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion');
			el.classList.add('disp-none');
			el.style.height = 'auto';
		});

		globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-link--accordion').forEach(accordion => {
			accordion.addEventListener('click', (e) => {
				const el = e.target;
				const elParent = el.closest('.sb-appshell-v1-header-nav_megadropdown-lv4-item');
				const targetItem = elParent.querySelector('.sb-appshell-v1-header-nav_megadropdown-lv5');
				const megadropdownWidth = megadropdown.clientWidth;
				const targetItemPosition = (el.getBoundingClientRect().left + window.scrollX) - (megadropdown.getBoundingClientRect().left + window.scrollX);

				if (elParent.classList.contains('sb-appshell-v1-header-nav_megadropdown-lv4--open')) {
					elParent.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open');
				} else {
					globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv4-item').forEach(item => item.classList.remove('sb-appshell-v1-header-nav_megadropdown-lv4--open'));
					globalNav.querySelectorAll('.sb-appshell-v1-header-nav_megadropdown-lv5').forEach(item => {
						item.classList.add('disp-none');
						item.style.setProperty('height', 'auto', 'important');
					});
					elParent.classList.add('sb-appshell-v1-header-nav_megadropdown-lv4--open');
				}

				Object.assign(targetItem.style, {
					width: `${megadropdownWidth}px`,
					transform: `translateX(-${targetItemPosition}px)`
				});
				let initialHeight = targetItem.offsetHeight;
				if (targetItem.classList.contains('disp-none')) {
					targetItem.classList.remove('disp-none');
					initialHeight = targetItem.offsetHeight;
					targetItem.style.height = "0px";
					targetItem.animate([
						{ height: "0px" },
						{ height: initialHeight + "px" }
					], { duration: 250, fill: "forwards" });
				} else {
					targetItem.animate([
						{ height: initialHeight + "px" },
						{ height: "0px" }
					], { duration: 250, fill: "forwards" });
				};
				e.stopImmediatePropagation();
			});
		});
	};
};

export function jsHeaderSp(globalNav) {
	const headerSpBtnOpen = globalNav.querySelector('.sb-appshell-v1-header_menu-button');
	const headerSpBtnClose = globalNav.querySelector('.sb-appshell-v1-menu_button-close');
	const headerSpMenu = globalNav.querySelector('#sb-appshell-v1-menu');
	headerSpBtnOpen?.addEventListener('click', () => {
		if (headerSpMenu.classList.contains('sb-appshell-v1-menu--hide')) {
			headerSpMenu.classList.remove('sb-appshell-v1-menu--hide');
			headerSpMenu.classList.add('sb-appshell-v1-menu--show');
			Object.assign(headerSpMenu.style, {
				opacity: "0",
				display: "block",
				top: "0",
				height: "100vh",
				"overflow-y": "scroll"
			});

			headerSpMenu.animate([
				{ opacity: 0 },
				{ opacity: 1 }
			], { duration: 400, fill: "forwards" });
		} else {
			headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
			headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
			headerSpMenu.animate([
				{ opacity: 1 },
				{ opacity: 0 }
			], { duration: 400, fill: "forwards" }).onfinish = () => {
				headerSpMenu.style = "";
			};
		};
	});

	headerSpBtnClose?.addEventListener('click', () => {
		headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
		headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
		headerSpMenu.animate([
			{ opacity: 1 },
			{ opacity: 0 }
		], { duration: 400, fill: "forwards" }).onfinish = () => {
			headerSpMenu.style = "";
		};
	});

	const initHeaderSP = () => {
		if (document.documentElement.clientWidth >= 769 && headerSpMenu) {
			// menu sp
			headerSpMenu.classList.remove('sb-appshell-v1-menu--show');
			headerSpMenu.classList.add('sb-appshell-v1-menu--hide');
			headerSpMenu.style = "";
		};
	};
	initHeaderSP();
	window.addEventListener('resize', () => {
		initHeaderSP();
	});

	// accordion level 3
	if (globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4').length) {
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4').forEach((el) => {
			el.closest('.sb-appshell-v1-menu_sitemap-lv3-item').querySelector('.sb-appshell-v1-menu_sitemap-lv3-title').classList.add('sb-appshell-v1-menu_sitemap-lv3-title--accordion');
			el.classList.add('disp-none');
			el.style.height = 'auto';
		});
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv3-title--accordion').forEach((accordion) => {
			accordion.addEventListener('click', (e) => {
				const el = e.target;
				const elParent = el.closest('.sb-appshell-v1-menu_sitemap-lv3-item');
				const targetItem = elParent.querySelector('.sb-appshell-v1-menu_sitemap-lv4');
				if (elParent.classList.contains('sb-appshell-v1-menu_sitemap-lv4--open')) {
					elParent.classList.remove('sb-appshell-v1-menu_sitemap-lv4--open');
					el.setAttribute('aria-expanded', false);
				} else {
					elParent.classList.add('sb-appshell-v1-menu_sitemap-lv4--open');
					el.setAttribute('aria-expanded', true);
				};
				let initialHeight = targetItem.offsetHeight;
				if (targetItem.classList.contains("disp-none")) {
					targetItem.classList.remove("disp-none");
					initialHeight = targetItem.offsetHeight;
					targetItem.style.height = "0px";
					targetItem.animate([
						{ height: "0px" },
						{ height: initialHeight + "px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				} else {
					targetItem.style.height = '0px';
					targetItem.animate([
						{ height: initialHeight + "px" },
						{ height: "0px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.classList.add('disp-none');
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				};
			});
		});
	};
	// accordion level 4
	if (globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv5').length) {
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv5').forEach((el) => {
			el.closest('.sb-appshell-v1-menu_sitemap-lv4-item').querySelector('.sb-appshell-v1-menu_sitemap-lv4-title').classList.add('sb-appshell-v1-menu_sitemap-lv4-title--accordion');
			el.classList.add('disp-none');
			el.style.height = 'auto';
		});
		globalNav.querySelectorAll('.sb-appshell-v1-menu_sitemap-lv4-title--accordion').forEach((accordion) => {
			accordion.addEventListener('click', (e) => {
				const el = e.target;
				const elParent = el.closest('.sb-appshell-v1-menu_sitemap-lv4-item');
				const targetItem = elParent.querySelector('.sb-appshell-v1-menu_sitemap-lv5');
				if (elParent.classList.contains('sb-appshell-v1-menu_sitemap-lv5--open')) {
					elParent.classList.remove('sb-appshell-v1-menu_sitemap-lv5--open');
					el.setAttribute('aria-expanded', false);
				} else {
					elParent.classList.add('sb-appshell-v1-menu_sitemap-lv5--open');
					el.setAttribute('aria-expanded', true);
				};
				let initialHeight = targetItem.offsetHeight;
				if (targetItem.classList.contains('disp-none')) {
					targetItem.classList.remove('disp-none');
					initialHeight = targetItem.offsetHeight;
					targetItem.style.height = "0px";
					targetItem.animate([
						{ height: "0px" },
						{ height: initialHeight + "px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				} else {
					targetItem.style.height = '0px';
					targetItem.animate([
						{ height: initialHeight + "px" },
						{ height: "0px" }
					], { duration: 250, fill: "forwards" }).onfinish = () => {
						targetItem.classList.add('disp-none');
						targetItem.style.setProperty('height', 'auto', 'important');
					};
				};
				e.stopImmediatePropagation();
			});
		});
	};
};

// const isDesktop = window.matchMedia('(min-width: 769px)');
// const globalNav = document.querySelector("header .globalnavi");
// isDesktop.matches ? jsHeader(globalNav) : jsHeaderSp(globalNav);

//Yextの設定
// ANSWERS.init({
// 	apiKey: "db70272e9e139383dbd4924eb67e1d8d",
// 	experienceKey: "softbank-biz",
// 	experienceVersion: "PRODUCTION",
// 	locale: "ja",
// 	businessId: "3573698",
// 	templateBundle: TemplateBundle.default,
// 	onReady: function () {
// 		ANSWERS.addComponent("SearchBar", {
// 			container: ".sb-appshell-v1-header-nav_megadropdown-header-search",
// 			name: "search-bar",
// 			redirectUrl: "https://www.softbank.jp/search_result/",
// 			placeholderText: "Search...",
// 		});
// 	},
// });