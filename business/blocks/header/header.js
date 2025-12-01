// import { getMetadata } from '../../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { buildBreadcrumbs } from '../../scripts/scripts.js';
import { jsHeader, jsHeaderSp, buildGlobalNav } from '../../scripts/global-nav.js';


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

    if (isSP) {
        // SP表示時は全体のトグルのみ
        navSections.style.display = expanded ? 'none' : 'block';
    } else {
        // PC表示時は各セクションのトグル
        toggleAllNavSections(navSections, expanded);
    }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
    // グローバルナビゲーションをDOM構築で生成
    const globalNav = await buildGlobalNav();

    // グローバルナビゲーション設定（レスポンシブ対応：PC/SP両方を初期化）
    jsHeader(globalNav);
    jsHeaderSp(globalNav);

    block.append(globalNav);

    // パンくずリストを追加
    const breadcrumbs = await buildBreadcrumbs();
    block.append(breadcrumbs);

    // load nav as fragment
    // const fragment = await loadFragment('/business/content/common/navi');
    const fragment = await loadFragment('/nav'); // TODO ローカル用のため、後で戻す

    // decorate nav DOM
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

                    navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                    e.stopPropagation(); // イベントの伝播を止める
                }
            });
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

    // SPメニュートリガーの追加
    if (!isDesktop.matches) {
        const spNavTrigger = document.createElement('div');
        spNavTrigger.className = 'sp-nav-trigger';
        spNavTrigger.textContent = 'ビジネスブログ';
        spNavTrigger.addEventListener('click', () => toggleMenu(nav, navSections));
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
}