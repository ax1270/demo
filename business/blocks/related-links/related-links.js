export default function decorate(block) {
  // 各サービスアイテムを処理
  const relatedServicesList = document.createElement('ul');

  [...block.children].forEach((row) => {
    // 各サービスアイテムを作成
    const linkItem = document.createElement('li');
    linkItem.className = 'related-links-items';

    // aタグを取得し、要素を調整
    const link = row.querySelector('a');
    if (link) {
      link.classList.remove('button'); // クラス名を削除
      link.className = 'related-links-link';

      // 'icon'クラスを持つspanタグを取得
      const iconSpan = link.querySelector('span.icon');
      if (iconSpan) {
        const hasIconArrowClass = [...iconSpan.classList].some((className) => className.startsWith('icon-arrow'));
        if (hasIconArrowClass) {
          iconSpan.classList.add('related-links-icon');
        }
      }
    }

    // リンクスアイテムにaタグを追加
    linkItem.appendChild(link);
    relatedServicesList.appendChild(linkItem);
  });

  // 元のブロックの中身を空にして新しい要素を追加
  block.textContent = '';
  block.appendChild(relatedServicesList);
}
