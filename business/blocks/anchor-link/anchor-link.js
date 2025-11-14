/**
 * アンカーリンクブロックを装飾する
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  // 各要素のクラス名を定義
  const baseClass = 'anchor-link';
  const listClass = `${baseClass}-list`;

  // リストを取得
  const list = block.querySelector('ul');
  if (!list) return;

  // リストにクラス名を追加
  list.className = listClass;

  // リストアイテムの数を取得し、奇数・偶数でクラスを付与
  const items = list.querySelectorAll('li');
  const isOdd = items.length % 2 !== 0;

  if (isOdd) {
    block.classList.add('is-odd-items');
  } else {
    block.classList.add('is-even-items');
  }
}
