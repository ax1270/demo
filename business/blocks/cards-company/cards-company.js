/**
 * ボタンクラスを削除する関数
 * @param {HTMLElement} element - 対象要素
 */
function removeButtonClass(element) {
  const buttonLinks = element.querySelectorAll('a.button');
  buttonLinks.forEach((link) => {
    link.classList.remove('button');
  });
}

/**
 * 各項目をdl/dt/dd構造に変換する関数
 * @param {HTMLElement} div - 変換対象のdiv要素
 * @returns {HTMLElement|null} 変換されたdl要素
 */
function convertToDlStructure(div) {
  const dl = document.createElement('dl');

  // 各div内の2つのdivを取得
  const divs = div.querySelectorAll('div');
  if (divs.length >= 2) {
    // dt要素を作成（1番目のdiv）
    const dt = document.createElement('dt');
    dt.className = 'cards-company-dt';

    // dt内のp要素を移動
    const dtP = divs[0].querySelector('p');
    if (dtP) {
      dt.appendChild(dtP);
    }

    // dd要素を作成（2番目のdiv）
    const dd = document.createElement('dd');
    dd.className = 'cards-company-dd';

    // dd内のp要素を移動
    const ddP = divs[1].querySelector('p');
    if (ddP) {
      dd.appendChild(ddP);
    }

    // ボタンクラスを削除
    removeButtonClass(dd);

    // dl要素にdtとddを追加
    dl.appendChild(dt);
    dl.appendChild(dd);

    return dl;
  }

  return null;
}

/**
 * ロゴ部分の処理を行う関数
 * @param {HTMLElement} firstDiv - 最初のdiv要素
 * @returns {boolean} ロゴが存在する場合true、存在しない場合false
 */
function processLogoSection(firstDiv) {
  // 最初のdivにcards-company-content-logoクラスを追加
  firstDiv.classList.add('cards-company-content-logo');

  // 画像のpicture要素をpタグで囲む
  const pictureElement = firstDiv.querySelector('picture');
  if (pictureElement) {
    const pElement = document.createElement('p');
    pElement.className = 'cards-company-logo';
    pictureElement.parentNode.insertBefore(pElement, pictureElement);
    pElement.appendChild(pictureElement);
    return true;
  }
  return false;
}

/**
 * h2要素の処理を行う関数
 * @param {HTMLElement} firstDiv - 最初のdiv要素
 * @returns {HTMLElement|null} 処理されたh2要素
 */
function processH2Element(firstDiv) {
  // h2要素を取得してクラスを追加
  const h2Element = firstDiv.querySelector('h2');
  if (h2Element) {
    h2Element.classList.add('cards-company-name');

    // h2要素を含むdivを削除
    const h2Container = h2Element.parentElement;
    if (h2Container && h2Container.tagName === 'DIV') {
      // 画像のdivかどうかを確認（picture要素を含むdivは画像用）
      const isImageDiv = h2Container.querySelector('picture');
      if (!isImageDiv) {
        h2Container.remove();
      }
    }
  }

  return h2Element;
}

/**
 * 情報部分の処理を行う関数
 * @param {HTMLElement} domBlockRoot - ブロックのルート要素
 * @param {HTMLElement} h2Element - h2要素
 */
function processInfoSection(domBlockRoot, h2Element) {
  // 2番目以降のdivを取得してcards-company-content-infoで囲む
  const remainingDivs = Array.from(domBlockRoot.children).slice(1);
  if (remainingDivs.length > 0) {
    // cards-company-content-infoコンテナを作成
    const infoContainer = document.createElement('div');
    infoContainer.className = 'cards-company-content-info';

    // h2要素をinfoContainerに移動
    if (h2Element) {
      infoContainer.appendChild(h2Element);
    }

    // 各項目をdl/dt/dd構造に変換
    remainingDivs.forEach((div) => {
      const dl = convertToDlStructure(div);
      if (dl) {
        infoContainer.appendChild(dl);
      }
    });

    // 元のdiv要素を削除
    remainingDivs.forEach((div) => div.remove());

    // infoContainerをdomBlockRootに追加
    domBlockRoot.appendChild(infoContainer);
  }
}

/**
 * cards-companyブロックのDOM操作を行う関数
 * @param {HTMLElement} domBlockRoot - ブロックのルート要素
 */
export default function decorate(domBlockRoot) {
  const firstDiv = domBlockRoot.querySelector(':scope > div:first-child');
  if (!firstDiv) return;

  // ロゴ部分の処理
  const hasLogo = processLogoSection(firstDiv);

  // h2要素の処理
  const h2Element = processH2Element(firstDiv);

  // 情報部分の処理
  processInfoSection(domBlockRoot, h2Element);

  // ロゴが存在しない場合、cards-company-content-logoを削除
  if (!hasLogo) {
    const logoDiv = domBlockRoot.querySelector('.cards-company-content-logo');
    if (logoDiv) {
      logoDiv.remove();
    }
  }
}
