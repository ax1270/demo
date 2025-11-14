import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateButtonsForBlocks } from '../../scripts/scripts.js';

export default function decorate(block) {
  // 各要素のクラス名を定義
  const baseClass = 'cards-recommend';
  const containerClass = `${baseClass}-list`;
  const itemWrapperClass = `${baseClass}-listItem`;
  const itemClass = `${baseClass}-item`;
  const itemInnerClass = `${itemClass}-inner`;
  // const itemImageClass = `${itemClass}-image`;
  const itemHeadingClass = `${itemClass}-heading`;
  const itemBody1Class = `${itemClass}-body1`;
  const itemBody2Class = `${itemClass}-body2`;
  const itemListsClass = `${itemClass}-lists`;

  // アイテムの数
  const blockLength = block.children.length;

  // // 画像サイズの出しわけ設定
  // const breakpoints = [
  //   { media: '(min-width: 1200px)', width: '2000' },
  //   { width: `${blockLength <= 1 ? '900' : '600'}` }
  // ];

  // containerを作成（要素が1つのみの場合はdiv）
  const container = blockLength <= 1 ? document.createElement('div') : document.createElement('ul');
  container.className = containerClass;

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

    // ボタンの装飾処理を実行
    decorateButtonsForBlocks(sectionInner);

    // 各子要素にクラスを追加
    [...sectionInner.children].forEach((child, index) => {
      switch (index) {
        case 0:
          child.className = itemHeadingClass;
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

    // クラスなしのdivでpタグのみを含む要素を青タグとして処理
    // ただし、pタグ内にリンクが含まれていない場合のみ
    // link-all処理の前に実行する必要がある
    let hasRecommendTag = false;
    // 最後のクラスなしのdivを探す
    const childrenArray = Array.from(sectionInner.children);
    const tagCandidates = childrenArray.filter((child) => child.tagName === 'DIV'
      && !child.className
      && child.querySelector('p:only-child'));

    if (tagCandidates.length > 0) {
      // 最後の候補要素を取得
      const tagElement = tagCandidates[tagCandidates.length - 1];
      const pTag = tagElement.querySelector('p');
      if (pTag && !pTag.className && !pTag.querySelector('a') && pTag.textContent.trim()) {
        // spanタグを作成してテキストを移動
        const spanTag = document.createElement('span');
        spanTag.className = `${baseClass}-tag`;
        spanTag.textContent = pTag.textContent;
        // spanをsectionの先頭に追加（sectionInnerの前）
        section.insertBefore(spanTag, sectionInner);
        // 元のdivを削除
        tagElement.remove();
        hasRecommendTag = true;
      }
    }

    // 全体がリンクエリアの場合、hrefを設定し、もとの要素を削除
    if (isLinkAll) {
      const innerLink = sectionInner.querySelector('a');
      if (innerLink) {
        section.href = innerLink.href;
        section.classList.add('-link');
        // リンクを含むdivを削除（通常はbody1またはbody2）
        const linkContainer = innerLink.closest(`.${itemBody1Class}, .${itemBody2Class}`);
        if (linkContainer) {
          linkContainer.remove();
        }
      }
    }

    // 空のbody要素を削除
    const body1 = sectionInner.querySelector(`.${itemBody1Class}`);
    const body2 = sectionInner.querySelector(`.${itemBody2Class}`);

    if (body1 && body1.textContent.trim() === '' && body1.children.length === 0) {
      body1.remove();
    }
    if (body2 && body2.textContent.trim() === '' && body2.children.length === 0) {
      body2.remove();
    }

    // 要素が1つの場合は直接追加
    if (blockLength === 1) {
      container.append(section);
    } else {
      const li = document.createElement('li');
      li.className = itemWrapperClass;

      // レコメンドタグがある場合はクラスを追加
      if (hasRecommendTag) {
        li.classList.add('-recommend');
      }

      // アイテムをリストに追加
      li.append(section);
      container.append(li);
    }

    // 通常リンクはリンク、太字になるとボタンに変更
    // デフォの設定は通常リンクでボタンになる

    // .buttonクラスが存在する場合、button-containerで囲む
    const buttons = sectionInner.querySelectorAll('.button');
    buttons.forEach((button) => {
      // すでにbutton-containerの中にある場合はスキップ
      if (!button.closest('.button-container')) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        button.parentNode.insertBefore(buttonContainer, button);
        buttonContainer.appendChild(button);
      }
    });

    // ボタンとリンクの処理
    const buttonLinks = sectionInner.querySelectorAll('.button-container');
    // ボタンコンテナが存在する場合、それらをbuttons-wrapperで囲む
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
      buttonContainers.forEach((container) => {
        buttonsWrapper.appendChild(container);
      });
      // 元の位置にbuttons-wrapperを挿入
      parentElement.insertBefore(buttonsWrapper, parentElement.children[firstButtonIndex]);
    }

    // const buttonLinks = sectionInner.querySelectorAll('.button-container');
    // buttonLinks.forEach((buttonContainer) => {
    //   const link = buttonContainer.querySelector('a');
    //   if (!link) return;

    //   // strongタグがある場合は削除してボタンとして扱う
    //   const strong = buttonContainer.querySelector('strong');
    //   if (strong) {
    //     const newLink = strong.querySelector('a');
    //     if (newLink) {
    //       strong.replaceWith(newLink);
    //     }
    //   }
    // });

    // リストのclass付け
    // 通常のリスト（ul）と順序付きリスト（ol）の両方を処理

    // リストかつ斜体のもののul・olにタグクラスをつける
    const tagsList = sectionInner.querySelectorAll('ul, ol');
    tagsList.forEach((list) => {
      // .captionクラスがついているリストはそのままにする
      if (list.classList.contains('caption')) {
        return;
      }

      const hasEmTags = Array.from(list.children).every((li) => li.querySelector('em'));
      if (hasEmTags) {
        list.className = `${itemClass}-tags`;
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

  // blockに追加
  block.innerHTML = '';
  block.append(container);
}
