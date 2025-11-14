/**
 * Cards Metrics Block
 */

export default function decorate(block) {
  // 既存のdiv要素を取得
  const existingDivs = Array.from(block.children);

  // 新しいul要素を作成
  const ul = document.createElement('ul');
  ul.className = 'cards-metrics';

  // 既存の属性をコピー
  Array.from(block.attributes).forEach((attr) => {
    if (attr.name !== 'class') {
      ul.setAttribute(attr.name, attr.value);
    }
  });

  // 各divをli+dl構造に変換
  existingDivs.forEach((div, index) => {
    const childDivs = Array.from(div.children);

    // 2つのdivがペアになっていることを確認
    if (childDivs.length >= 2) {
      const li = document.createElement('li');
      li.className = 'cards-metrics-items';

      const dl = document.createElement('dl');
      dl.className = 'cards-metrics-dl';

      // 最初のdiv → dt (項目)
      const dt = document.createElement('dt');
      const firstDiv = childDivs[0];

      // data-valign属性を保持
      if (firstDiv.hasAttribute('data-valign')) {
        dt.setAttribute('data-valign', firstDiv.getAttribute('data-valign'));
      }

      // 内容をコピー
      dt.innerHTML = firstDiv.innerHTML;

      // 2番目のdiv → dd (説明)
      const dd = document.createElement('dd');
      const secondDiv = childDivs[1];

      // data-valign属性を保持
      if (secondDiv.hasAttribute('data-valign')) {
        dd.setAttribute('data-valign', secondDiv.getAttribute('data-valign'));
      }

      // 内容をコピー
      dd.innerHTML = secondDiv.innerHTML;

      // 構造を組み立て
      dl.appendChild(dt);
      dl.appendChild(dd);
      li.appendChild(dl);
      ul.appendChild(li);
    }
  });

  // レスポンシブレイアウトのクラスを追加
  applyResponsiveLayout(ul);

  // 元のblock要素を新しいul要素で置き換え
  block.parentNode.replaceChild(ul, block);
}

/**
 * レスポンシブレイアウトを適用
 * 3カラムレイアウト + 最後の行の余り要素の横幅調整
 */
function applyResponsiveLayout(ul) {
  const items = Array.from(ul.children);
  const totalItems = items.length;

  // 全てのクラスをリセット
  items.forEach((item) => {
    item.classList.remove('full-width', 'half-width', 'third-width');
  });

  // 要素数に応じてレイアウトを設定
  if (totalItems === 1) {
    // 1つの場合：横幅いっぱい
    items[0].classList.add('full-width');
  } else if (totalItems === 2) {
    // 2つの場合：半分ずつ
    items.forEach((item) => item.classList.add('half-width'));
  } else {
    // 3つ以上の場合：基本は3カラム、最後の行だけ特別扱い
    const remainder = totalItems % 3;
    const lastRowStartIndex = totalItems - remainder;

    items.forEach((item, index) => {
      if (remainder === 0) {
        // 3の倍数：全て3カラム
        item.classList.add('third-width');
      } else if (index < lastRowStartIndex) {
        // 最後の行より前：3カラム
        item.classList.add('third-width');
      } else if (remainder === 1) {
        // 最後の行に1つ：横幅いっぱい
        item.classList.add('full-width');
      } else if (remainder === 2) {
        // 最後の行に2つ：半分ずつ
        item.classList.add('half-width');
      }
    });
  }
}
