export default function decorate(block) {
  // ulを取得
  const ul = block.querySelector('ul');

  if (ul) {
    // 元のブロックの中身を空にして新しい要素を追加
    block.textContent = '';
    block.appendChild(ul);
  }
}
