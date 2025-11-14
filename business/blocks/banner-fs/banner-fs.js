export default function decorate(block) {
  // banner-fs-wrapを作成
  const bannerWrap = document.createElement('div');
  bannerWrap.className = 'banner-fs-wrap';

  // 元のコンテンツを取得
  const originalContent = block.querySelector('div > div');
  if (!originalContent) return;

  // pictureを含むpタグを移動
  const pictureParagraph = originalContent.querySelector('p:has(picture)');
  if (pictureParagraph) {
    bannerWrap.appendChild(pictureParagraph);
  }

  // テキスト用のdivを作成
  const textDiv = document.createElement('div');
  textDiv.className = 'banner-fs-text';

  // 残りのpタグを移動
  const remainingParagraphs = originalContent.querySelectorAll('p:not(:has(picture))');
  remainingParagraphs.forEach((p) => {
    textDiv.appendChild(p);
  });

  // テキストdivをwrapに追加
  bannerWrap.appendChild(textDiv);

  // 元のコンテンツを空にして新しい構造を追加
  block.textContent = '';
  block.appendChild(bannerWrap);
}
