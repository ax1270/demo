export default function decorate(block) {
  // 各サービスアイテムを処理
  const relatedServicesList = document.createElement('ul');

  [...block.children].forEach((row) => {
    // 各サービスアイテムを作成
    const serviceItem = document.createElement('li');
    serviceItem.className = 'related-services-items';

    // リンク要素を取得（より安全に）
    const linkElement = row.querySelector('a');
    if (!linkElement) return; // リンクがない場合はスキップ

    // aタグを作成
    const link = document.createElement('a');
    link.href = linkElement.href;
    link.title = linkElement.title;

    // 画像用のdivを作成
    const imageDiv = document.createElement('div');
    imageDiv.className = 'related-services-image';
    const picture = row.querySelector('picture');
    if (picture) {
      imageDiv.appendChild(picture.cloneNode(true));
    }

    // テキスト用のdivを作成
    const textDiv = document.createElement('div');
    textDiv.className = 'related-services-text';

    // テキストコンテンツを含むdivを取得
    const textContainerDiv = row.querySelector('div:nth-child(3)');

    if (textContainerDiv) {
      // p, ul, ol, h1-h6などのテキストコンテンツ要素を取得
      const textElements = textContainerDiv.querySelectorAll('p, ul, ol, h1, h2, h3, h4, h5, h6');

      // リンクを含まない要素を優先的に取得
      const filteredElements = Array.from(textElements).filter((element) => !element.querySelector('a'));

      // リンクを含まない要素がある場合はそれらを使用、ない場合はすべての要素を使用
      const elementsToAdd = filteredElements.length > 0 ? filteredElements : Array.from(textElements);

      // すべての対象要素をrelated-services-textに追加
      elementsToAdd.forEach((element) => {
        textDiv.appendChild(element.cloneNode(true));
      });
    }

    // aタグに画像とテキストを追加
    link.appendChild(imageDiv);
    link.appendChild(textDiv);

    // サービスアイテムにaタグを追加
    serviceItem.appendChild(link);
    relatedServicesList.appendChild(serviceItem);
  });

  // 元のブロックの中身を空にして新しい要素を追加
  block.textContent = '';
  block.appendChild(relatedServicesList);
}
