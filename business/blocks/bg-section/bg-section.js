/**
 * bg-で始まるクラスを抽出する
 * @param {HTMLElement} element - 要素
 * @returns {string[]} 背景クラスの配列
 */
function extractBackgroundClasses(element) {
  return Array.from(element.classList)
    .filter((className) => className.startsWith('bg-') && className !== 'bg-section');
}

/**
 * カラーコード指定かどうかを判定する
 * @param {string} className - クラス名
 * @returns {boolean} カラーコード指定の場合true
 */
function isColorCodeClass(className) {
  // bg-の後に6桁の16進数が続くパターンをチェック
  return /^bg-[0-9a-fA-F]{6}$/.test(className);
}

/**
 * カラーコードを適用する
 * @param {string} className - クラス名
 * @param {HTMLElement} targetElement - ターゲット要素
 */
function applyColorCode(className, targetElement) {
  const colorCode = className.replace('bg-', '');
  targetElement.style.backgroundColor = `#${colorCode}`;
}

/**
 * 色クラスを適用する
 * @param {string} className - クラス名
 * @param {HTMLElement} targetElement - ターゲット要素
 */
function applyColorClass(className, targetElement) {
  targetElement.classList.add(className);
}

/**
 * 背景色クラスを適用する
 * @param {HTMLElement} sourceElement - ソース要素
 * @param {HTMLElement} targetElement - ターゲット要素
 */
function applyBackgroundColor(sourceElement, targetElement) {
  const backgroundClasses = extractBackgroundClasses(sourceElement);

  backgroundClasses.forEach((className) => {
    if (isColorCodeClass(className)) {
      applyColorCode(className, targetElement);
    } else {
      applyColorClass(className, targetElement);
    }
  });
}

/**
 * 次の兄弟要素をすべて収集する
 * @param {HTMLElement} element - 基準要素
 * @returns {HTMLElement[]} 兄弟要素の配列
 */
function collectNextSiblings(element) {
  const siblings = [];
  let nextSibling = element.nextElementSibling;

  while (nextSibling) {
    siblings.push(nextSibling);
    nextSibling = nextSibling.nextElementSibling;
  }

  return siblings;
}

/**
 * ラッパー内に兄弟要素を移動する
 * @param {HTMLElement} wrapper - ラッパー要素
 */
function moveElementsToWrapper(wrapper) {
  const siblings = collectNextSiblings(wrapper);
  siblings.forEach((sibling) => wrapper.appendChild(sibling));
}

/**
 * 空のセクションかどうかを判定する
 * @param {HTMLElement} element - 要素
 * @returns {boolean} 空のセクションの場合true
 */
function isEmptySection(element) {
  return element.matches('.section') && element.innerHTML.trim() === '';
}

/**
 * 空のセクション要素を削除する
 * @param {HTMLElement} startElement - 開始要素
 */
function removeEmptySections(startElement) {
  let sibling = startElement.nextElementSibling;

  while (sibling) {
    const next = sibling.nextElementSibling;

    if (isEmptySection(sibling)) {
      sibling.remove();
    }

    sibling = next;
  }
}

/**
 * 背景セクションコンテナを取得する
 * @param {HTMLElement} block - ブロック要素
 * @returns {HTMLElement|null} 背景セクションコンテナ
 */
function findBgSectionContainer(block) {
  return block.closest('.bg-section-container');
}

/**
 * 背景セクションラッパーを取得する
 * @param {HTMLElement} container - コンテナ要素
 * @returns {HTMLElement|null} 背景セクションラッパー
 */
function findBgSectionWrapper(container) {
  return container.querySelector('.bg-section-wrapper');
}

/**
 * 背景セクションを処理する
 * @param {HTMLElement} block - 背景セクションブロック要素
 */
function processBgSection(block) {
  const bgSectionBlock = findBgSectionContainer(block);
  if (!bgSectionBlock) return;

  // 背景色を適用
  applyBackgroundColor(block, bgSectionBlock);

  // DOM操作を実行
  const wrapper = findBgSectionWrapper(bgSectionBlock);
  if (wrapper) {
    moveElementsToWrapper(wrapper);
  }

  // 空要素を削除
  removeEmptySections(bgSectionBlock);
}

/**
 * 背景セクションをデコレートする関数
 * @param {HTMLElement} block - 背景セクションブロック要素
 */
export default function decorate(block) {
  processBgSection(block);
}
