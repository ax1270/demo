/**
 * ページライフサイクル管理のコア機能
 */

import {
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  loadHeader,
  loadFooter,
} from '../aem.js';

import decorateMain from './decorateMain.js';
import ArticleDataHandler from '../classes/ArticleDataHandler.js';
import ArticleDisplay from '../components/ArticleDisplay.js';
import { addStyleClassesToMain, addPageWidthAttributeToMain, addPageStyleAttributeToMain } from '../utils/styles.js';
import { setupSmoothScroll, handleAnchorLink } from '../utils/scroll.js';
import { processSectionContentWrappers, processIndexSections } from '../utils/sections.js';

// 実験設定
const experimentationConfig = {
  prodHost: 'www.softbank.jp',
  audiences: {
    mobile: () => window.innerWidth < 600,
    desktop: () => window.innerWidth >= 600,
  },
};

let runExperimentation;
let showExperimentationOverlay;

// 実験機能の初期化
const isExperimentationEnabled = document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"],[property^="campaign:"],[property^="audience:"]')
  || [...document.querySelectorAll('.section-metadata div')].some((d) => d.textContent.match(/Experiment|Campaign|Audience/i));

// 実験機能を動的にインポート（トップレベルawaitを回避）
// TODO: experimentation pluginが利用可能になったら有効化
if (isExperimentationEnabled) {
  // eslint-disable-next-line import/no-unresolved
  import('../../plugins/experimentation/src/index.js').then((module) => {
    runExperimentation = module.loadEager;
    showExperimentationOverlay = module.loadLazy;
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
  // do nothing
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
export async function loadEager(doc) {
  if (runExperimentation) {
    await runExperimentation(document, experimentationConfig);
  }
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    // meta name="style"のcontentをmainタグのクラスとして追加
    addStyleClassesToMain(main);
    // meta name="page-width"のcontentをmainタグのdata-page-width属性として追加
    addPageWidthAttributeToMain(main);
    // meta name="page-style"のcontentをmainタグのdata-page-style属性として追加
    addPageStyleAttributeToMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);

    const firstChild = main.firstElementChild;

    if (firstChild && firstChild.classList.contains('carousel-blog-container')) {
      const carouselBlogContainer = firstChild;
      const articleCardsContainer = document.createElement('div');
      articleCardsContainer.className = 'articleCards-container';
      const fragmentContainer = main.querySelector('.fragment-container');

      // mainタグにクラス付与
      main.classList.add('p-index');

      if (carouselBlogContainer.nextElementSibling === fragmentContainer) {
        // DOM構築を順番に実行
        try {
          // 1. top-article-wrapの作成と配置
          const wrapParent = document.createElement('div');
          const topArticleWrap = document.createElement('div');
          wrapParent.className = 'p-index-content';
          topArticleWrap.className = 'section top-article-wrap';
          wrapParent.appendChild(topArticleWrap);
          main.insertBefore(wrapParent, fragmentContainer);

          // 2. JSONデータの取得
          const response = await fetch('/query-index.json');
          if (!response.ok) throw new Error('Network response was not ok');
          const jsonData = await response.json();

          // 3. データの処理
          const articleDataHandler = new ArticleDataHandler(jsonData);
          const extractedData = await articleDataHandler.extractData();
          const groupedTags = await articleDataHandler.getGroupedTags();

          // 4. 記事表示の初期化
          if (articleCardsContainer) {
            const articleDisplay = new ArticleDisplay(
              articleCardsContainer,
              groupedTags,
              extractedData,
            );
            await articleDisplay.initialize();
          }

          // 5. コンテナの移動
          topArticleWrap.appendChild(articleCardsContainer);
          topArticleWrap.appendChild(fragmentContainer);
        } catch (error) {
          // do nothing
        }
      }
    }

    try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
      if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
        loadFonts();
      }
    } catch (e) {
    // do nothing
    }

    // CSSファイルを読み込み
    loadCSS(`${window.hlx.codeBasePath}/styles/top.css`);
    loadCSS(`${window.hlx.codeBasePath}/styles/blog.css`);

    // case.cssはdata-page-style="casestudy"の場合のみ読み込み
    if (main && main.getAttribute('data-page-style') === 'casestudy') {
      loadCSS(`${window.hlx.codeBasePath}/styles/case.css`);
    }

    loadCSS(`${window.hlx.codeBasePath}/styles/section-metadata.css`);

    // 各aタグに対してtarget="_blank"を設定（別窓処理）
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      const { href } = link;
      if (!href.includes('https://main--softbank-eds-develop--aquaring.aem.page/')
     && !href.includes('https://main--aem-eds--softbankbtob.aem.page/')
     && !href.includes('https://www.softbank.jp/biz/')
     && !href.includes('http://localhost:3000/')) {
        link.setAttribute('target', '_blank');
      }
    });
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
export async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  // 遅延ロードで追加された要素にも付与
  setupSmoothScroll(main);

  // アンカーリンク処理のフラグ設定
  const anchorTarget = window.location.hash?.substring(1);
  if (anchorTarget) {
    window.pendingAnchorLink = anchorTarget;
  }

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  if (showExperimentationOverlay) {
    await showExperimentationOverlay(document, experimentationConfig);
  }
}

/**
 * 待機中のアンカーリンクを実行
 *
 * URL直接遷移時のアンカーリンク処理を実行します。
 * 統一されたロジックを使用してスクロール位置の一貫性を保ちます。
 */
function executePendingAnchorLink() {
  const targetId = window.pendingAnchorLink;
  delete window.pendingAnchorLink;

  // URL直接遷移として実行（統一されたロジックを使用）
  handleAnchorLink(targetId, true);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
export function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('../delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

/**
 * ページロード処理のメイン関数
 */
export async function loadPage() {
  await loadEager(document);
  await loadLazy(document);

  // すべてのコンテンツロード後に各種処理を実行
  const main = document.querySelector('main');
  if (main) {
  // ブロック処理完了後にbg-section-wrapperでコンテンツを囲う処理
    processSectionContentWrappers(main);
    // index-sectionを処理
    processIndexSections(main);
    // 後段のDOM変換後にアンカーリンク処理を再適用
    setupSmoothScroll(main);
  }

  // 全てのDOM変更処理完了後にアンカーリンクを実行
  if (window.pendingAnchorLink) {
    executePendingAnchorLink();
  }

  loadDelayed();
}
