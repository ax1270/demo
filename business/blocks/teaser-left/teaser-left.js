export default function decorate(block) {
  // bg-クラスから背景色を設定する
  const setBgColor = (element) => {
    const classes = element.className.split(' ');
    const bgClass = classes.find((className) => className.startsWith('bg-'));

    if (bgClass) {
      const colorCode = bgClass.replace('bg-', '');
      element.style.backgroundColor = `#${colorCode}`;
    }
  };

  // teaser-leftの直下のdivにteaser-left-innerクラスを追加
  const innerDiv = document.createElement('div');
  innerDiv.className = 'teaser-left-inner';

  // 元の内容をinnerDivに移動
  while (block.firstChild) {
    const child = block.firstChild;
    if (child.tagName === 'DIV') {
      child.className = 'teaser-left-body';

      // teaser-left-body内の子要素にクラスを追加
      const bodyChildren = [...child.children];
      if (bodyChildren.length >= 1) bodyChildren[0].className = 'teaser-left-text';
      if (bodyChildren.length >= 2) bodyChildren[1].className = 'teaser-left-img';
    }
    innerDiv.appendChild(child);
  }

  block.appendChild(innerDiv);

  // teaser-left-textクラスの直下のpタグにpretitleクラスを追加
  const teaserLeftText = innerDiv.querySelector('.teaser-left-text');
  if (teaserLeftText) {
    const firstParagraph = teaserLeftText.querySelector(':scope > p:first-child');
    if (firstParagraph) {
      firstParagraph.classList.add('pretitle');
    }

    // h1タグがあるか確認し、その直後のpタグにtextクラスを追加
    const h1Tag = teaserLeftText.querySelector(':scope > h1');
    if (h1Tag) {
      const nextParagraph = h1Tag.nextElementSibling;
      if (nextParagraph && nextParagraph.tagName === 'P') {
        nextParagraph.classList.add('txt');
      }
    }
  }

  // ボタンコンテナの処理
  const buttonLinks = innerDiv.querySelectorAll('.button-container');
  // ボタンコンテナが存在する場合、それらをbuttons-wrapperで囲む
  if (buttonLinks.length > 0) {
    // 最初のボタンコンテナの親要素を取得
    const { parentElement } = buttonLinks[0];
    // buttons-wrapperを作成
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'buttons-wrapper';
    // 最初のボタンコンテナの位置を特定
    const firstButtonIndex = Array.from(parentElement.children).indexOf(buttonLinks[0]);
    // すべてのボタンコンテナを取得して配列に変換
    const buttonContainers = Array.from(buttonLinks);
    // ボタンコンテナをbuttons-wrapperに移動
    buttonContainers.forEach((container) => {
      buttonsWrapper.appendChild(container);
    });
    // 元の位置にbuttons-wrapperを挿入
    parentElement.insertBefore(buttonsWrapper, parentElement.children[firstButtonIndex]);
  }

  setBgColor(block);
}
