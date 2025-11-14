export default function decorate(block) {
  // teaser-bottomクラス直下のdivにteaser-bottom-innerクラスを付与
  const innerDiv = block.querySelector(':scope > div');
  if (innerDiv) {
    innerDiv.classList.add('teaser-bottom-inner');

    // teaser-bottom-inner直下のdivにクラスを付与
    const childDivs = innerDiv.querySelectorAll(':scope > div');
    if (childDivs.length >= 2) {
      // contentWrapperを作成
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'teaser-bottom-content';

      // titleとtextをcontentWrapperに移動
      const titleDiv = childDivs[0];
      const textDiv = childDivs[1];
      titleDiv.classList.add('teaser-bottom-top');
      textDiv.classList.add('teaser-bottom-text');

      // 元の位置からtitleとtextを削除
      titleDiv.parentElement.removeChild(titleDiv);
      textDiv.parentElement.removeChild(textDiv);

      // contentWrapperにtitleとtextを追加
      contentWrapper.appendChild(titleDiv);
      contentWrapper.appendChild(textDiv);

      // contentWrapperをinnerDivの最初に挿入
      innerDiv.insertBefore(contentWrapper, innerDiv.firstChild);
    }
  }

  // strongタグを含むpタグにtagクラスを付与し、strongタグを削除
  const strongTags = block.querySelectorAll('strong');
  strongTags.forEach((strong) => {
    const parentP = strong.closest('p');
    const content = strong.textContent;
    parentP.textContent = content;
    parentP.classList.add('tag');
  });

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
}
