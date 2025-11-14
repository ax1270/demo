/**
 * アンカーアイコン要素を作成する
 * @returns {HTMLElement} アンカーアイコンのspan要素
 */
function createAnchorIcon() {
  const iconSpan = document.createElement('span');
  iconSpan.className = 'icon icon-anchor-blue';

  const iconImg = document.createElement('img');
  iconImg.setAttribute('data-icon-name', 'anchor-blue');
  iconImg.src = '/business/icons/anchor-blue.svg';
  iconImg.alt = '';
  iconImg.loading = 'lazy';

  iconSpan.appendChild(iconImg);
  return iconSpan;
}

/**
 * アコーディオン機能を設定する
 * @param {HTMLElement} block - 目次ブロック要素
 * @param {HTMLElement} titleElement - タイトル要素
 * @param {HTMLElement} contentElement - コンテンツ要素（ul）
 */
function setupAccordion(block, titleElement, contentElement) {
  // タイトル要素をクリッカブルにする
  titleElement.classList.add('accordion-trigger');
  titleElement.setAttribute('role', 'button');
  titleElement.setAttribute('aria-expanded', 'false');
  titleElement.setAttribute('tabindex', '0');

  // コンテンツ要素を非表示にする
  contentElement.classList.add('accordion-content');
  contentElement.style.display = 'none';

  // クリックイベントを設定
  const toggleAccordion = () => {
    const isExpanded = titleElement.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      // 閉じる
      titleElement.setAttribute('aria-expanded', 'false');
      block.classList.remove('is-open');
      contentElement.style.display = 'none';
    } else {
      // 開く
      titleElement.setAttribute('aria-expanded', 'true');
      block.classList.add('is-open');
      contentElement.style.display = 'block';
    }
  };

  titleElement.addEventListener('click', toggleAccordion);

  // キーボード操作対応（EnterキーまたはSpaceキー）
  titleElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion();
    }
  });
}

/**
 * 目次を作成する
 * @param {HTMLElement} block - 目次ブロック要素
 */
function createTableOfContents(block) {
  // table-of-contents-containerを取得
  const tocContainer = block.closest('.section.table-of-contents-container');
  if (!tocContainer) return;

  // table-of-contents-containerの後ろにある全てのsectionからh2要素を収集
  const headings = [];
  let currentSection = tocContainer.nextElementSibling;

  while (currentSection) {
    if (currentSection.classList.contains('section')) {
      const h2Elements = currentSection.querySelectorAll('h2');
      headings.push(...h2Elements);
    }
    currentSection = currentSection.nextElementSibling;
  }

  if (headings.length === 0) return;

  // 目次のリストを作成
  const ul = document.createElement('ul');

  // 現在のページのURLを取得
  const currentUrl = window.location.href.split('#')[0];

  // 各見出しに対してリストアイテムを作成
  headings.forEach((heading) => {
    // 特定のh2を除外
    if (heading.id === '同じタグがついた記事をみる') return;

    const li = document.createElement('li');
    const a = document.createElement('a');

    // アンカーリンクを設定
    a.href = `${currentUrl}#${heading.id}`;
    a.title = heading.textContent;
    a.textContent = heading.textContent;

    // アンカーアイコンを追加
    const iconSpan = createAnchorIcon();
    a.appendChild(iconSpan);

    li.appendChild(a);
    ul.appendChild(li);
  });

  // 目次のタイトル要素の後にulを追加
  const titleP = block.querySelector('p');
  if (titleP) {
    titleP.after(ul);
  }

  // アコーディオン機能の設定
  if (block.classList.contains('accordion')) {
    setupAccordion(block, titleP, ul);
  }
}

/**
 * 目次ブロックをデコレートする関数
 * @param {HTMLElement} block - 目次ブロック要素
 */
export default function decorate(block) {
  // MutationObserverを作成
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes'
          && mutation.attributeName === 'data-section-status'
          && mutation.target.dataset.sectionStatus === 'loaded') {
        createTableOfContents(block);
        observer.disconnect();
      }
    });
  });

  // 監視を開始
  const section = block.closest('.section');
  if (section) {
    observer.observe(section, {
      attributes: true,
      attributeFilter: ['data-section-status'],
    });
  }
}
