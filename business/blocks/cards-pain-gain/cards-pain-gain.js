/**
 * h3要素とimg要素を組み合わせてタイトルを作成する関数
 * @param {string} iconSrc - アイコンのパス
 * @param {string} titleText - タイトルのテキスト
 * @returns {HTMLElement} 作成されたh3要素
 */
function createTitleWithIcon(iconSrc, titleText) {
  const h3Element = document.createElement('h3');
  h3Element.className = 'cards-pain-gain-title';

  const imgElement = document.createElement('img');
  imgElement.src = iconSrc;
  imgElement.alt = '';

  h3Element.appendChild(imgElement);
  h3Element.appendChild(document.createTextNode(titleText));

  return h3Element;
}

/**
 * 矢印画像を作成する関数
 * @returns {HTMLElement} 作成されたimg要素
 */
function createArrowImage() {
  const imgElement = document.createElement('img');
  imgElement.src = '/business/icons/arrow-blue.svg';
  imgElement.alt = '';
  imgElement.classList.add('cards-pain-gain-arrow');
  return imgElement;
}

/**
 * コンテンツdivにクラスとタイトルを追加する関数
 * @param {HTMLElement} div - 対象のdiv要素
 * @param {string} iconSrc - アイコンのパス
 * @param {string} titleText - タイトルのテキスト
 */
function processContentDiv(div, iconSrc, titleText) {
  // クラスを追加
  div.classList.add('cards-pain-gain-content');

  // タイトルを作成して追加
  const title = createTitleWithIcon(iconSrc, titleText);
  div.insertBefore(title, div.firstChild);
}

/**
 * コンテンツ部分の処理を行う関数
 * @param {HTMLElement} firstDiv - 最初のdiv要素
 */
function processContentSections(firstDiv) {
  const contentDivs = firstDiv.querySelectorAll('div');

  if (contentDivs.length >= 2) {
    // 1番目のdiv（導入前の課題）
    processContentDiv(contentDivs[0], '/business/icons/cards-pain-gain-before.svg', '導入前の課題');

    // 2番目のdiv（導入後の効果）
    const afterDiv = contentDivs[1];
    processContentDiv(afterDiv, '/business/icons/cards-pain-gain-after.svg', '導入後の効果');
    afterDiv.classList.add('-after');

    // 矢印画像を2番目のdivの前に挿入
    const arrowImage = createArrowImage();
    firstDiv.insertBefore(arrowImage, afterDiv);
  }
}

/**
 * cards-pain-gainブロックのDOM操作を行う関数
 * @param {HTMLElement} domBlockRoot - ブロックのルート要素
 */
export default function decorate(domBlockRoot) {
  const firstDiv = domBlockRoot.querySelector(':scope > div:first-child');
  if (!firstDiv) return;

  // 最初のdivにcards-pain-gain-innerクラスを追加
  firstDiv.classList.add('cards-pain-gain-inner');

  // コンテンツ部分の処理
  processContentSections(firstDiv);
}
