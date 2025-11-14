export default function decorate(block) {
  // index-teaser直下のdivを取得（メインコンテナ）
  const mainContainer = block.querySelector(':scope > div');

  if (!mainContainer) return;

  // メインコンテナにindex-teaser-innerクラスを追加
  mainContainer.className = 'index-teaser-inner';

  // メインコンテナ内の直下のdivを取得
  const childDivs = Array.from(mainContainer.children).filter((child) => child.tagName === 'DIV');

  // 1つ目のdiv：.index-teaser-img
  if (childDivs.length >= 1) {
    const pcImageDiv = childDivs[0];
    pcImageDiv.className = 'index-teaser-img';

    // PC画像をpc-onlyのdivで囲む
    const pcContent = pcImageDiv.innerHTML;
    const pcWrapper = document.createElement('div');
    pcWrapper.className = 'pc-only';
    pcWrapper.innerHTML = pcContent;
    pcImageDiv.innerHTML = '';
    pcImageDiv.appendChild(pcWrapper);

    // 2つ目のdivにSP画像がある場合、それをpc-onlyの後に追加
    if (childDivs.length >= 2) {
      const spImageDiv = childDivs[1];
      const spPicture = spImageDiv.querySelector('picture');
      if (spPicture) {
        // SP画像をsp-onlyのdivで囲んで、1つ目のdivに移動
        const spWrapper = document.createElement('div');
        spWrapper.className = 'sp-only';
        spWrapper.innerHTML = spImageDiv.innerHTML;
        pcImageDiv.appendChild(spWrapper);

        // 2つ目のdivを削除
        spImageDiv.remove();

        // childDivsの配列を更新
        childDivs.splice(1, 1);
      }
    }
  }

  // 2つ目のdiv：.index-teaser-content
  if (childDivs.length >= 2) {
    const titleDiv = childDivs[1];
    titleDiv.className = 'index-teaser-content';

    // プレタイトルにクラスを追加
    const firstParagraph = titleDiv.querySelector(':scope > p:first-child');
    if (firstParagraph) {
      firstParagraph.classList.add('pretitle');
    }

    // h1タグにtitleクラスを追加
    const h1Tag = titleDiv.querySelector(':scope > h1');
    if (h1Tag) {
      h1Tag.classList.add('title');
    }
  }
}
