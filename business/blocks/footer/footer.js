import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { buildBreadcrumbs } from '../../scripts/scripts.js';

/**
 * フッターのフラグメントを読み込む
 * @param {string} path フラグメントのパス
 * @returns {Promise<HTMLElement|null>} フラグメント要素
 */
const loadFooterFragment = async (path) => {
  const fragment = await loadFragment(path);
  return fragment;
};

/**
 * フッターのDOMを作成する
 * @returns {{footer: HTMLElement, gnavWrap: HTMLElement}} フッター要素とgnavWrap要素
 */
const createFooterDOM = () => {
  const footer = document.createElement('div');
  footer.className = 'footer gnav';

  const gnavWrap = document.createElement('div');
  gnavWrap.className = 'gnav-wrap';

  return { footer, gnavWrap };
};

/**
 * フッターグローバルのDOMを作成する
 * @returns {HTMLElement} フッターグローバル要素
 */
const createFooterGlobalDOM = () => {
  const footerGlobal = document.createElement('div');
  footerGlobal.className = 'footer global';
  return footerGlobal;
};

/**
 * SNSアイコンの処理
 * @param {HTMLElement} footerGnavSns SNSセクション要素
 */
const processSnsIcons = (footerGnavSns) => {
  const snsIconsContainer = footerGnavSns.querySelector('.default-content-wrapper > p:first-child');
  if (snsIconsContainer) {
    const brElements = snsIconsContainer.querySelectorAll('br');
    brElements.forEach((br) => br.remove());
  }
};

/**
 * フラグメントラッパーの移動処理
 * @param {HTMLElement} gnavWrap gnavWrap要素
 * @param {HTMLElement} footerGlobal フッターグローバル要素
 */
const moveFragmentWrapper = (gnavWrap, footerGlobal) => {
  const fragmentContainer = gnavWrap.querySelector('.fragment-container');
  if (fragmentContainer) {
    const fragmentWrapper = fragmentContainer.querySelector('.fragment-wrapper');
    if (fragmentWrapper) {
      footerGlobal.appendChild(fragmentWrapper);
    }
  }
};

/**
 * フッターナビゲーションリンクの処理
 * @param {HTMLElement} footerGnavLinks フッターナビゲーションリンク要素
 */
const processFooterNavLinks = (footerGnavLinks) => {
  const linksList = footerGnavLinks.querySelector(':scope .default-content-wrapper > ul');
  if (!linksList) return;

  // リスト項目にクラスを追加
  linksList.querySelectorAll(':scope > li').forEach((navSection) => {
    navSection.classList.add(
      navSection.querySelector('ul') ? 'footer-gnav-links-items' : 'footer-gnav-links-items-last',
    );
  });

  // 最後のセクションの処理
  const lastItems = Array.from(linksList.children).filter((item) => item.classList.contains('footer-gnav-links-items-last'));

  if (lastItems.length > 0) {
    const lastSection = document.createElement('li');
    lastSection.className = 'footer-gnav-links-items-last';
    const lastSectionUl = document.createElement('ul');

    lastItems.forEach((item) => {
      const newLi = document.createElement('li');
      newLi.innerHTML = item.innerHTML;
      lastSectionUl.appendChild(newLi);
      item.remove();
    });

    lastSection.appendChild(lastSectionUl);
    linksList.appendChild(lastSection);
  }
};

/**
 * ボタンの処理
 * @param {HTMLElement} element 対象要素
 * @param {string} newClassName 新しいクラス名
 * @param {string} newContainerClassName 新しいコンテナクラス名
 */
const processButton = (element, newClassName, newContainerClassName) => {
  const button = element.querySelector('.button');
  if (button) {
    button.className = newClassName;
    button.closest('.button-container').className = newContainerClassName;
  }
};

/**
 * フッターを装飾する
 * @param {Element} block フッターブロック要素
 */
export default async function decorate(block) {
  const footerPath = getMetadata('footer')
    ? new URL(getMetadata('footer'), window.location).pathname
    : '/footer';
  const footerFragment = await loadFooterFragment(footerPath);

  block.textContent = '';
  const { footer, gnavWrap } = createFooterDOM();
  const footerGlobal = createFooterGlobalDOM();

  // フラグメントの結合とDOM構築
  if (footerFragment) {
    while (footerFragment.firstElementChild) gnavWrap.append(footerFragment.firstElementChild);
  }

  // フラグメントラッパーの移動
  moveFragmentWrapper(gnavWrap, footerGlobal);

  // DOM要素の追加
  block.append(footer);
  block.append(footerGlobal);
  footer.append(gnavWrap);

  // セクションにクラス名を付与
  ['title', 'links', 'sns'].forEach((c, i) => {
    const section = gnavWrap.children[i];
    if (section) section.classList.add(`footer-gnav-${c}`);
  });

  // SNSアイコンの処理
  const footerGnavSns = gnavWrap.querySelector('.footer-gnav-sns');
  if (footerGnavSns) {
    processSnsIcons(footerGnavSns);
  }

  // ボタンの処理
  processButton(gnavWrap.querySelector('.footer-gnav-title'), '', 'footer-gnav-title-text');
  processButton(footerGlobal, 'logo-link', 'logo');

  // フッターナビゲーションリンクの処理
  const footerGnavLinks = gnavWrap.querySelector('.footer-gnav-links');
  if (footerGnavLinks) {
    processFooterNavLinks(footerGnavLinks);
  }

  // 各aタグに対してtarget="_blank"を設定（別窓処理）
  const links = gnavWrap.querySelectorAll('a');
  links.forEach((link) => {
    const { href } = link;
    if (!href.includes('https://main--softbank-eds-develop--aquaring.aem.page/')
        && !href.includes('https://main--aem-eds--softbankbtob.aem.page/')
        && !href.includes('https://www.softbank.jp/biz/')
        && !href.includes('http://localhost:3000/')) {
      link.setAttribute('target', '_blank');
    }
  });

  // パンくずリストを追加
  const breadcrumbs = await buildBreadcrumbs();
  footerGlobal.insertAdjacentElement('beforebegin', breadcrumbs);
}
