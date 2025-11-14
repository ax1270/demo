export default function decorate(block) {
  try {
    // divをsection要素に変換
    const sectionElement = document.createElement('section');

    // 元のdivの属性とクラスをコピー
    Array.from(block.attributes).forEach((attr) => {
      sectionElement.setAttribute(attr.name, attr.value);
    });

    // 元のdivの子要素をすべてsectionに移動
    while (block.firstChild) {
      sectionElement.appendChild(block.firstChild);
    }

    // 元のdivをsectionに置き換え
    block.parentNode.replaceChild(sectionElement, block);

    // すべての直接の子div要素を取得
    const childDivs = Array.from(sectionElement.children).filter((child) => child.tagName === 'DIV');

    if (childDivs.length === 0) {
      return;
    }

    // 最初のdiv（見出し部分）を処理
    const titleDiv = childDivs[0];
    const headingElement = titleDiv.querySelector('h2, h3, h4, h5');
    const pElement = titleDiv.querySelector('p');

    if (headingElement) {
      // 見出し部分にlists-profile-titleクラスを追加
      titleDiv.classList.add('lists-profile-title');
    } else if (pElement) {
      // pタグがある場合はh3タグに変換
      const h3Element = document.createElement('h3');
      h3Element.innerHTML = pElement.innerHTML;

      // pタグをh3タグに置き換え
      pElement.parentNode.replaceChild(h3Element, pElement);

      // 見出し部分にlists-profile-titleクラスを追加
      titleDiv.classList.add('lists-profile-title');
    }

    // プロフィール項目部分を処理（見出し以外のdiv）
    const profileDivs = childDivs.slice(1);

    if (profileDivs.length > 0) {
      // ul要素を作成
      const ulElement = document.createElement('ul');
      ulElement.classList.add('lists-profile-items-wrap');

      // 項目数に応じてクラス名を追加
      const itemCount = profileDivs.length;
      ulElement.classList.add(`items-${itemCount}`);

      // 各プロフィール項目をli要素に変換
      profileDivs.forEach((profileDiv) => {
        const liElement = document.createElement('li');
        liElement.classList.add('lists-profile-items');

        // プロフィールdivの内容をli要素に移動
        while (profileDiv.firstChild) {
          liElement.appendChild(profileDiv.firstChild);
        }

        ulElement.appendChild(liElement);

        // 元のdiv要素を削除
        profileDiv.remove();
      });

      // ul要素をsectionに追加
      sectionElement.appendChild(ulElement);
    }
  } catch (error) {
    console.error('Lists profile decoration failed:', error, block);
  }
}
