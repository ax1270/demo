import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateButtonsForBlocks } from '../../scripts/scripts.js';

/**
 * Cards Line Block
 * 線で区切られたカードブロック
 */
export default function decorate(block) {
  // ========================================
  // 初期設定
  // ========================================

  // クラス名の定義
  const baseClass = 'cards-line';
  const containerClass = `${baseClass}-list`;
  const itemWrapperClass = `${baseClass}-listItem`;
  const itemClass = `${baseClass}-item`;
  const itemInnerClass = `${itemClass}-inner`;
  const itemImageClass = `${itemClass}-image`;
  const itemTopClass = `${itemClass}-top`;
  const itemBody1Class = `${itemClass}-body1`;
  const itemBody2Class = `${itemClass}-body2`;
  const itemListsClass = `${itemClass}-lists`;
  const itemTagsClass = `${itemClass}-tags`;

  // ブロック情報の取得
  const blockLength = block.children.length;
  const hasColumnClass = block.classList.contains('col2')
    || block.classList.contains('col3')
    || block.classList.contains('col4')
    || block.classList.contains('col5')
    || block.classList.contains('col6');

  // 画像サイズの設定（レスポンシブ対応）
  const breakpoints = [
    { media: '(min-width: 1200px)', width: '2000' },
    { width: `${blockLength <= 1 && !hasColumnClass ? '900' : '600'}` },
  ];

  // コンテナの作成（ulまたはdiv）
  const container = (blockLength <= 1 && !hasColumnClass)
    ? document.createElement('div')
    : document.createElement('ul');
  container.className = containerClass;

  // 画像の有無をチェックする配列
  const hasImageElements = [];

  // ========================================
  // 各行の処理
  // ========================================

  [...block.children].forEach((row) => {
    // セクション要素の作成（link-all時はaタグ、見出しありはsectionタグ）
    const isHeading = row.querySelector('h2, h3, h4, h5, h6');
    const isLinkAll = block.classList.contains('link-all') && row.querySelector('a');
    const section = document.createElement(isLinkAll ? 'a' : isHeading ? 'section' : 'div');
    const sectionInner = document.createElement('div');

    section.className = itemClass;
    sectionInner.className = itemInnerClass;
    sectionInner.append(...row.childNodes);
    section.append(sectionInner);

    // 画像の有無をチェック
    const firstChild = sectionInner.children[0];
    const hasImageElement = firstChild && (
      firstChild.tagName === 'PICTURE'
      || firstChild.tagName === 'IMG'
      || firstChild.querySelector('picture, img') !== null
    );
    hasImageElements.push(hasImageElement);

    // 各子要素にクラスを付与
    [...sectionInner.children].forEach((child, index) => {
      switch (index) {
        case 0:
          child.className = hasImageElement ? itemImageClass : itemTopClass;
          break;
        case 1:
          child.className = itemBody1Class;
          break;
        case 2:
          child.className = itemBody2Class;
          break;
        default:
          break;
      }
    });

    // link-allクラスの処理
    if (isLinkAll) {
      const innerLink = sectionInner.querySelector('a');
      section.href = innerLink.href;
      section.classList.add('-link');
      innerLink.closest('div').remove();
    }

    // リストアイテムとしてコンテナに追加
    if (blockLength === 1 && !hasColumnClass) {
      container.append(section);
    } else {
      const li = document.createElement('li');
      li.className = itemWrapperClass;
      li.append(section);
      container.append(li);
    }

    // ========================================
    // ボタンの処理
    // ========================================

    decorateButtonsForBlocks(sectionInner);

    const buttonLinks = sectionInner.querySelectorAll('.button-container');
    if (buttonLinks.length > 0) {
      const { parentElement } = buttonLinks[0];
      const buttonsWrapper = document.createElement('div');
      buttonsWrapper.className = 'buttons-wrapper';

      const firstButtonIndex = Array.from(parentElement.children).indexOf(buttonLinks[0]);
      const buttonContainers = Array.from(buttonLinks);

      buttonContainers.forEach((buttonContainer) => {
        buttonsWrapper.appendChild(buttonContainer);
      });

      parentElement.insertBefore(buttonsWrapper, parentElement.children[firstButtonIndex]);
    }

    // ========================================
    // リストの処理
    // ========================================

    const tagsList = sectionInner.querySelectorAll('ul, ol');
    tagsList.forEach((list) => {
      // captionクラスがある場合はスキップ
      if (list.classList.contains('caption')) {
        return;
      }

      // すべてのliにemがある場合はタグとして扱う
      const hasEmTags = Array.from(list.children).every((li) => li.querySelector('em'));
      if (hasEmTags) {
        list.className = itemTagsClass;
        list.querySelectorAll('li em').forEach((em) => {
          em.parentNode.textContent = em.textContent;
        });
      } else {
        list.className = itemListsClass;
      }
    });

    // data-align属性の処理
    const alignList = sectionInner.querySelectorAll('[data-align]');
    alignList.forEach((align) => {
      const alignData = align.getAttribute('data-align');
      if (alignData) align.style.textAlign = alignData;
    });
  });

  // ========================================
  // ブロック全体の処理
  // ========================================

  // すべてのカードに画像がない場合、no-imageクラスを付与
  const allCardsHaveNoImage = hasImageElements.every((hasImage) => !hasImage);
  if (allCardsHaveNoImage) {
    block.classList.add('no-image');

    container.querySelectorAll(`.${itemTopClass}`).forEach((topElement) => {
      topElement.remove();
    });
  }

  // 画像の最適化
  container.querySelectorAll('picture > img').forEach((img) => {
    const picture = img.closest('picture');
    picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, breakpoints));
  });

  // DOMに追加
  block.innerHTML = '';
  block.append(container);
}
