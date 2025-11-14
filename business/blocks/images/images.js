export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    // 行内から画像を含むdivとリンクを探す
    let imageDiv = null;
    let linkHref = null;

    [...row.children].forEach((div) => {
      const img = div.querySelector('img');
      if (img) {
        imageDiv = div;

        // 画像を直接囲むリンクを探す
        const imageLink = img.closest('a');
        if (imageLink) {
          linkHref = imageLink.href;
          // リンクを解除して画像を取り出す
          const parent = imageLink.parentElement;
          parent.insertBefore(img, imageLink);
          imageLink.remove();
        }
      } else {
        // 画像がない場合、リンクだけがあるかチェック
        const link = div.querySelector('a');
        if (link && link.href) {
          linkHref = link.href;
        }
      }
    });

    // 画像がない行はスキップ
    if (!imageDiv) return;

    const img = imageDiv.querySelector('img');
    const li = document.createElement('li');
    // リンクがあればaタグ、なければdivで囲む
    const wrapper = document.createElement(linkHref ? 'a' : 'div');

    if (linkHref) {
      wrapper.href = linkHref;
      wrapper.classList.add('-link');
    }

    wrapper.append(imageDiv);
    li.append(wrapper);
    ul.append(li);

    // 画像の元サイズを取得してCSS変数として設定
    if (img.width) {
      li.style.setProperty('--image-width', `${img.width}px`);
    }

    // pタグにpictureが含まれていない場合、captionクラスを付与
    const paragraphs = imageDiv.querySelectorAll('p');
    paragraphs.forEach((p) => {
      if (!p.querySelector('picture')) {
        p.classList.add('caption');
      }
    });

    // リスト要素（ul/ol）にcaptionクラスを付与
    const lists = imageDiv.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      list.classList.add('caption');
    });
  });

  block.textContent = '';
  block.append(ul);
}
