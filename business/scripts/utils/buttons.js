/**
 * ボタン装飾に関するユーティリティ関数
 */

/**
 * Tertiaryボタンの装飾処理
 * p > strong > em > a または p > em > strong > a の構造のリンクをtertiaryボタンとして装飾する
 * @param {HTMLElement} element - 親要素
 */
export function decorateTertiaryButtons(element) {
  // 両パターンのセレクタで要素を取得してマージ
  const pattern1 = element.querySelectorAll('p > strong > em > a');
  const pattern2 = element.querySelectorAll('p > em > strong > a');

  [...pattern1, ...pattern2].forEach((a) => {
    const immediate = a.parentElement;
    const middle = immediate.parentElement;
    const p = middle.parentElement;

    // 親要素の構造を確認
    const isValidStructure = (
      // immediateがSTRONGまたはEM
      (immediate.tagName === 'STRONG' || immediate.tagName === 'EM')
      // middleがEMまたはSTRONG（immediateと異なる）
      && (middle.tagName === 'EM' || middle.tagName === 'STRONG')
      && immediate.tagName !== middle.tagName
      // pがP
      && p.tagName === 'P'
      // 各要素が単一の子要素のみを持つ
      && immediate.childNodes.length === 1
      && middle.childNodes.length === 1
      && p.childNodes.length === 1
    );

    if (isValidStructure) {
      a.className = 'button tertiary';
      p.classList.add('button-container');
    }
  });
}

/**
 * 取り消し線＋斜体＞リンクをprimaryボタンとして装飾
 * p > del > em > a または p > em > del > a の構造のリンクをprimaryボタンとして装飾する
 * @param {HTMLElement} element - 親要素
 */
export function decorateDelEmButtons(element) {
  // 両パターンのセレクタで要素を取得してマージ
  const pattern1 = element.querySelectorAll('p > del > em > a');
  const pattern2 = element.querySelectorAll('p > em > del > a');

  [...pattern1, ...pattern2].forEach((a) => {
    const immediate = a.parentElement;
    const middle = immediate.parentElement;
    const p = middle.parentElement;

    // 親要素の構造を確認
    const isValidStructure = (
      // immediateがDELまたはEM
      (immediate.tagName === 'DEL' || immediate.tagName === 'EM')
      // middleがEMまたはDEL（immediateと異なる）
      && (middle.tagName === 'EM' || middle.tagName === 'DEL')
      && immediate.tagName !== middle.tagName
      // pがP
      && p.tagName === 'P'
      // 各要素が単一の子要素のみを持つ
      && immediate.childNodes.length === 1
      && middle.childNodes.length === 1
      && p.childNodes.length === 1
    );

    if (isValidStructure) {
      // delとemタグを削除してaタグを直接pタグの子にする
      p.insertBefore(a, middle);
      middle.remove();
      a.className = 'button primary';
      p.classList.add('button-container');
    }
  });
}

/**
 * 共通のボタン装飾関数
 * ブロック内とブロック外の両方で使用される。
 * 二重処理を防ぐため、既に装飾済みのボタンはスキップする。
 * 
 * 実行タイミング:
 * 1. 各ブロック内で実行（ブロック固有の処理前に必要）
 * 2. decorateMain内でdecorateBlocks後に実行（ブロック外のボタンを装飾）
 * 
 * @param {HTMLElement} element - 親要素
 */
export function decorateButtonsForBlocks(element) {
  // 基本ボタンの装飾処理
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector('img')) {
        // 既にbuttonクラスが付いている場合はスキップ（二重処理防止）
        if (a.classList.contains('button')) {
          return;
        }

        if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          a.className = 'button'; // default
          up.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'STRONG'
          && twoup.childNodes.length === 1
          && (twoup.tagName === 'P' || twoup.tagName === 'DIV')
        ) {
          a.className = 'text-link button';
          // strongタグを削除してaタグを直接pタグの子にする
          twoup.insertBefore(a, up);
          up.remove();
          twoup.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'EM'
          && twoup.childNodes.length === 1
          && (twoup.tagName === 'P' || twoup.tagName === 'DIV')
        ) {
          a.className = 'button secondary';
          twoup.classList.add('button-container');
        }
      }
    }
  });

  // 取り消し線＋斜体＞リンクをprimaryボタンとして装飾
  decorateDelEmButtons(element);

  // Tertiaryボタンの処理を委譲
  decorateTertiaryButtons(element);
}
