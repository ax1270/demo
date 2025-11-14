export default function decorate(block) {
  const sidebarContainer = block.closest('.sidebar-container');

  if (sidebarContainer) {
    // sidebar-wrapperを一度に削除
    const sidebarBlocks = sidebarContainer.querySelectorAll('.sidebar-wrapper');
    sidebarBlocks.forEach((sidebarBlock) => {
      sidebarBlock.remove();
    });

    // button-containerの処理
    const buttonContainer = sidebarContainer.querySelector('.default-content-wrapper p.button-container');
    if (buttonContainer) {
      const newButtonDiv = document.createElement('div');
      newButtonDiv.className = 'sidebar-button';
      newButtonDiv.innerHTML = buttonContainer.innerHTML;

      buttonContainer.parentNode.replaceChild(newButtonDiv, buttonContainer);
      const buttonLink = newButtonDiv.querySelector('a');
      if (buttonLink) {
        buttonLink.setAttribute('target', '_blank');
        buttonLink.classList.remove('button'); // クラス名を削除
      }
    }
  }
}
