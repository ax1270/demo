export default async function decorate() {
  // ブログページ一覧とタグ一覧の取得
  const orign = location.origin;
  const queryIndexRes = await fetch(`${orign}/query-index.json`);
  const tagListRes = await fetch(`${orign}/tag-list.json`);
  const queryIndex = await queryIndexRes.json();
  const tagList = await tagListRes.json();
  let queryIndexData = queryIndex.data;
  const tagListData = tagList.data;

  // タグと表示形式の取得
  let tags; let
    display;
  document.querySelectorAll('.blog-cards p').forEach((p, i) => {
    if (i === 1) tags = p.textContent.split(',');
    if (i === 3) display = p.textContent;
  });

  // ブログ記事以外のデータは削除
  queryIndexData = queryIndexData.filter((item) => item.path.indexOf('/blog/business/articles/') > -1);
  // 各記事のタグ部分を配列に変換
  queryIndexData.forEach((page) => {
    page.tags = JSON.parse(page.tags);
    if (page.tags.length) page.tags = page.tags[0]?.split(', ');
  });

  // タグの辞書を作成
  const tagTypeMap = new Map();
  tags.forEach((tag) => {
    const type = tagListData.find((data) => data.tag === tag)?.type;
    if (type) tagTypeMap.has(type) ? tagTypeMap.get(type).push(tag) : tagTypeMap.set(type, [tag]);
  });
  // blockに設定されているタグが含まれているページのデータのみ抽出
  let result;
  if (queryIndexData.length) {
    result = [...queryIndexData];
    tagTypeMap.forEach((tagValArray) => result = result.filter((page) => getIsDuplicate(page.tags, tagValArray)));

    function getIsDuplicate(arr1, arr2) {
      return [...arr1, ...arr2].filter((item) => arr1.includes(item) && arr2.includes(item)).length > 0;
    }
  } else {
    result = [];
  }

  const blogCardhtmlText = `
    <div class="blog-cards borderradius block" data-block-name="cards" data-block-status="loaded">
     <ul class="cards_list">
      <li class="cards_item">
       <a href="" target="_blank">
         <div class="cards-card-image">
          <picture>
           <source type="image/webp" srcset="/blog/business/articles/202503/media_16f2839c04e7e2ee1a7677238716aa7fbd963a4cf.jpeg?width=750&amp;format=webply&amp;optimize=medium">
           <img loading="eager" alt="" src="/blog/business/articles/202503/media_16f2839c04e7e2ee1a7677238716aa7fbd963a4cf.jpeg?width=750&amp;format=png&amp;optimize=medium">
          </picture>
         </div>
         <div class="cards-card-body">
          <p></p>
          <h3></h3>
          <ul></ul>
         </div>
        </a>
       </li>
      </ul>
    </div>`;

  const blogCardsWrapper = document.querySelector('.blog-cards-wrapper');
  blogCardsWrapper.innerHTML = blogCardhtmlText;
  result.forEach((page, i) => {
    // ページ情報の取得
    const pageNavigationTitle = page['navigation-title'];
    const pageImage = page.image;
    const pagePath = page.path;
    const pageTags = page.tags;
    const pageLastModified = Number(page.lastModified);

    // 要素の取得もしくは複製
    const item = i === 0 ? blogCardsWrapper.querySelector('.cards_item') : blogCardsWrapper.querySelector('.cards_item').cloneNode(true);

    // pathの書き換え
    item.querySelector('a').href = pagePath;

    // 画像pathの書き換え
    const source = item.querySelector('picture > source');
    let sourcePath = source.srcset;
    sourcePath = sourcePath.replace(sourcePath.split('?')[0], pageImage.split('?')[0]);
    source.srcset = sourcePath;
    const img = item.querySelector('img');
    let imgSrc = img.src;
    imgSrc = imgSrc.replace(imgSrc.split('?')[0], pageImage.split('?')[0]);
    item.querySelector('img').src = imgSrc;

    // テキスト部分の取得
    const cardBody = item.querySelector('.cards-card-body');

    // 日付の書き換え
    const p = cardBody.querySelector('p');
    const date = new Date(pageLastModified * 1000);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    p.textContent = `${year}/${month}/${day}`;

    // タイトルの書き換え
    const h3 = cardBody.querySelector('h3');
    h3.id = '';
    h3.textContent = pageNavigationTitle;

    // タグの書き換え
    const articleTags = cardBody.querySelector('ul');
    articleTags.innerHTML = '';
    for (let i = 0; i < pageTags.length; i++) {
      if (i === 3) break;
      const li = document.createElement('li');
      li.textContent = pageTags[i];
      articleTags.appendChild(li);
    }

    if (i > 0) blogCardsWrapper.querySelector('.cards_list').appendChild(item);
  });

  let loadMoreButtonContainer;
  const cardsItems = blogCardsWrapper.querySelectorAll('.cards_item');
  if (display === 'all') {
    // 全て表示する場合
    Array.from(cardsItems).forEach((child, i) => {
      if (i > 8) child.style.display = 'none';
    });
    const hiddenItems = Array.from(cardsItems).filter((child) => child.style.display === 'none');

    // 隠れているカードがある場合はもっと見るボタンを表示する
    if (hiddenItems.length) {
      loadMoreButtonContainer = document.createElement('div');
      loadMoreButtonContainer.classList.add('load-more-container');
      loadMoreButtonContainer.innerHTML = '<button class="load-more-button" style="display: flex;">もっと見る</button>';
      loadMoreButtonContainer.querySelector('button').addEventListener('click', (e) => {
        const hiddenItems = Array.from(cardsItems).filter((child) => child.style.display === 'none');
        hiddenItems.forEach((item, i) => {
          if (i < 9) {
            item.style.display = 'block';
            hiddenItems.splice(i, 1);
          }
        });
        if (hiddenItems.length === 0) e.target.remove();
      });
    }
  } else {
    // 一部のみ表示する場合
    Array.from(cardsItems).forEach((child, i) => {
      if (i > 2) child.style.display = 'none';
    });
  }
  loadMoreButtonContainer && blogCardsWrapper.append(loadMoreButtonContainer);
}
