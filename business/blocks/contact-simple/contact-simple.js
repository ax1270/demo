import { decorateButtonsForBlocks } from '../../scripts/scripts.js';

/**
 * contact-simpleブロックのDOM操作を行う関数
 * @param {HTMLElement} block - contact-simpleブロックのルート要素
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
      firstDiv.classList.add('contact-simple-header');
    }
  };

  // 2番目以降のdivをcontact-simple-innerで囲む
  const wrapInner = (element) => {
    const divs = Array.from(element.querySelectorAll(':scope > div:not(:first-child)'));

    if (divs.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.className = 'contact-simple-inner';

      divs.forEach((div) => {
        element.removeChild(div);
        wrapper.appendChild(div);
      });

      element.appendChild(wrapper);

      // ボタン数に応じたクラスを追加
      addButtonCountClass(element, divs.length);
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

  // 各処理を実行
  setBgColor(block);
  setHeaderClass(block);
  wrapInner(block);
  decorateButtonsForBlocks(block);
}
