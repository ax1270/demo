import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateButtonsForBlocks } from '../../scripts/scripts.js';

export default function decorate(block) {
  // 各要素のクラス名を定義
  const baseClass = 'cards-arrow';
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

  // アイテムの数
  const blockLength = block.children.length;

  // col2-6クラスがあるかチェック
  const hasColumnClass = block.classList.contains('col2') || block.classList.contains('col3') || block.classList.contains('col4') || block.classList.contains('col5') || block.classList.contains('col6');

  // 画像サイズの出しわけ設定
  const breakpoints = [
    { media: '(min-width: 1200px)', width: '2000' },
    { width: `${blockLength <= 1 && !hasColumnClass ? '900' : '600'}` },
  ];

  // containerを作成（col2やcol3クラスがある場合は要素数に関係なくul、それ以外は要素が1つのみの場合はdiv）
  const container = (blockLength <= 1 && !hasColumnClass) ? document.createElement('div') : document.createElement('ul');
  container.className = containerClass;

  // ブロック全体の画像チェック用の配列
  const hasImageElements = [];

  [...block.children].forEach((row) => {
    // 「link-all」クラスがあれば、全体をリンクエリアに変換／見出しタグがあれば、rowをsectionに変換
    const isHeading = row.querySelector('h2, h3, h4, h5, h6');
    const isLinkAll = block.classList.contains('link-all') && row.querySelector('a');
    // const hasTags = row.querySelector('a');
    const section = document.createElement(isLinkAll ? 'a' : isHeading ? 'section' : 'div');
    const sectionInner = document.createElement('div');
    section.className = itemClass;
    sectionInner.className = itemInnerClass;
    sectionInner.append(...row.childNodes);
    section.append(sectionInner);

    // 画像要素の存在をチェック（クラス付与前）
    const firstChild = sectionInner.children[0];
    const hasImageElement = firstChild && (
      firstChild.tagName === 'PICTURE'
      || firstChild.tagName === 'IMG'
      || firstChild.querySelector('picture, img') !== null
    );

    // ブロック全体の画像チェック用に配列に追加
    hasImageElements.push(hasImageElement);

    // 各子要素にクラスを追加
    [...sectionInner.children].forEach((child, index) => {
      switch (index) {
        case 0:
          // 画像がある場合はimage、ない場合はtopクラスを付与
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

    // 全体がリンクエリアの場合、hrefを設定し、もとの要素を削除
    if (isLinkAll) {
      const innerLink = sectionInner.querySelector('a');
      section.href = innerLink.href;
      section.classList.add('-link');
      innerLink.closest('div').remove();
    }

    // 要素が1つかつcol2/col3クラスがない場合は直接追加、それ以外はliでラップ
    if (blockLength === 1 && !hasColumnClass) {
      container.append(section);
    } else {
      const li = document.createElement('li');
      li.className = itemWrapperClass;

      // アイテムをリストに追加
      li.append(section);
      container.append(li);
    }

    // ボタン装飾処理（scripts.jsの関数を使用）
    decorateButtonsForBlocks(sectionInner);

    // ボタンとリンクの処理 - ボタンコンテナをbuttons-wrapperで囲む
    const buttonLinks = sectionInner.querySelectorAll('.button-container');
    if (buttonLinks.length > 0) {
      // 最初のボタンコンテナの親要素を取得
      const { parentElement } = buttonLinks[0];
      // buttons-wrapperを作成
      const buttonsWrapper = document.createElement('div');
      buttonsWrapper.className = 'buttons-wrapper';
      // 最初のボタンコンテナの位置を特定
      const firstButtonIndex = Array.from(parentElement.children).indexOf(buttonLinks[0]);
      // すべてのボタンコンテナを取得して配列に変換
      const buttonContainers = Array.from(buttonLinks);
      // ボタンコンテナをbuttons-wrapperに移動
      buttonContainers.forEach((buttonContainer) => {
        buttonsWrapper.appendChild(buttonContainer);
      });
      // 元の位置にbuttons-wrapperを挿入
      parentElement.insertBefore(buttonsWrapper, parentElement.children[firstButtonIndex]);
    }

    // リストのclass付け
    // 通常のリスト（ul）と順序付きリスト（ol）の両方を処理

    // リストかつ斜体のもののul・olにitemTagsClassをつける
    const tagsList = sectionInner.querySelectorAll('ul, ol');
    tagsList.forEach((list) => {
      // .captionクラスがついているリストはそのままにする
      if (list.classList.contains('caption')) {
        return;
      }

      const hasEmTags = Array.from(list.children).every((li) => li.querySelector('em'));
      if (hasEmTags) {
        list.className = itemTagsClass;
        // emタグを削除してテキストのみを残す
        list.querySelectorAll('li em').forEach((em) => {
          const { textContent } = em;
          em.parentNode.textContent = textContent;
        });
      } else {
        list.className = itemListsClass;
      }
    });

    const alignList = sectionInner.querySelectorAll('[data-align]');
    alignList.forEach((align) => {
      const alignData = align.getAttribute('data-align');
      if (alignData) align.style.textAlign = alignData;
    });
  });

  // ブロック全体にno-imageクラスを付与（すべてのカードに画像がない場合のみ）
  const allCardsHaveNoImage = hasImageElements.every((hasImage) => !hasImage);
  if (allCardsHaveNoImage) {
    block.classList.add('no-image');

    // no-imageクラスがついた場合、cards-arrow-item-topクラスを削除
    container.querySelectorAll(`.${itemTopClass}`).forEach((topElement) => {
      topElement.remove();
    });
  }

  // stepクラスがついている場合、ステップ番号を追加
  if (block.classList.contains('step')) {
    const body1Elements = container.querySelectorAll(`.${itemBody1Class}`);
    body1Elements.forEach((body1Element, index) => {
      // ステップ番号の要素を作成
      const stepElement = document.createElement('div');
      stepElement.className = 'cards-arrow-step';
      stepElement.innerHTML = `
        <span class="cards-arrow-step-text">STEP</span>
        <span class="cards-arrow-step-number">${index + 1}</span>
      `;

      // body1の最初の子要素の前に挿入
      body1Element.insertBefore(stepElement, body1Element.firstChild);
    });
  }

  // pictureを最適化
  container.querySelectorAll('picture > img').forEach((img) => {
    const picture = img.closest('picture');
    picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, breakpoints));
  });

  // blockに追加
  block.innerHTML = '';
  block.append(container);
}
