/* eslint-disable no-console */
/* global WebImporter */

// ============================================================================
// 設定・定数
// ============================================================================
const CONFIG = {
  EDS_URL: 'https://main--softbank-biz--example.aem.page',
  DYNAMIC_BLOCK_SELECTORS: [
    'script[src]',
    '.cmp-freehtml',
    '.freehtml',
    '.widget',
    '.cmp-form',
  ],
  // 余計なUI/装飾を削除（CSSは持ち込まない前提）
  STRIP_UI_SELECTORS: [
    'header',
    'nav',
    'footer',
    'noscript',
    '.cmp-experiencefragment--header',
    '.cmp-experiencefragment--footer',
    '.breadcrumb',
    '.social-share',
    '.cookie-banner',
    '.consent-banner',
  ],
  // canonical は params を優先（edsURL をフォールバック）
};
/**
 * 内部リンクを EDS のリンク形式に変換
 * - ルート相対パス:  /foo/bar     → https://<EDS>/foo/bar
 * - 同一オリジン:    https://source.example.com/abc → https://<EDS>/abc
 * - ページ内アンカー: #section-1 → https://<EDS><元ページのパス>#section-1
 */
function updateInternalLinks(document, params) {
  const ogUrl = new URL(params.originalURL);
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;

    // 例外: mailto, tel, javascript:
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

    // ルート相対
    if (href.startsWith('/')) {
      a.href = `${params.edsURL}${href}`;
      return;
    }
    // アンカー
    if (href.startsWith('#')) {
      a.href = `${params.edsURL}${ogUrl.pathname}${href}`;
      return;
    }
    // 絶対URL → 同一オリジンなら EDS に置換
    try {
      const u = new URL(href);
      if (u.origin === ogUrl.origin) {
        a.href = `${params.edsURL}${u.pathname}${u.search}${u.hash}`;
      }
    } catch (e) {
      // 相対だが / で始まらない等は無視（そのまま）
      console.log(`skip non-standard URL: ${href}`);
    }
  });
}

/**
 * 現行サイトの <table> を EDS の Tableブロックへ変換
 * - 先頭に「Table」ラベル行だけ追加
 * - 既存セル構造（TH/TD・colspan/rowspan・UL/OL・SUP・A…）は完全温存
 * - text-align / vertical-align は style と data-* に反映（子要素の指定も拾う）
 * - 1行目が「全てTHかつcol/rowspanなし」の場合だけ“カラム見出し行”とみなし整列を既定
 */
function noHeaderTable(table) {
  // tbody 優先で判定、無ければ直下の tr を対象
  const bodyRows = table.querySelectorAll('tbody tr');
  const rows = bodyRows.length ? Array.from(bodyRows) : Array.from(table.querySelectorAll(':scope > tr'));
  if (rows.length === 0) return true;

  // 先頭から最大5行をサンプルに、
  // 「先頭セル + 以降はすべてTD」の行が半数以上なら縦見出しと判定
  const sample = rows.slice(0, 5);
  let score = 0;
  sample.forEach((tr) => {
    const cells = Array.from(tr.children);
    if (cells.length < 2) return;
    const restAllTd = cells.slice(1).every((c) => c.tagName === 'TD');
    if (restAllTd) score += 1;
  });
  return score >= Math.ceil(sample.length / 2);
}

// 行見出し（縦見出し）を td+h6 へ変換
function applyRowHeaderTransform(targetTable) {
  if (!noHeaderTable(targetTable)) return;
  const rows = Array.from(targetTable.querySelectorAll('tr'));
  const makeId = (t) => (t || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\u3000]/g, '-')
    .toLowerCase();

  rows.forEach((tr) => {
    if (tr.closest('thead')) return;
    const cells = Array.from(tr.children);
    if (cells.length === 0) return;

    const originalTags = cells.map((c) => c.tagName);
    const ths = cells.filter((c) => c.tagName === 'TH');
    const headerSource = ths.length ? ths[ths.length - 1] : cells[0];

    const convertToTd = (el) => {
      if (el.tagName !== 'TH') return el;
      const td = document.createElement('td');
      td.innerHTML = el.innerHTML;
      Array.from(el.attributes).forEach((attr) => td.setAttribute(attr.name, attr.value));
      el.replaceWith(td);
      return td;
    };

    let headerTd = headerSource;
    cells.forEach((c) => {
      const wasTh = c.tagName === 'TH';
      const td = convertToTd(c);
      if (c === headerSource) headerTd = td;
      if (wasTh && !td.querySelector('h6')) {
        const originalHTML = td.innerHTML.trim();
        const textOnly = td.textContent.trim();
        if (textOnly) {
          const h6 = document.createElement('h6');
          h6.innerHTML = originalHTML;
          h6.id = makeId(textOnly);
          td.innerHTML = '';
          td.appendChild(h6);
        }
      }
    });

    if (!headerTd.querySelector('h6') && originalTags.includes('TH')) {
      const originalHTML = headerTd.innerHTML.trim();
      const textOnly = headerTd.textContent.trim();
      if (textOnly) {
        const h6 = document.createElement('h6');
        h6.innerHTML = originalHTML;
        h6.id = makeId(textOnly);
        headerTd.innerHTML = '';
        headerTd.appendChild(h6);
      }
    }
  });
}

// tbody に残る th を td+h6 へ正規化
function normalizeBodyThToTd(targetTable) {
  const bodyRows = targetTable.querySelectorAll('tbody tr');
  const rows = bodyRows.length ? Array.from(bodyRows) : Array.from(targetTable.querySelectorAll(':scope > tr'));
  rows.forEach((tr) => {
    if (tr.closest('thead')) return;
    Array.from(tr.querySelectorAll('th')).forEach((th) => {
      const td = document.createElement('td');
      Array.from(th.attributes).forEach((attr) => td.setAttribute(attr.name, attr.value));
      if (!th.querySelector('h6')) {
        const h6 = document.createElement('h6');
        h6.innerHTML = th.innerHTML;
        const textOnly = th.textContent.trim();
        if (textOnly) h6.id = textOnly.toLowerCase().replace(/\s+/g, '-').replace(/[\u3000]/g, '-');
        td.appendChild(h6);
      } else {
        td.innerHTML = th.innerHTML;
      }
      th.replaceWith(td);
    });
  });
}

// caption の整列を取得（right/center/left のみ判定）
function getCaptionAlign(table) {
  const caption = table.querySelector('caption');
  if (!caption) return '';
  let align = '';
  if (caption.style && caption.style.textAlign) align = caption.style.textAlign;
  if (!align && caption.getAttribute('align')) align = caption.getAttribute('align');
  align = (align || '').toLowerCase().trim();
  return ['right', 'center', 'left'].includes(align) ? align : '';
}

// Section Metadata(Style: table-top-text-*) を対象テーブル直前に挿入（その前に <br> も挿入）
function insertSectionMetadataForCaption(table, document, align) {
  const cells = [['Section Metadata'], ['Style', `table-top-text-${align}`]];
  const metaTable = WebImporter.DOMUtils.createTable(cells, document);
  // Markdown/レンダラーで単独の <br> が落ちるケース対策として <p><br></p> を挟む
  const spacer = document.createElement('p');
  spacer.appendChild(document.createElement('br'));
  // テーブルの直後に <p><br></p> を置き、その直後に Section Metadata を置く
  table.insertAdjacentElement('afterend', spacer);
  spacer.insertAdjacentElement('afterend', metaTable);
}

// テーブル上に caption テキストを <p> として追加（整列も引き継ぐ）
function insertCaptionParagraphAbove(table, document) {
  const caption = table.querySelector('caption');
  if (!caption) return;
  const text = (caption.textContent || '').trim();
  if (!text) return;

  const prev = table.previousElementSibling;
  if (prev && prev.tagName === 'P' && (prev.textContent || '').trim() === text) return;

  const p = document.createElement('p');
  p.textContent = text;
  // 整列を引き継ぐ
  const align = (caption.style && caption.style.textAlign) || caption.getAttribute('align') || '';
  if (align) p.style.textAlign = align;
  table.insertAdjacentElement('beforebegin', p);
}

// 隣接する table と table の間に <p><br></p> を挿入（重複挿入防止あり）
function insertSpacerBetweenAdjacentTables(root, document) {
  const isSpacer = (el) => el && el.tagName === 'P' && el.querySelector('br');
  const tables = Array.from(root.querySelectorAll('table'));
  tables.forEach((tbl) => {
    const next = tbl.nextElementSibling;
    if (next && next.tagName === 'TABLE') {
      if (!isSpacer(next)) {
        const spacer = document.createElement('p');
        spacer.appendChild(document.createElement('br'));
        tbl.insertAdjacentElement('afterend', spacer);
      }
    }
  });
}

function convertTablesToBlock(document) {
  document.querySelectorAll('table').forEach((table) => {
    // caption のテキストを table の直前に <p> として複製
    insertCaptionParagraphAbove(table, document);
    // caption の整列に応じて Section Metadata を追加
    const captionAlign = getCaptionAlign(table);
    if (captionAlign) insertSectionMetadataForCaption(table, document, captionAlign);
    const firstTh = table.querySelector('tr:first-child th');
    if (firstTh && /^table/i.test(firstTh.textContent.trim())) return;

    const firstRow = table.querySelector('tr');
    if (!firstRow) return;

    // ラベル行の colspan 用に最大列数を算出
    const colCount = Array.from(table.querySelectorAll('tr')).reduce((max, tr) => {
      let sum = 0;
      tr.querySelectorAll('th,td').forEach((c) => {
        const span = parseInt(c.getAttribute('colspan') || '1', 10);
        sum += Number.isFinite(span) ? span : 1;
      });
      return Math.max(max, sum);
    }, 1);

    // no-header 判定
    const noHeader = noHeaderTable(table);

    // TODO: 親要素が `.cmp-text` の場合は gray03 として扱う想定。現行サイトのパターンが未確定のため暫定条件です。必要に応じて見直してください。
    const isCmpTextParent = !!table.closest('.cmp-text');
    const headerLabelText = isCmpTextParent ? 'Table (gray03)' : 'Table';

    // thead に「Table」行を追加（重複防止）: "Table" で始まる表題なら追加しない
    const hasTableHeader = !!(table.querySelector('thead th') && table.querySelector('thead th').textContent.trim().toLowerCase().startsWith('table'));
    if (!hasTableHeader) {
      let thead = table.querySelector('thead');
      if (!thead) {
        thead = document.createElement('thead');
        table.prepend(thead);
      }
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = headerLabelText;
      th.setAttribute('colspan', colCount);
      tr.append(th);
      thead.append(tr);
    }

    // セル結合（rowspan/colspan）を検知し、内側テーブルに包む
    const hasMergedCells = !!table.querySelector('tbody th[rowspan], tbody td[rowspan], tbody th[colspan], tbody td[colspan], :scope > th[rowspan], :scope > td[rowspan], :scope > th[colspan], :scope > td[colspan]');
    if (hasMergedCells) {
      // 既存の（thead以外の）行を innerTable に移動
      const innerTable = document.createElement('table');
      const innerTbody = document.createElement('tbody');

      const moveRows = [];
      // tbody がある場合は tbody 配下の tr、無ければ直下の tr
      const bodyRows = table.querySelectorAll('tbody > tr');
      if (bodyRows.length) {
        bodyRows.forEach((tr) => moveRows.push(tr));
      } else {
        table.querySelectorAll(':scope > tr').forEach((tr) => moveRows.push(tr));
      }
      moveRows.forEach((tr) => innerTbody.appendChild(tr));
      innerTable.appendChild(innerTbody);

      // 外側 tbody を用意し、1セルの行に内側テーブルを挿入
      let outerTbody = table.querySelector('tbody');
      if (!outerTbody) {
        outerTbody = document.createElement('tbody');
        table.appendChild(outerTbody);
      }
      const hostTr = document.createElement('tr');
      const hostTd = document.createElement('td');
      hostTd.setAttribute('colspan', colCount);
      hostTd.appendChild(innerTable);
      hostTr.appendChild(hostTd);
      outerTbody.appendChild(hostTr);

      // 内側テーブルにも行見出し変換を適用
      applyRowHeaderTransform(innerTable);
      normalizeBodyThToTd(innerTable);
    }

    // 行見出し変換 + tbodyの th を td+h6 へ正規化
    applyRowHeaderTransform(table);
    normalizeBodyThToTd(table);
    const makeId = (t) => (t || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[\u3000]/g, '-')
      .toLowerCase();

    if (noHeader) {
      const bodyRows = table.querySelectorAll('tbody tr');
      const rows = bodyRows.length ? Array.from(bodyRows) : Array.from(table.querySelectorAll(':scope > tr'));
      rows.forEach((tr) => {
        // thead 内はスキップ（Table 見出しには h6 を入れない）
        if (tr.closest('thead')) return;

        const cells = Array.from(tr.children);
        if (cells.length === 0) return;

        const originalTags = cells.map((c) => c.tagName);
        const ths = cells.filter((c) => c.tagName === 'TH');
        // 行内に TH がある場合は一番右の TH を行見出しとみなす（rowspan横並び対応: 通信速度/下り 等）
        const headerSource = ths.length ? ths[ths.length - 1] : cells[0];

        // まず、行内の全ての TH を TD に変換（属性維持）
        const convertToTd = (el) => {
          if (el.tagName !== 'TH') return el;
          const td = document.createElement('td');
          td.innerHTML = el.innerHTML;
          Array.from(el.attributes).forEach((attr) => td.setAttribute(attr.name, attr.value));
          el.replaceWith(td);
          return td;
        };

        // 変換実行しつつ headerSource の参照を TD に更新
        let headerTd = headerSource;
        cells.forEach((c) => {
          const wasTh = c.tagName === 'TH';
          const td = convertToTd(c);
          if (c === headerSource) headerTd = td;
          // 元々 TH だったセルは行見出し扱いとして必ず h6 を入れる
          if (wasTh && !td.querySelector('h6')) {
            const originalHTML = td.innerHTML.trim();
            const textOnly = td.textContent.trim();
            if (textOnly) {
              const h6 = document.createElement('h6');
              h6.innerHTML = originalHTML;
              h6.id = makeId(textOnly);
              td.innerHTML = '';
              td.appendChild(h6);
            }
          }
        });

        // 既に h6 が入っていなければ（安全網） headerTd にも挿入
        // ただし、この行に元々THが1つも無い場合（例: 前行のrowspanの続き）は挿入しない
        if (!headerTd.querySelector('h6') && originalTags.includes('TH')) {
          const originalHTML = headerTd.innerHTML.trim();
          const textOnly = headerTd.textContent.trim();
          if (textOnly) {
            const h6 = document.createElement('h6');
            h6.innerHTML = originalHTML; // sup 等の子要素を保持
            h6.id = makeId(textOnly);
            headerTd.innerHTML = '';
            headerTd.appendChild(h6);
          }
        }
      });
    }

    // ---- helpers ----
    const pickAligns = (cell) => {
      // セル自身の align/valign or style
      let h = (cell.style && cell.style.textAlign) || cell.getAttribute('align') || '';
      let v = (cell.style && cell.style.verticalAlign) || cell.getAttribute('valign') || '';

      // 子孫の style からも拾う（p/ul/div/li 等）
      if (!h) {
        const n = cell.querySelector('[style*="text-align"]');
        if (n) h = (n.style && n.style.textAlign) || '';
      }
      if (!v) {
        const n = cell.querySelector('[style*="vertical-align"]');
        if (n) v = (n.style && n.style.verticalAlign) || '';
      }
      return { hAlign: (h || '').toLowerCase().trim(), vAlign: (v || '').toLowerCase().trim() };
    };

    const applyAlign = (cell, align, valign) => {
      if (align) {
        cell.style.textAlign = align;
        cell.setAttribute('data-align', align);
        cell.removeAttribute('align');
      }
      if (valign) {
        cell.style.verticalAlign = valign;
        cell.setAttribute('data-valign', valign);
        cell.removeAttribute('valign');
      }
    };

    // すべてのセルに align/valign を反映（構造は一切変更しない）
    Array.from(table.querySelectorAll('tr')).forEach((tr) => {
      Array.from(tr.querySelectorAll('th,td')).forEach((cell) => {
        const { hAlign, vAlign } = pickAligns(cell);
        // 既定整列：見出し行は center/middle、それ以外は left/middle
        const fallbackH = 'left';
        const fallbackV = 'middle';
        applyAlign(cell, (hAlign || fallbackH), (vAlign || fallbackV));
      });
    });

    // 表の配色クラスを付与
    table.classList.add('table', isCmpTextParent ? 'gray03' : 'gray02');
  });
}

/**
 * 動的ブロック（取り込めない/SPA依存など）を Placeholder ブロックに変換
 * - script[src], cmp-freehtml, freehtml, widget, cmp-form
 * - ブロック名は仮名文字列を埋め込み（後日確定予定）
 * - 中身は空でOKという要件に合わせ、2行目は空セルにしています
 */
function convertDynamicToPlaceholder(document) {
  // TODO: 以下は動的ブロックの候補 サンプルとして置いてますので候補は変更必要
  const candidates = document.querySelectorAll([
    'script[src]',
    '.cmp-freehtml',
    '.freehtml',
    '.widget',
    '.cmp-form',
  ].join(','));

  candidates.forEach((el) => {
    // 既にテーブルブロック配下ならスキップ
    if (el.closest('table')) return;

    // ブロック名の推定（仮）
    let guessed = 'dynamic-block';
    if (el.tagName === 'FORM') guessed = 'form';
    else if (el.tagName === 'SCRIPT') guessed = 'script';
    else if (el.tagName === 'IFRAME') guessed = 'iframe';
    else if (el.tagName === 'IMG') guessed = 'img';
    else if (el.tagName === 'VIDEO') guessed = 'video';
    else if (el.tagName === 'AUDIO') guessed = 'audio';
    else if (el.classList.contains('cmp-freehtml')) guessed = 'cmp-freehtml';
    else if (el.classList.contains('freehtml')) guessed = 'freehtml';
    else if (el.classList.contains('widget')) guessed = 'widget';
    else if (el.classList.contains('cmp-form')) guessed = 'cmp-form';

    const cells = [['placeholder'], [guessed || 'dynamic-block']];
    const tbl = WebImporter.DOMUtils.createTable(cells, document);
    el.replaceWith(tbl);
  });

  // 連続するテーブル間に改行スペーサーを追加
  insertSpacerBetweenAdjacentTables(document, document);
}

/**
 * メタデータ / OGP をメタデータブロックとして付与
 * - title / description / og:image / canonical など
 * - Hide in Navigation は空（必要に応じてサイト側で制御）
 */
function appendMetadataBlock(main, document, params) {
  const meta = WebImporter.Blocks.getMetadata(document);

  // title / description / og
  const get = (s) => document.querySelector(s)?.getAttribute('content') || '';
  const ogTitle = get('meta[property="og:title"]');
  const ogDesc = get('meta[property="og:description"]') || get('meta[name="description"]');
  const ogImage = get('meta[property="og:image"]');
  const canonicalRaw = document.querySelector('link[rel="canonical"]')?.href || '';

  if (ogTitle) meta.Title = ogTitle;
  if (ogDesc) meta.Description = ogDesc;

  // 画像は要件：そのまま → 画像URLを入れる（空でもOK）
  if (ogImage) {
    const img = document.createElement('img');
    img.src = ogImage;
    meta.Image = img;
  }

  // canonical: localhost/127.0.0.1 を避け、指定ベースドメインへ置換
  // 優先度: params.canonicalBase > params.edsURL
  const canonicalBase = (params && (params.canonicalBase || params.edsURL)) || '';
  let canonical = canonicalRaw;
  try {
    if (!canonicalRaw) {
      const pageUrl = new URL(document.baseURI || '');
      if (canonicalBase) canonical = `${canonicalBase}${pageUrl.pathname}`;
    } else {
      const u = new URL(canonicalRaw);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        if (canonicalBase) canonical = `${canonicalBase}${u.pathname}${u.search}${u.hash}`;
      }
    }
  } catch (e) {
    // baseURI や canonicalRaw が不正な場合は何もしない（空のまま）
  }

  if (canonical) meta.Canonical = canonical;

  meta['Hide in Navigation'] = '';

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  block.id = 'metadata';
  main.append(block);
}

/**
 * 余計なUI/装飾を削除（CSSは持ち込まない前提）
 */
function stripChrome(main) {
  WebImporter.DOMUtils.remove(main, CONFIG.STRIP_UI_SELECTORS);
}

export default {
  /**
   * Workbench / Bulk から渡される前処理
   */
  preprocess: ({ params }) => {
    // ★必要に応じてEDSの公開URLに変更してください
    params.edsURL = 'https://main--softbank-biz--example.aem.page';
    // canonical のベースドメイン（開発環境用）
    params.canonicalBase = 'https://main--softbank-eds-develop--aquaring.aem.page';
  },

  /**
   * メイン変換
   * 要件：
   *  - メタデータ・OGPの反映
   *  - テキスト/見出し/画像はそのまま
   *  - テーブルのみ Table ブロック化
   *  - ページ内リンクをEDSリンクへ
   *  - 動的ブロックは Placeholder へ
   */
  transform: ({ document, url, params }) => {
    const main = document.body;

    // サニタイズ
    stripChrome(main);
    updateInternalLinks(document, params);

    // 画像URL/背景画像等の正規化（標準ルール）
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.DOMUtils.removeSpans(document);

    // テーブルをTableブロックへ変換
    convertTablesToBlock(document);

    // 動的ブロックをPlaceholderブロックへ変換
    convertDynamicToPlaceholder(document);

    // メタデータブロックを付与
    appendMetadataBlock(main, document, params);

    // 軽い区切り（任意）: ネストされたテーブルの中には入れない
    main.querySelectorAll(':scope > table').forEach((t) => {
      if (t.id !== 'metadata') t.after(document.createElement('hr'));
    });

    // プレースホルダー判定関数
    function isPlaceholderTable(table) {
      const firstTh = table.querySelector('tr:first-child th');
      return firstTh && firstTh.textContent.trim().toLowerCase() === 'placeholder';
    }

    const report = {
      'Has Table': !!document.querySelector('.table'),
      'Placeholder Count': Array.from(document.querySelectorAll('table'))
        .filter(isPlaceholderTable).length,
    };

    // 出力パス（.html → なし、末尾スラッシュ除去）
    const path = new URL(url).pathname.replace(/\.html?$/, '').replace(/\/$/, '');

    return [{ element: main, path, report }];
  },
};
