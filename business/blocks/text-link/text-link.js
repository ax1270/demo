export default function decorate(block) {
  // block内のすべてのaタグを取得
  const links = block.querySelectorAll('a');

  links.forEach((link) => {
    // class="button"を削除
    link.classList.remove('button');

    // aタグの親要素を取得
    const parentP = link.closest('p');
    const parentDiv = parentP ? parentP.closest('div') : null;

    // 親要素を削除
    if (parentDiv) parentDiv.remove();
    if (parentP) parentP.remove();

    // 新しいdivを作成し、aタグをその中に追加
    const newDiv = document.createElement('div');
    newDiv.appendChild(link);

    // blockの内容をクリアし、新しいdivを追加
    block.textContent = '';
    block.appendChild(newDiv);
  });
}
