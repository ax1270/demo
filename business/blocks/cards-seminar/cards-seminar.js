export default function decorate(block) {
  // 外側のdiv要素をul要素に変換
  const ul = document.createElement('ul');
  ul.className = 'cards-seminar-list';

  // 各行（セミナーアイテム）を処理
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'card-seminar-item';

    // a要素を作成
    const link = document.createElement('a');
    link.className = 'card-seminar-link';

    // 3番目のdivからリンクURLを取得
    const linkDiv = row.children[2];
    const linkElement = linkDiv?.querySelector('a');
    if (linkElement) {
      link.href = linkElement.href;
      link.title = linkElement.title || linkElement.href;
      link.target = linkElement.target || '_blank';
    }

    // 画像部分（1番目のdiv）
    const imageDiv = document.createElement('div');
    imageDiv.className = 'card-seminar-image';
    const originalImageDiv = row.children[0];
    if (originalImageDiv) {
      // 画像の内容をそのままコピー
      imageDiv.innerHTML = originalImageDiv.innerHTML;
    }

    // コンテンツ部分（2番目のdiv）
    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-seminar-content';
    const originalContentDiv = row.children[1];

    if (originalContentDiv) {
      const contentElements = [...originalContentDiv.children];

      // カテゴリ（1番目のp要素）
      if (contentElements[0] && contentElements[0].tagName === 'P') {
        const category = document.createElement('p');
        category.className = 'card-seminar-category';
        category.textContent = contentElements[0].textContent;
        contentDiv.appendChild(category);
      }

      // 時間（2番目のp要素、<u>タグを考慮）
      if (contentElements[1] && contentElements[1].tagName === 'P') {
        const time = document.createElement('p');
        time.className = 'card-seminar-time';
        time.textContent = contentElements[1].textContent;
        contentDiv.appendChild(time);
      }

      // タイトル（h4要素のまま維持）
      const titleElement = originalContentDiv.querySelector('h4');
      if (titleElement) {
        const title = document.createElement('h4');
        title.className = 'card-seminar-title';
        title.textContent = titleElement.textContent;
        // IDがある場合は保持
        if (titleElement.id) {
          title.id = titleElement.id;
        }
        contentDiv.appendChild(title);
      }

      // コメント（3番目のp要素）
      if (contentElements[3] && contentElements[3].tagName === 'P') {
        const comment = document.createElement('p');
        comment.className = 'card-seminar-comment';
        comment.textContent = contentElements[3].textContent;
        contentDiv.appendChild(comment);
      }

      // タグリスト（ul要素）
      const originalTagList = originalContentDiv.querySelector('ul');
      if (originalTagList) {
        const tagList = document.createElement('ul');
        tagList.className = 'card-seminar-tags';

        [...originalTagList.children].forEach((tagItem) => {
          const li = document.createElement('li');
          li.textContent = tagItem.textContent;
          tagList.appendChild(li);
        });

        contentDiv.appendChild(tagList);
      }
    }

    // 構造を組み立て
    link.appendChild(imageDiv);
    link.appendChild(contentDiv);
    li.appendChild(link);
    ul.appendChild(li);
  });

  // 既存のblock要素の中身をクリアしてul要素を追加
  block.innerHTML = '';
  block.appendChild(ul);
}
