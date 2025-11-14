import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const link = row.querySelector('a');
    if (link) {
      a.href = link.href; // linkのhrefをaタグに設定
      const parentP = link.closest('p'); // linkの親p要素を取得
      const parentDiv = parentP ? parentP.closest('div') : null; // linkの親pの親div要素を取得
      if (parentDiv) parentDiv.remove(); // div要素を削除
      if (parentP) parentP.remove(); // p要素を削除
      link.remove(); // ボタン要素を削除
    }
    while (row.firstElementChild) {
      const div = row.firstElementChild;
      a.append(div);
    }
    li.append(a);
    ul.append(li);
    [...a.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
