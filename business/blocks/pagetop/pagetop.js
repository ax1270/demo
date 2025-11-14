export default function decorate(block) {
  // pagetop-containerを取得
  const pagetopContainer = block.closest('.pagetop-container');

  // pagetop-containerが存在する場合
  if (pagetopContainer) {
    // button-containerを取得
    const buttonContainer = pagetopContainer.querySelector('.button-container');

    // button-containerが存在する場合
    if (buttonContainer) {
      // 新しいdiv内のaタグのクラス名を削除
      const link = buttonContainer.querySelector('a');
      if (link) {
        link.classList.remove('button'); // クラス名を削除
      }
    }
  }
}
