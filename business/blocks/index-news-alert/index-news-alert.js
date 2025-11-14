export default function decorate(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  // ul要素にクラスを追加
  ul.classList.add('index-news-alert-inner');

  // 各li要素を処理
  const listItems = ul.querySelectorAll('li');
  listItems.forEach((li) => {
    // li要素にクラスを追加
    li.classList.add('index-news-alert-items');

    // アラートアイコンを追加
    const icon = document.createElement('img');
    icon.setAttribute('data-icon-name', 'alert');
    icon.setAttribute('src', '/business/icons/alert.svg');
    icon.setAttribute('alt', '');
    icon.setAttribute('loading', 'lazy');

    // 最初の子要素（aタグ）の前にアイコンを挿入
    const { firstChild } = li;
    if (firstChild) {
      li.insertBefore(icon, firstChild);
    } else {
      li.appendChild(icon);
    }
  });
}
