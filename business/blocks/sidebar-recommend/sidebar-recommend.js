export default function decorate(block) {
  // ulを作成
  const ul = document.createElement('ul');
  ul.className = 'sidebar-recommend';

  // 各記事をliに変換
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'sidebar-recommend-item';

    // aタグを作成
    const link = document.createElement('a');
    const linkUrl = row.querySelector('a').href;
    const linkTitle = row.querySelector('a').title;
    link.href = linkUrl;
    link.title = linkTitle;

    // テキストを取得してaタグに追加
    const divs = [...row.children];
    const text1 = divs[0].querySelector('p').textContent;
    const text2 = divs[1].querySelector('p').textContent;

    const p1 = document.createElement('p');
    p1.textContent = text1;
    link.appendChild(p1);

    const p2 = document.createElement('p');
    p2.textContent = text2;
    link.appendChild(p2);

    li.appendChild(link);
    ul.appendChild(li);
  });

  // 元のブロックの中身を空にして新しい要素を追加
  block.textContent = '';
  block.appendChild(ul);
}
