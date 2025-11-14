export default function decorate(block) {
  // 外側のdiv要素はそのまま維持し、内側にul要素を作成
  const ul = document.createElement('ul');
  ul.className = 'card-case-list';

  // 各行（カードアイテム）を処理
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'card-case-listItem';

    // article要素を作成
    const article = document.createElement('article');
    article.className = 'card-case-item';

    // a要素を作成
    const link = document.createElement('a');
    link.className = 'card-case-item-link';

    // 3番目のdivからリンクURLを取得
    const linkDiv = row.children[2];
    const linkElement = linkDiv?.querySelector('a');
    if (linkElement) {
      link.href = linkElement.href;
      link.title = linkElement.title || linkElement.href;
    }

    // inner wrapper
    const innerDiv = document.createElement('div');
    innerDiv.className = 'card-case-item-inner';

    // 画像部分（1番目のdiv）
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'card-case-item-image-wrapper';
    const originalImageDiv = row.children[0];
    if (originalImageDiv) {
      // 画像の内容をそのままコピー
      imageWrapper.innerHTML = originalImageDiv.innerHTML;
    }

    // コンテンツ部分（2番目のdiv）
    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-case-item-content';
    const originalContentDiv = row.children[1];

    if (originalContentDiv) {
      const contentElements = [...originalContentDiv.children];

      // カテゴリ（1番目のp要素）
      if (contentElements[0] && contentElements[0].tagName === 'P') {
        const category = document.createElement('p');
        category.className = 'card-case-item-category';
        category.textContent = contentElements[0].textContent;
        contentDiv.appendChild(category);
      }

      // 会社名（2番目のp要素、<u>や<span>を考慮）
      if (contentElements[1] && contentElements[1].tagName === 'P') {
        const companyName = document.createElement('p');
        companyName.className = 'card-case-item-name';
        companyName.textContent = contentElements[1].textContent;
        contentDiv.appendChild(companyName);
      }

      // タイトル（h4要素のまま維持）
      const titleElement = originalContentDiv.querySelector('h4');
      if (titleElement) {
        const title = document.createElement('h4');
        title.className = 'card-case-item-title';
        title.textContent = titleElement.textContent;
        contentDiv.appendChild(title);
      }

      // タグリスト（ul要素）
      const originalTagList = originalContentDiv.querySelector('ul');
      if (originalTagList) {
        const tagList = document.createElement('ul');
        tagList.className = 'card-case-item-tag-list';

        [...originalTagList.children].forEach((tagItem) => {
          const li = document.createElement('li');
          li.className = 'card-case-item-tag-list-listItem';
          li.textContent = tagItem.textContent;
          tagList.appendChild(li);
        });

        contentDiv.appendChild(tagList);
      }
    }

    // 構造を組み立て
    innerDiv.appendChild(imageWrapper);
    innerDiv.appendChild(contentDiv);
    link.appendChild(innerDiv);
    article.appendChild(link);
    li.appendChild(article);
    ul.appendChild(li);
  });

  // 既存のblock要素の中身をクリアしてul要素を追加
  block.innerHTML = '';
  block.appendChild(ul);
}
