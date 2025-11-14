import { decorateButtonsForBlocks } from '../../scripts/scripts.js';

/**
 * lists-case-serviceブロックのDOM操作を行う関数
 * @param {HTMLElement} block - lists-case-serviceブロックのルート要素
 */
export default function decorate(block) {
  // クラス名を定義
  const baseClass = 'lists-case-service';
  const wrapperClass = `${baseClass}-wrap`;
  const itemClass = `${baseClass}-items`;
  const contentClass = `${baseClass}-content`;
  const buttonsClass = `${baseClass}-buttons`;

  // ulコンテナを作成
  const ul = document.createElement('ul');
  ul.className = wrapperClass;

  // 子要素の数を取得
  const itemCount = block.children.length;

  // 要素数に応じたクラスを追加
  if (itemCount % 2 === 0) {
    ul.classList.add('even');
  } else {
    ul.classList.add('odd');
  }

  // 各子要素を処理
  [...block.children].forEach((row) => {
    // liを作成
    const li = document.createElement('li');
    li.className = itemClass;

    // rowの子要素（div）にクラスを付与
    [...row.children].forEach((child, index) => {
      if (index === 0) {
        // 最初のdiv: コンテンツ部分
        child.classList.add(contentClass);
      } else if (index === 1) {
        // 2番目のdiv: ボタン部分
        child.classList.add(buttonsClass);
      }
    });

    // rowの中身をliに移動
    li.append(...row.childNodes);
    ul.appendChild(li);
  });

  // ボタン装飾処理
  decorateButtonsForBlocks(ul);

  // blockの内容を置き換え
  block.innerHTML = '';
  block.appendChild(ul);
}
