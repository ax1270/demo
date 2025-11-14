import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { buildBreadcrumbs } from '../../scripts/scripts.js';
import { buildGlobalNav } from '../../scripts/global-nav.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 769px)');

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {Boolean} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    if (section.classList.contains('nav-drop')) {
      section.setAttribute('aria-expanded', expanded);
    }
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const isSP = !isDesktop.matches;

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');

  if (!isSP) {
    // PC表示時は各セクションのトグル
    toggleAllNavSections(navSections, expanded);
  }
  // SP表示時はaria-expanded属性でCSSが制御するため、style.displayの操作は不要
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Local-navブロックがあるかチェック
  let navPath = '/nav';

  // ページ内のLocal-navブロックを検索
  const localNavBlock = document.querySelector('.local-nav.block, .localnav.block, [data-block-name="local-nav"], [data-block-name="localnav"]');

  if (localNavBlock) {
    // Local-navブロックからパスを取得
    const link = localNavBlock.querySelector('a');
    const path = link ? link.getAttribute('href') : localNavBlock.textContent.trim();
    if (path) {
      navPath = path;
    }
    // パスを取得したらブロックを削除
    localNavBlock.remove();
  } else {
    // Local-navブロックがない場合はメタデータから取得
    const navMeta = getMetadata('local-nav');
    navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  }
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // DOM要素のキャッシュ用変数
    let navSectionsUl = null;
    let navToolsElement = null;

    // nav-sections内のul要素を取得する関数（キャッシュ付き）
    function getNavSectionsUl() {
      if (!navSectionsUl) {
        navSectionsUl = navSections.querySelector('.default-content-wrapper > ul');
      }
      return navSectionsUl;
    }

    // nav-tools要素を取得する関数（キャッシュ付き）
    function getNavToolsElement() {
      if (!navToolsElement) {
        navToolsElement = nav.querySelector('.nav-tools');
      }
      return navToolsElement;
    }

    // 現在のページと同じリンクを取得する関数
    function getCurrentPageLinks() {
      const currentPath = window.location.pathname;
      const currentLinks = [];

      navSections.querySelectorAll('a').forEach((link) => {
        const linkPath = new URL(link.href, window.location).pathname;
        if (linkPath === currentPath) {
          // 現在のページと同じリンクの親要素を取得
          const parentLi = link.closest('li');
          if (parentLi) {
            currentLinks.push({
              text: link.textContent.trim(),
              href: link.href,
              element: parentLi,
            });
          }
        }
      });

      return currentLinks;
    }

    // 現在のページと同じリンクにcurrent-pageクラスを追加する関数
    // function addCurrentPageClass() {
    //   const currentPath = window.location.pathname;
    //
    //   navSections.querySelectorAll('a').forEach(link => {
    //     const linkPath = new URL(link.href, window.location).pathname;
    //     if (linkPath === currentPath) {
    //       // 現在のページと同じリンクの親要素にcurrent-pageクラスを追加
    //       const parentLi = link.closest('li');
    //       if (parentLi) {
    //         parentLi.classList.add('current-page');
    //       }
    //     }
    //   });
    // }

    // navの幅を計算する関数
    function calculateNavWidth() {
      const navUl = getNavSectionsUl();

      if (!navUl) {
        return { calculatedWidth: 0, screenWidth: 0 };
      }

      const listItems = navUl.querySelectorAll('li');
      let totalWidth = 0;
      let gapTotal = 0;

      listItems.forEach((item, index) => {
        const itemWidth = item.getBoundingClientRect().width;
        totalWidth += itemWidth;

        if (index < listItems.length - 1) {
          gapTotal += 32; // CSSで設定されているgap: 0 32px
        }
      });

      return {
        calculatedWidth: totalWidth + gapTotal,
        screenWidth: window.innerWidth,
      };
    }

    // オーバーフローモードを適用すべきか判定する関数
    function shouldApplyOverflowMode() {
      const { calculatedWidth, screenWidth } = calculateNavWidth();

      const OVERFLOW_THRESHOLD = 946;
      const SCREEN_WIDTH_THRESHOLD = 1290;

      return calculatedWidth > OVERFLOW_THRESHOLD || screenWidth < SCREEN_WIDTH_THRESHOLD;
    }

    // オーバーフローモードを適用する関数
    function applyOverflowMode() {
      navSections.classList.add('nav-overflow');
      nav.classList.add('nav-overflow-mode');

      const currentLinks = getCurrentPageLinks();
      const menuText = currentLinks.length > 0 ? currentLinks[0].text : 'メニュー';
      addOverflowMenuTrigger(menuText);

      scheduleHeightAdjustment();
    }

    // オーバーフローモードを解除する関数
    function removeOverflowMode() {
      navSections.classList.remove('nav-overflow');
      nav.classList.remove('nav-overflow-mode');
      removeOverflowMenuTrigger();
    }

    // 高さ調整をスケジュールする関数
    function scheduleHeightAdjustment() {
      setTimeout(adjustNavOverflowHeight, 100);
    }

    // navのulの幅を監視してSPスタイルを適用する関数
    function checkNavWidth() {
      if (shouldApplyOverflowMode()) {
        applyOverflowMode();
      } else {
        removeOverflowMode();
      }
    }

    // navの高さを取得してドロップダウンのtop値を設定する関数
    function setDropdownTopPosition() {
      const navSectionsUl = getNavSectionsUl();

      if (!navSectionsUl) {
        return;
      }

      // navの実際の高さを取得
      const navHeight = navSectionsUl.offsetHeight;

      // すべてのドロップダウンメニューのtop値を設定（開いているかどうかに関係なく）
      navSectionsUl.querySelectorAll('li.nav-drop > ul').forEach((dropdown) => {
        dropdown.style.top = `${navHeight}px`;
      });
    }

    // オーバーフローメニュートリガーを追加する関数
    function addOverflowMenuTrigger(menuText) {
      // SPの時のみoverflow-triggerを追加
      if (isDesktop.matches) {
        return;
      }

      // 既存のトリガーを削除
      removeOverflowMenuTrigger();

      const overflowTrigger = document.createElement('div');
      overflowTrigger.className = 'sp-nav-trigger overflow-trigger';
      overflowTrigger.textContent = menuText || 'メニュー';
      overflowTrigger.addEventListener('click', () => {
        toggleMenu(nav, navSections);
        // メニューが開いた後にnav-overflow-modeの高さを調整
        scheduleHeightAdjustment();
      });
      nav.prepend(overflowTrigger);
      nav.setAttribute('aria-expanded', 'false');
    }

    // オーバーフローメニュートリガーを削除する関数
    function removeOverflowMenuTrigger() {
      const existingTrigger = nav.querySelector('.overflow-trigger');
      if (existingTrigger) {
        existingTrigger.remove();
      }
    }

    // 初期チェック（DOMが完全に構築されてから実行）
    setTimeout(() => {
      checkNavWidth();
      setDropdownTopPosition(); // 初期ドロップダウン位置を設定
      // addCurrentPageClass(); // 現在のページと同じリンクにcurrent-pageクラスを追加
    }, 100);

    // リサイズ時にチェック
    window.addEventListener('resize', () => {
      checkNavWidth();

      // ドロップダウンの位置を再計算
      setDropdownTopPosition();

      // 画面幅がPCサイズとSPサイズで切り替わった時の処理
      if (isDesktop.matches) {
        // PCサイズの時はoverflow-triggerを削除
        removeOverflowMenuTrigger();
      } else {
        // SPサイズの時は必要に応じてoverflow-triggerを追加
        if (shouldApplyOverflowMode()) {
          const currentLinks = getCurrentPageLinks();
          const menuText = currentLinks.length > 0 ? currentLinks[0].text : 'メニュー';
          addOverflowMenuTrigger(menuText);
        }
      }
    });

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', (e) => {
        if (navSection.classList.contains('nav-drop')) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';

          // PCの場合、他のトグルメニューを閉じる
          if (isDesktop.matches) {
            navSections.querySelectorAll('.nav-drop').forEach((drop) => {
              if (drop !== navSection) {
                drop.setAttribute('aria-expanded', 'false');
              }
            });
          }

          // ドロップダウンを開く前にtop位置を設定
          if (!expanded) {
            const navSectionsUl = getNavSectionsUl();
            if (navSectionsUl) {
              const navHeight = navSectionsUl.offsetHeight;
              const dropdownUl = navSection.querySelector('ul');
              if (dropdownUl) {
                dropdownUl.style.top = `${navHeight}px`;
              }
            }
          }

          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          e.stopPropagation(); // イベントの伝播を止める
        }
      });

      // アコーディオンのスクロール時にページのスクロールを制御
      const accordionUl = navSection.querySelector('ul');
      if (accordionUl) {
        accordionUl.addEventListener('wheel', (e) => {
          const isExpanded = navSection.getAttribute('aria-expanded') === 'true';
          if (isExpanded) {
            // アコーディオンが開いている時は常にページのスクロールを禁止
            e.stopPropagation();

            // アコーディオン内でのスクロールのみ許可
            accordionUl.scrollTop += e.deltaY;
          }
        });
      }
    });

    // nav-toolsの高さを取得する関数
    function getNavToolsHeight() {
      const navTools = getNavToolsElement();

      if (!navTools) {
        return 0;
      }

      // nav-toolsが表示されていない場合は一時的に表示して高さを取得
      const originalDisplay = navTools.style.display;
      const isHidden = navTools.style.display === 'none'
                      || navTools.classList.contains('hidden')
                      || navTools.offsetHeight === 0;

      if (isHidden) {
        // 一時的に表示
        navTools.style.display = 'block';
        navTools.style.visibility = 'hidden'; // 見えないようにする
        navTools.style.position = 'absolute'; // レイアウトに影響しないようにする
      }

      // scrollHeightを使用して実際のコンテンツの高さを取得
      const navToolsHeight = navTools.scrollHeight;

      // 一時的に表示した場合は元に戻す
      if (isHidden) {
        navTools.style.display = originalDisplay;
        navTools.style.visibility = '';
        navTools.style.position = '';
      }

      return navToolsHeight;
    }

    // nav-overflow-modeの最大高さを500pxに設定し、ulの高さを調整する関数
    function adjustNavOverflowHeight() {
      const navSectionsUl = getNavSectionsUl();

      if (navSectionsUl) {
        // nav-overflow-modeの最大高さを500pxに設定
        nav.style.maxHeight = '500px';

        // nav-toolsの高さを取得
        const navToolsHeight = getNavToolsHeight();

        // ulの最大高さを計算（500px - トリガーの高さ - nav-toolsの高さ）
        const triggerHeight = 45; // sp-nav-triggerの実際の高さ（padding: 12px + line-height: 21px）
        const ulMaxHeight = 500 - triggerHeight - navToolsHeight;

        // ulの最大高さを設定
        navSectionsUl.style.maxHeight = `${ulMaxHeight}px`;
      }
    }

    // オーバーフローメニュー時のスクロール制御
    nav.addEventListener('wheel', (e) => {
      const isOverflowMode = nav.classList.contains('nav-overflow-mode');
      const isMenuOpen = nav.getAttribute('aria-expanded') === 'true';

      if (isOverflowMode && isMenuOpen) {
        // オーバーフローメニューが開いている時はページのスクロールを禁止
        e.stopPropagation();

        // メニュー内でのスクロールを許可
        const navSectionsUl = getNavSectionsUl();
        if (navSectionsUl) {
          navSectionsUl.scrollTop += e.deltaY;
        }
      }
    });

    // 外側クリック時にnav-dropとオーバーフローメニューを閉じる（PCの時のみ）
    document.addEventListener('click', (e) => {
      // PCの時のみ実行
      if (!isDesktop.matches) {
        return;
      }

      // クリックされた要素がnav-dropの内側かチェック
      const clickedNavDrop = e.target.closest('.nav-drop');

      // クリックされた要素がオーバーフローメニューの内側かチェック
      const clickedOverflowMenu = e.target.closest('.nav-overflow-mode');

      if (!clickedNavDrop) {
        // nav-dropの外側をクリックした場合は全てのnav-dropを閉じる
        navSections.querySelectorAll('.nav-drop').forEach((drop) => {
          drop.setAttribute('aria-expanded', 'false');
        });
      }

      if (!clickedOverflowMenu) {
        // オーバーフローメニューの外側をクリックした場合はメニューを閉じる
        if (nav.classList.contains('nav-overflow-mode') && nav.getAttribute('aria-expanded') === 'true') {
          nav.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Add target="_blank" to all <a> tags within .nav-tools
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const link = navTools.querySelector('a');
    if (link) {
      link.setAttribute('target', '_blank');
    }
  }

  // SPメニュートリガーの追加（Local-navブロックがない場合のみ）
  if (!isDesktop.matches && !localNavBlock) {
    const spNavTrigger = document.createElement('div');
    spNavTrigger.className = 'sp-nav-trigger';
    spNavTrigger.textContent = 'ビジネスブログ';

    spNavTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu(nav, navSections);
    });

    nav.prepend(spNavTrigger);
    nav.setAttribute('aria-expanded', 'false');
  }

  isDesktop.addEventListener('change', (e) => {
    if (!e.matches) {
      nav.setAttribute('aria-expanded', 'false');
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // ローカルナビゲーションの追従
  function navSticky() {
    const navWrapperContent = document.querySelector('.nav-wrapper');
    const navTop = navWrapperContent.getBoundingClientRect().top + window.scrollY;

    window.addEventListener('scroll', () => {
      const { scrollY } = window;
      if (scrollY > navTop) {
        navWrapperContent.classList.add('is-fixed');
      } else {
        navWrapperContent.classList.remove('is-fixed');
      }
    });
  }
  navSticky();

  // パンくずリストを追加
  const breadcrumbs = await buildBreadcrumbs();
  block.insertBefore(breadcrumbs, navWrapper);

  // メガメニューを追加
  const globalNav = await buildGlobalNav(isDesktop.matches);
  block.insertBefore(globalNav, breadcrumbs);
}
