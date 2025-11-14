export default function decorate(block) {
  // news-single-innerコンテナを作成
  const innerDiv = document.createElement('div');
  innerDiv.className = 'news-single-inner';

  // 既存の子要素を取得
  const children = [...block.children];

  if (children.length > 0) {
    const firstChild = children[0];
    const childDivs = [...firstChild.children];

    // 1番目のdiv（日付）の処理
    if (childDivs.length > 0) {
      const dateDiv = childDivs[0];
      // 中身があるかチェック（テキストコンテンツまたは子要素があるか）
      const hasContent = dateDiv.textContent.trim() !== '' || dateDiv.children.length > 0;

      if (hasContent) {
        dateDiv.className = 'news-single-date';
        innerDiv.appendChild(dateDiv);
      }
    }

    // 2番目のdiv（コンテンツ）の処理
    if (childDivs.length > 1) {
      const contentDiv = childDivs[1];
      contentDiv.className = 'news-single-content';
      innerDiv.appendChild(contentDiv);
    }
  }

  // 元の内容をクリアしてinnerDivを追加
  block.textContent = '';
  block.appendChild(innerDiv);
}
