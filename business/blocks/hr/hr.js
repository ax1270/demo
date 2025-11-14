/**
 * hrブロックを装飾する関数
 * @param {HTMLElement} block - 装飾対象のブロック要素
 */

export default function decorate(block) {
  // ブロックにクラスとデータ属性を追加
  block.classList.add('block');
  block.setAttribute('data-block-name', 'hr');
  block.setAttribute('data-block-status', 'loaded');

  // hrタグを作成して追加
  const hrElement = document.createElement('hr');
  block.appendChild(hrElement);
}
