export default function decorate(block) {
  // 最外側のdivにcontact-banner-wrapクラスを追加
  const wrapper = block.querySelector('div');
  if (wrapper) {
    wrapper.classList.add('contact-banner-wrap');
  }

  // 子要素を取得（最外側のdivの子要素）
  const children = [...wrapper.children];

  // 1つ目の子divにcontact-banner-contentクラスを追加
  if (children.length >= 1) {
    children[0].classList.add('contact-banner-content');
  }

  // 2つ目の子divにcontact-banner-buttonクラスを追加
  if (children.length >= 2) {
    children[1].classList.add('contact-banner-button');
    
    // ボタンに secondary クラスを追加
    const button = children[1].querySelector('a.button');
    if (button) {
      button.className = 'button secondary';
    }
  }
}
