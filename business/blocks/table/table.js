/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(col) {
  // セルの内容にh6要素があるかチェック
  const hasH6 = col.querySelector('h6');
  const cell = hasH6 ? document.createElement('th') : document.createElement('td');

  // colspan, rowspan属性をコピー
  if (col.hasAttribute('colspan')) {
    cell.setAttribute('colspan', col.getAttribute('colspan'));
  }
  if (col.hasAttribute('rowspan')) {
    cell.setAttribute('rowspan', col.getAttribute('rowspan'));
  }

  return cell;
}

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
    for (const attr of h6.attributes) {
      p.setAttribute(attr.name, attr.value);
    }

    h6.replaceWith(p);
  });
}

export default async function decorate(block) {
  // ネストされているテーブルの存在を確認
  const nestedTable = block.querySelector('table');
  if (nestedTable) {
    // すべてのセルを確認してh6要素があるものをthに変換
    nestedTable.querySelectorAll('td').forEach((td) => {
      const hasH6 = td.querySelector('h6');
      if (hasH6) {
        const th = document.createElement('th');
        th.innerHTML = td.innerHTML;

        // colspan, rowspan属性をコピー
        if (td.hasAttribute('colspan')) {
          th.setAttribute('colspan', td.getAttribute('colspan'));
        }
        if (td.hasAttribute('rowspan')) {
          th.setAttribute('rowspan', td.getAttribute('rowspan'));
        }

        // スタイルを適用
        applyStyles(th, td);

        // th要素内のh6をpタグに変換
        convertH6ToP(th);

        td.replaceWith(th);
      }
    });

    // すべてのセルにスタイルを適用
    nestedTable.querySelectorAll('th, td').forEach((cell) => {
      applyStyles(cell, cell);
    });

    block.innerHTML = '';
    block.append(nestedTable);
    return;
  }

  // 標準コード
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  table.append(tbody);

  [...block.children].forEach((child) => {
    const row = document.createElement('tr');
    tbody.append(row);
    [...child.children].forEach((col) => {
      const cell = buildCell(col);
      applyStyles(cell, col);
      cell.innerHTML = col.innerHTML;

      // th要素の場合、h6をpタグに変換
      if (cell.tagName === 'TH') {
        convertH6ToP(cell);
      }

      row.append(cell);
    });
  });
  block.innerHTML = '';
  block.append(table);
}
