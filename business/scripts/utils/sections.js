/**
 * セクション処理関連のユーティリティ関数
 */

import {
  copyAttributes,
  processStyleAttribute,
  createHgroup,
  setupResponsiveBackground,
  isColorCodeValue,
  extractColorCode,
} from './styles.js';

/**
 * data-background-color属性を持つsectionの背景色処理（クラス追加とスタイル設定のみ）
 * @param {Element} main The main element
 */
export function processSectionBackgroundColor(main) {
  const sections = main.querySelectorAll('div.section[data-background-color]');

  sections.forEach((section) => {
    try {
      const backgroundColor = section.getAttribute('data-background-color');

      // data-background-colorが空文字列でない場合のみ処理
      if (backgroundColor && backgroundColor.trim() !== '') {
        // bg-section-containerクラスを追加
        section.classList.add('bg-section-container');

        // カンマ区切りで分割して各値を処理
        const colorValues = backgroundColor.split(',').map((val) => val.trim()).filter((val) => val !== '');

        colorValues.forEach((colorValue) => {
          // カラーコード指定かどうかで処理を分岐
          if (isColorCodeValue(colorValue)) {
            // カラーコードの場合はstyle属性で背景色を設定
            const colorCode = extractColorCode(colorValue);
            section.style.backgroundColor = colorCode;
          } else {
            // 通常のクラス名の場合はクラスとして追加
            section.classList.add(colorValue);
          }
        });
      }
    } catch (error) {
      console.error('Section background color processing failed:', error, section);
    }
  });
}

/**
 * bg-section-containerクラスを持つsection内のコンテンツを.bg-section-wrapperで囲う処理
 * @param {Element} main The main element
 */
export function processSectionContentWrappers(main) {
  const bgSections = main.querySelectorAll('div.section.bg-section-container');

  bgSections.forEach((section) => {
    try {
      // セクション内のすべての直接の子要素を取得（既存のbg-section-wrapperは除外）
      const childElements = Array.from(section.children).filter((child) => !child.classList.contains('bg-section-wrapper'));

      if (childElements.length > 0) {
        // bg-section-wrapperを作成
        const bgSectionWrapper = document.createElement('div');
        bgSectionWrapper.className = 'bg-section-wrapper';

        // 最初の子要素の前にbg-section-wrapperを挿入
        section.insertBefore(bgSectionWrapper, childElements[0]);

        // すべての子要素をbg-section-wrapperに移動
        childElements.forEach((child) => {
          bgSectionWrapper.appendChild(child);
        });
      }
    } catch (error) {
      console.error('Section content wrapper processing failed:', error, section);
    }
  });
}

/**
 * .index-sectionクラスを持つdivをsectionに変換し、適切な構造を作成する
 * @param {Element} main The main element
 */
export function processIndexSections(main) {
  const indexSectionDivs = main.querySelectorAll('div.section.index-section[data-section-status="loaded"]');

  indexSectionDivs.forEach((divSection) => {
    try {
      const dataTitle = divSection.getAttribute('data-title');
      const dataSubtitle = divSection.getAttribute('data-subtitle');
      const dataBackground = divSection.getAttribute('data-background');
      const dataBackgroundSp = divSection.getAttribute('data-background-sp');

      // 新しいsection要素を作成
      const sectionElement = document.createElement('section');

      // 属性とスタイルをコピー
      copyAttributes(divSection, sectionElement);
      processStyleAttribute(divSection, sectionElement);

      // data-section-statusを維持
      sectionElement.dataset.sectionStatus = 'loaded';

      // index-section-content構造を作成
      const contentDiv = document.createElement('div');
      contentDiv.className = 'index-section-content';

      // hgroupを作成して追加
      const hgroup = createHgroup(dataSubtitle, dataTitle);
      contentDiv.appendChild(hgroup);

      // 既存の子要素を移動
      while (divSection.firstChild) {
        contentDiv.appendChild(divSection.firstChild);
      }

      // 構造を組み立て
      sectionElement.appendChild(contentDiv);

      // レスポンシブ背景画像を設定
      setupResponsiveBackground(sectionElement, dataBackground, dataBackgroundSp);

      // 元のdiv要素を置き換え
      divSection.parentNode.replaceChild(sectionElement, divSection);
    } catch (error) {
      console.error('Index section conversion failed:', error, divSection);
    }
  });
}

/**
 * PDFリンクとZIPリンクにアイコンを追加する
 * @param {Element} element container element
 */
export function addFileIcons(element) {
  // ファイルタイプの設定
  const fileTypes = [
    {
      extension: 'pdf',
      linkClass: 'pdf-link',
      alt: 'PDF',
    },
    {
      extension: 'zip',
      linkClass: 'zip-link',
      alt: 'ZIP',
    },
  ];
  element.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href) {
      const extension = href.split('.').pop().trim().toLowerCase();

      const fileType = fileTypes.find((type) => type.extension === extension);
      if (fileType) {
        a.classList.add(fileType.linkClass);
      }
    }
  });
}

/**
 * リスト内のcodeタグを処理してcaptionクラスを追加する
 * @param {Element} element container element
 */
export function processCaptionLists(element) {
  // ul と ol の両方を対象にする
  const lists = element.querySelectorAll('ul, ol');

  lists.forEach((list) => {
    // リスト内にcodeタグが含まれているかチェック（li内のどこにあってもOK）
    const codeElements = list.querySelectorAll('li code');

    if (codeElements.length > 0) {
      // captionクラスを追加（既存のクラスを保持）
      list.classList.add('caption');

      // 各codeタグを処理
      codeElements.forEach((code) => {
        const codeText = code.innerHTML;
        const { parentElement } = code;

        // 親要素がcodeタグのみを含むかチェック（テキストノードも考慮）
        const hasOnlyCodeTag = parentElement
          && parentElement.childNodes.length === 1
          && parentElement.firstChild === code;

        if (hasOnlyCodeTag) {
          // 親要素にcodeの内容を設定してcodeタグを削除
          code.remove();
          parentElement.innerHTML = codeText;
        } else {
          // codeタグだけを置き換え（内容はそのまま、タグのみ削除）
          code.outerHTML = codeText;
        }
      });
    }
  });
}

/**
 * point-icon要素を作成する
 * @returns {Element} point-icon要素
 */
function createPointIcon() {
  const pointIcon = document.createElement('p');
  pointIcon.className = 'point-icon';

  const iconImg = document.createElement('img');
  iconImg.src = '/business/icons/case-point.png';
  iconImg.alt = 'POINT';

  pointIcon.appendChild(iconImg);
  return pointIcon;
}

/**
 * point-content構造を作成し、既存コンテンツを組み込む
 * @param {Array<Element>} contentChildren 既存のコンテンツ要素
 * @returns {Element} point-content要素
 */
function createPointContentStructure(contentChildren) {
  const pointContent = document.createElement('div');
  pointContent.className = 'point-content block';
  pointContent.setAttribute('data-block-name', 'point-content');
  pointContent.setAttribute('data-block-status', 'loaded');

  // point-iconを追加
  pointContent.appendChild(createPointIcon());

  // 既存のコンテンツを追加
  contentChildren.forEach((child) => {
    pointContent.appendChild(child);
  });

  return pointContent;
}

/**
 * point-content内のul要素にクラス名を付与する
 * @param {Element} pointContent point-content要素
 */
function processPointContentLinks(pointContent) {
  const ulElements = pointContent.querySelectorAll('ul');

  ulElements.forEach((ul) => {
    // ul内にaタグが1つでもあるかチェック
    const hasLinks = ul.querySelectorAll('a').length > 0;

    if (hasLinks) {
      // ulにpoint-link-wrapクラスを追加
      ul.classList.add('point-link-wrap');

      // すべてのli要素にpoint-link-itemsクラスを追加
      const liElements = ul.querySelectorAll('li');
      liElements.forEach((li) => {
        li.classList.add('point-link-items');
      });
    }
  });
}

/**
 * data-section-type="point"を持つsectionを処理してpoint-content構造を作成する
 * @param {Element} element container element
 */
export function processPointSections(element) {
  const pointSections = element.querySelectorAll('[data-section-type="point"]');

  pointSections.forEach((section) => {
    try {
      // section内のすべての子要素を取得
      const sectionChildren = Array.from(section.children);

      // point-content構造を作成
      const pointContent = createPointContentStructure(sectionChildren);

      // point-content内のul要素を処理
      processPointContentLinks(pointContent);

      // section内のすべての要素をクリア
      section.innerHTML = '';

      // point-contentをsectionに追加
      section.appendChild(pointContent);
    } catch (error) {
      console.error('Point section processing failed:', error, section);
    }
  });
}
