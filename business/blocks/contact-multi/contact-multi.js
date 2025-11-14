import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * contact-multiブロックのDOM操作を行う関数
 * @param {HTMLElement} block - contact-multiブロックのルート要素
 */
export default function decorate(block) {
  // bg-クラスから背景色を設定する
  const setBgColor = (element) => {
    const classes = element.className.split(' ');
    const bgClass = classes.find((className) => className.startsWith('bg-'));
    if (bgClass) {
      const colorCode = bgClass.replace('bg-', '');
      element.style.backgroundColor = `#${colorCode}`;
    }
  };

  // 最初のdivにheaderクラスを設定する
  const setHeaderClass = (element) => {
    const firstDiv = element.querySelector(':scope > div:first-child');
    if (firstDiv) {
      firstDiv.classList.add('contact-multi-header');
    }
  };

  /**
   * ボタン数に応じたクラスを追加する
   * @param {HTMLElement} element - 親要素
   * @param {number} buttonCount - ボタンの数
   */
  const addButtonCountClass = (element, buttonCount) => {
    // ボタン数に応じたクラスを追加
    if (buttonCount > 0 && buttonCount <= 5) {
      element.classList.add(`button${buttonCount}`);
    }
  };

  /**
   * 画像を最適化する
   * @param {HTMLElement} element - 画像を含む要素
   */
  const optimizePictures = (element) => {
    const pictures = element.querySelectorAll('picture');
    if (!pictures.length) return;

    pictures.forEach((picture) => {
      const img = picture.querySelector('img');
      if (img) {
        // 元の画像の属性を保持
        const { src } = img;
        const alt = img.alt || '';
        const width = img.width || '';
        const height = img.height || '';

        // 最適化された画像に置き換え
        const optimizedPicture = createOptimizedPicture(src, alt, false, [
          { media: '(min-width: 600px)', width: '2000' },
          { width: '750' },
        ]);

        // 元の画像のサイズ属性を引き継ぐ
        if (width && height) {
          const newImg = optimizedPicture.querySelector('img');
          if (newImg) {
            newImg.width = width;
            newImg.height = height;
          }
        }

        picture.replaceWith(optimizedPicture);
      }
    });
  };

  // 2番目以降のdivをcontact-multi-innerで囲む
  const wrapInner = (element) => {
    const divs = Array.from(element.querySelectorAll(':scope > div:not(:first-child)'));

    if (divs.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.className = 'contact-multi-inner';

      divs.forEach((div) => {
        element.removeChild(div);
        wrapper.appendChild(div);
      });

      element.appendChild(wrapper);

      // vertical-itemクラスがない場合のみ、ボタン数に応じたクラスを追加
      if (!element.classList.contains('vertical-item')) {
        addButtonCountClass(element, divs.length);
      }
    }
  };

  /**
   * contact-multi-inner-text-boxを作成
   * button4クラスあり + 4n番目の子要素のみを対象
   * button1クラスあり + 最初の子要素のみを対象
   * vertical-itemクラスあり + 全てのアイテムを対象
   * @param {HTMLElement} element - contact-multiブロックのルート要素
   */
  const wrapAdjacentHeadingAndText = (element) => {
    const innerWrapper = element.querySelector('.contact-multi-inner');
    if (!innerWrapper) return;

    // vertical-item、button4、button1クラスのいずれも付いていない場合は処理しない
    const isVerticalItem = element.classList.contains('vertical-item');
    const isButton4 = element.classList.contains('button4');
    const isButton1 = element.classList.contains('button1');
    if (!isVerticalItem && !isButton4 && !isButton1) return;

    // 対象となるdivを取得
    let targetDivs;
    if (isVerticalItem) {
      // vertical-itemの場合は全てのアイテムを対象
      targetDivs = innerWrapper.querySelectorAll(':scope > div > div');
    } else if (isButton1) {
      // button1の場合は最初の子要素を対象
      targetDivs = innerWrapper.querySelectorAll(':scope > div:first-child > div');
    } else {
      // button4の場合は4n番目の子要素を対象
      targetDivs = innerWrapper.querySelectorAll(':scope > div:nth-child(4n) > div');
    }

    targetDivs.forEach((contentDiv) => {
      const children = Array.from(contentDiv.children);

      // 各子要素を順番に確認
      for (let i = 0; i < children.length - 1; i += 1) {
        const currentElement = children[i];
        const nextElement = children[i + 1];

        // h3の次にpがあり、そのpがbutton-containerクラスを持っていない場合
        if (
          currentElement.tagName === 'H3'
          && nextElement.tagName === 'P'
          && !nextElement.classList.contains('button-container')
        ) {
          // 既にtext-boxで囲まれていない場合のみ処理
          const { parentNode } = currentElement;
          const isAlreadyWrapped = parentNode.classList
            && parentNode.classList.contains('contact-multi-inner-text-box');

          if (!isAlreadyWrapped) {
            // 新しいdivを作成
            const textBoxWrapper = document.createElement('div');
            textBoxWrapper.className = 'contact-multi-inner-text-box';

            // h3とpを新しいdivに移動
            const h3Clone = currentElement.cloneNode(true);
            const pClone = nextElement.cloneNode(true);

            textBoxWrapper.appendChild(h3Clone);
            textBoxWrapper.appendChild(pClone);

            // 元のh3とpを置き換え
            contentDiv.insertBefore(textBoxWrapper, currentElement);
            contentDiv.removeChild(currentElement);
            contentDiv.removeChild(nextElement);

            // インデックスを調整（2つの要素を1つに置き換えたため）
            i += 1;
          }
        }
      }
    });
  };

  // 各処理を実行
  setBgColor(block);
  setHeaderClass(block);
  wrapInner(block);
  optimizePictures(block); // 画像の最適化を実行
  wrapAdjacentHeadingAndText(block);
}
