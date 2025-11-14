/**
 * セクション紹介ブロックをデコレートする関数
 * @param {HTMLElement} block - セクション紹介ブロック要素
 */
export default function decorate(block) {
  // 直接の子div要素を取得
  const childDivs = Array.from(block.children).filter((child) => child.tagName === 'DIV');

  if (childDivs.length >= 2) {
    // 1番目のdiv（メッセージ部分）にクラスを追加
    childDivs[0].classList.add('section-introduction-message');

    if (childDivs.length === 2) {
      // 2番目のdiv（名前部分）にクラスを追加
      childDivs[1].classList.add('section-introduction-name');
    } else if (childDivs.length >= 3) {
      // 2番目のdiv（画像部分）にクラスを追加
      childDivs[1].classList.add('section-introduction-img');

      // 3番目のdiv（名前部分）にクラスを追加
      childDivs[2].classList.add('section-introduction-name');
    }
  }
}
