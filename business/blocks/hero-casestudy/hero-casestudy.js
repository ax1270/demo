export default function decorate(domBlockRoot) {
  // 最初のdivにhero-casestudy-contentクラスを追加
  const firstDiv = domBlockRoot.querySelector(':scope > div:first-child');
  if (firstDiv) {
    firstDiv.classList.add('hero-casestudy-content');
  }

  // 画像のpタグにhero-casestudy-imgクラスを追加
  const imageParagraph = domBlockRoot.querySelector('p picture');
  if (imageParagraph && imageParagraph.parentElement) {
    imageParagraph.parentElement.classList.add('hero-casestudy-img');
  }

  // 日付のpタグにhero-casestudy-dateクラスを追加
  const paragraphs = domBlockRoot.querySelectorAll('p');
  paragraphs.forEach((p) => {
    // 画像を含まないpタグを探す
    if (!p.querySelector('picture') && !p.querySelector('a')) {
      p.classList.add('hero-casestudy-date');
    }
  });

  // h1タグにhero-casestudy-titleクラスを追加
  const h1Element = domBlockRoot.querySelector('h1');
  if (h1Element) {
    h1Element.classList.add('hero-casestudy-title');
  }
}
