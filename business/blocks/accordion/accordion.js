/**
 * セルにスタイルを適用する関数
 * @param {Element} cell - スタイルを適用するセル要素
 * @param {Element} sourceCell - スタイル情報の取得元セル要素
 */
function applyStyles(cell, sourceCell) {
  // align属性またはdata-align属性を確認
  const align = sourceCell.getAttribute('align') || sourceCell.getAttribute('data-align');
  const valign = sourceCell.getAttribute('valign') || sourceCell.getAttribute('data-valign');

  if (align) cell.style.textAlign = align;
  if (valign) cell.style.verticalAlign = valign;
}

/**
 * th要素内のh6要素をpタグに変換する関数
 * @param {Element} thElement - 変換対象のth要素
 */
function convertH6ToP(thElement) {
  thElement.querySelectorAll('h6').forEach((h6) => {
    const p = document.createElement('p');
    p.innerHTML = h6.innerHTML;

    // h6のすべての属性をpタグにコピー
    const attrs = Array.from(h6.attributes);
    attrs.forEach((attr) => {
      p.setAttribute(attr.name, attr.value);
    });

    h6.replaceWith(p);
  });
}

export default function decorate(block) {
  // .accordion.qaかどうかを判定
  const isQaAccordion = block.classList.contains('qa');

  // accordionクラスの直下にあるdivにaccordion-itemクラスを付与
  [...block.children].forEach((row) => {
    row.classList.add('accordion-item');

    // 各アイテム内の子要素にクラスを付与
    const children = [...row.children];
    if (children.length >= 1) {
      children[0].classList.add('question-txt');

      // QAアコーディオンの場合はQアイコンを追加
      if (isQaAccordion) {
        const qIcon = document.createElement('span');
        qIcon.classList.add('qa-icon');
        qIcon.textContent = 'Q';
        children[0].prepend(qIcon);
      }

      // クリックイベントを追加
      children[0].addEventListener('click', () => {
        // 開閉状態を切り替え
        row.classList.toggle('is-open');
      });
    }
    if (children.length >= 2) {
      children[1].classList.add('answer-txt');
    }

    // aタグからbuttonクラスを削除
    row.querySelectorAll('a').forEach((link) => {
      if (link.classList.contains('button')) {
        link.classList.remove('button');
      }
    });

    // テーブル要素のセルにスタイルを適用
    row.querySelectorAll('table th, table td').forEach((cell) => {
      applyStyles(cell, cell);
    });

    // tdの中にh6タグがある場合、tdをthに変換
    row.querySelectorAll('td').forEach((td) => {
      if (td.querySelector('h6')) {
        const th = document.createElement('th');
        th.innerHTML = td.innerHTML;
        th.className = td.className;

        // スタイルを適用
        applyStyles(th, td);

        // th要素内のh6をpタグに変換
        convertH6ToP(th);

        td.parentNode.replaceChild(th, td);
      }
    });
  });
}
