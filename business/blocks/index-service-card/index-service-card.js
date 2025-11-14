/**
 * Index Service Card Block
 * DOM操作でdiv構造をul/li構造に変換し、各カード全体をリンク化する
 */
export default function decorate(block) {
  // 新しいul要素を作成
  const ul = document.createElement('ul');
  ul.className = 'index-service-card-wrap';
  ul.setAttribute('data-block-name', 'index-service-card');
  ul.setAttribute('data-block-status', 'loaded');

  // 既存のdiv要素（各サービスカード）を取得
  const serviceCards = block.children;

  // 各サービスカードをli要素に変換
  Array.from(serviceCards).forEach((card) => {
    // li要素を作成
    const li = document.createElement('li');
    li.className = 'index-service-card-item';

    // 画像部分（最初のdiv）を取得
    const imageDiv = card.querySelector('div:first-child');
    if (imageDiv) {
      // 画像部分にクラスを追加
      const iconDiv = document.createElement('div');
      iconDiv.className = 'index-service-card-item-icon';
      iconDiv.appendChild(imageDiv.firstElementChild); // picture要素を移動

      // button-containerから既存のリンクを取得
      const buttonContainer = card.querySelector('.button-container');
      const existingLink = buttonContainer?.querySelector('a');

      if (existingLink) {
        // 新しいa要素を作成（既存のリンクの属性をコピー）
        const a = document.createElement('a');
        a.href = existingLink.href;
        a.title = existingLink.title;

        // テキスト部分をp要素で包む（HTMLタグも保持）
        const p = document.createElement('p');
        p.innerHTML = existingLink.innerHTML;

        // a要素に画像とテキストを追加
        a.appendChild(iconDiv);
        a.appendChild(p);

        // li要素にa要素を追加
        li.appendChild(a);
      }
    }

    // ul要素にli要素を追加
    ul.appendChild(li);
  });

  // 既存のblock要素の内容をクリアして新しいul要素を追加
  block.innerHTML = '';
  block.appendChild(ul);
}
