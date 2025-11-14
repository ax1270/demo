/**
 * スタイル・属性処理関連のユーティリティ関数
 */

/**
 * divセクションの属性をコピーする（styleは除外）
 * @param {Element} sourceDiv コピー元のdiv要素
 * @param {Element} targetSection コピー先のsection要素
 */
export function copyAttributes(sourceDiv, targetSection) {
  [...sourceDiv.attributes].forEach((attr) => {
    if (attr.name !== 'style') {
      targetSection.setAttribute(attr.name, attr.value);
    }
  });
}

/**
 * スタイル属性を処理する（display: noneを除外）
 * @param {Element} sourceDiv コピー元のdiv要素
 * @param {Element} targetSection コピー先のsection要素
 */
export function processStyleAttribute(sourceDiv, targetSection) {
  const originalStyle = sourceDiv.getAttribute('style');
  if (!originalStyle) return;

  const styleWithoutDisplay = originalStyle
    .split(';')
    .filter((style) => style.trim() && !style.trim().startsWith('display:'))
    .join(';');

  if (styleWithoutDisplay) {
    targetSection.setAttribute('style', styleWithoutDisplay);
  }
}

/**
 * hgroup要素を作成する
 * @param {string} subtitle データ属性のsubtitle
 * @param {string} title データ属性のtitle
 * @returns {Element} 作成されたhgroup要素
 */
export function createHgroup(subtitle, title) {
  const hgroup = document.createElement('hgroup');

  // サブタイトルを先に追加
  if (subtitle) {
    const p = document.createElement('p');
    p.textContent = subtitle;
    hgroup.appendChild(p);
  }

  // タイトルを後に追加
  if (title) {
    const h2 = document.createElement('h2');
    // カンマ（,）をbrタグに変換
    const titleWithBreaks = title.replace(/,/g, '<br>');
    h2.innerHTML = titleWithBreaks;
    hgroup.appendChild(h2);
  }

  return hgroup;
}

/**
 * レスポンシブ背景画像を設定する
 * @param {Element} element 背景画像を設定する要素
 * @param {string} backgroundUrl デスクトップ用背景画像URL
 * @param {string} backgroundSpUrl SP用背景画像URL
 */
export function setupResponsiveBackground(element, backgroundUrl, backgroundSpUrl) {
  if (!backgroundUrl && !backgroundSpUrl) return;

  const setBackgroundImage = () => {
    const isMobile = window.innerWidth < 768;
    const bgImage = isMobile && backgroundSpUrl ? backgroundSpUrl : backgroundUrl;

    if (bgImage) {
      element.style.backgroundImage = `url("${bgImage}")`;
    }
  };

  // 初期設定
  setBackgroundImage();

  // リサイズ時の対応
  window.addEventListener('resize', setBackgroundImage);
}

/**
 * カラーコード指定かどうかを判定する
 * @param {string} colorValue - カラー値
 * @returns {boolean} カラーコード指定の場合true
 */
export function isColorCodeValue(colorValue) {
  // #があってもなくても、6桁の16進数が続くパターンをチェック
  return /^#?[0-9a-fA-F]{6}$/.test(colorValue);
}

/**
 * カラーコード値から実際のカラーコードを抽出する
 * @param {string} colorValue - カラー値
 * @returns {string} カラーコード（#付き）
 */
export function extractColorCode(colorValue) {
  // #で始まっていない場合は#を追加する
  return colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
}

/**
 * meta name="style"のcontentをmainタグのクラスとして追加する
 * @param {Element} main The main element
 */
export function addStyleClassesToMain(main) {
  const styleMeta = document.querySelector('meta[name="style"]');
  if (styleMeta) {
    const styleContent = styleMeta.getAttribute('content');
    if (styleContent) {
      // カンマ区切りで分割し、前後の空白を削除してクラス名として追加
      const classNames = styleContent.split(',').map((className) => className.trim().toLowerCase());
      classNames.forEach((className) => {
        if (className) {
          main.classList.add(className);
        }
      });
    }
  }
}

/**
 * meta name="page-width"のcontentをmainタグのdata-page-width属性として追加する
 * @param {Element} main The main element
 */
export function addPageWidthAttributeToMain(main) {
  const pageWidthMeta = document.querySelector('meta[name="page-width"]');
  if (pageWidthMeta) {
    const pageWidthContent = pageWidthMeta.getAttribute('content');
    if (pageWidthContent) {
      main.setAttribute('data-page-width', pageWidthContent.trim());
    }
  }
}

/**
 * meta name="page-style"のcontentをmainタグのdata-page-style属性として追加する
 * @param {Element} main The main element
 */
export function addPageStyleAttributeToMain(main) {
  const pageStyleMeta = document.querySelector('meta[name="page-style"]');
  if (pageStyleMeta) {
    const pageStyleContent = pageStyleMeta.getAttribute('content');
    if (pageStyleContent) {
      main.setAttribute('data-page-style', pageStyleContent.trim());
    }
  }
}
