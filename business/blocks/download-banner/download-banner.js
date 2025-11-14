/**
 * ダウンロードバナーをデコレートする関数
 * @param {HTMLElement} block - ダウンロードバナーブロック要素
 */
export default function decorate(block) {
  // 元のコンテンツを取得（より安全なセレクタを使用）
  const downloadBannerBlock = block.querySelector('div') || block;
  if (!downloadBannerBlock) return;

  // リンク要素を取得
  const linkElement = downloadBannerBlock.querySelector('p a') || downloadBannerBlock.querySelector('a');
  if (!linkElement) return;

  // 新しい構造のための要素を作成
  const anchor = document.createElement('a');
  anchor.href = linkElement.href;
  anchor.title = linkElement.title;

  const downloadBannerImg = document.createElement('div');
  downloadBannerImg.className = 'download-banner-img';

  const picture = downloadBannerBlock.querySelector('picture');
  if (picture) {
    downloadBannerImg.appendChild(picture.cloneNode(true));
  }

  const downloadBannerText = document.createElement('div');
  downloadBannerText.className = 'download-banner-text';

  // すべてのdiv要素を取得して、テキストコンテンツを探す
  const allDivs = downloadBannerBlock.querySelectorAll('div');

  // 最後のdivからテキストコンテンツを取得
  if (allDivs.length > 0) {
    const textDiv = allDivs[allDivs.length - 1];

    // p, ul, ol, h1-h6などのテキストコンテンツ要素を取得
    const textElements = textDiv.querySelectorAll('p, ul, ol, h1, h2, h3, h4, h5, h6');

    // リンクを含まない要素を優先的に取得
    const filteredElements = Array.from(textElements).filter((element) => !element.querySelector('a'));

    // リンクを含まない要素がある場合はそれらを使用、ない場合はすべての要素を使用
    const elementsToAdd = filteredElements.length > 0 ? filteredElements : Array.from(textElements);

    // すべての対象要素をdownload-banner-textに追加
    elementsToAdd.forEach((element) => {
      downloadBannerText.appendChild(element.cloneNode(true));
    });
  }

  // 新しい構造を組み立て
  anchor.appendChild(downloadBannerImg);
  anchor.appendChild(downloadBannerText);

  // 元のコンテンツを空にして新しい構造を追加
  downloadBannerBlock.textContent = '';
  downloadBannerBlock.appendChild(anchor);
}
