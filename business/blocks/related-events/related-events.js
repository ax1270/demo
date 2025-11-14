export default function decorate(block) {
  // 各イベントアイテムを処理
  [...block.children].forEach((row) => {
    // クラス名を追加
    row.className = 'related-events-items';

    // 各セクションにクラス名を追加
    const [tagSection, dateSection, eventsSection] = row.children;

    // タグセクションの処理
    if (tagSection) {
      tagSection.className = 'related-events-tag';
      const button = tagSection.querySelector('a.button');
      if (button) {
        button.classList.remove('button');
      }
    }

    // 日付セクションの処理
    if (dateSection) {
      dateSection.className = 'related-events-date';
    }

    // イベントセクションの処理
    if (eventsSection) {
      eventsSection.className = 'related-events-events';
      const button = eventsSection.querySelector('a.button');
      if (button) {
        button.classList.remove('button');
      }
    }

    // button-containerクラスを削除
    row.querySelectorAll('.button-container').forEach((container) => {
      container.classList.remove('button-container');
    });
  });
}
