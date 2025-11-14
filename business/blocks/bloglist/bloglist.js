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
  document.querySelectorAll('.bloglist p').forEach((p, i) => {
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

  // テンプレートのiframeを定義
  const iframe = document.createElement('iframe');
  iframe.src = '/tools/sidekick/blocks/cards-borderradius';
  iframe.style.display = 'none';
  iframe.onload = function () {
    setTimeout(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const cardsBlock = iframeDoc.querySelector('.cards.block.borderradius');

        function cardBlockUpdate(item, page) {
          // ページ情報の取得
          const pageNavigationTitle = page['navigation-title'];
          const pageImage = page.image;
          const pagePath = page.path;
          const pageTags = page.tags;
          const pageLastModified = Number(page.lastModified);

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

          // テキスト部分
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
          const liEls = cardBody.querySelectorAll('ul > li');
          liEls.forEach((li, i) => li.textContent = pageTags[i]);

          return item;
        }

        // 自動で表示するカードを作成する
        const cardsOuter = cardsBlock.querySelectorAll('ul')[0];
        const cardsItems = cardsOuter.children;
        result.forEach((page, i) => {
          if (i < 3) {
            const item = cardsItems[i];
            cardBlockUpdate(item, page);
          } else {
            const item = cardsItems[0].cloneNode(true);
            cardsOuter.appendChild(cardBlockUpdate(item, page));
          }
        });

        let loadMoreButtonContainer;
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
          // 1部のみ表示する場合
          Array.from(cardsItems).forEach((child, i) => {
            if (i > 2) child.style.display = 'none';
          });
        }

        // 作成したカードをHTMLに挿入
        const bloglistWrapper = document.querySelector('.bloglist-wrapper');
        bloglistWrapper.innerHTML = '';
        bloglistWrapper.append(cardsBlock);
        loadMoreButtonContainer && bloglistWrapper.append(loadMoreButtonContainer);

        // card.cssがない場合は追加
        const isExistCardCss = Array.from(document.querySelectorAll('link')).find((link) => link.getAttribute('href').indexOf('cards.css') !== -1);
        if (!isExistCardCss) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/blocks/cards/cards.css';
          document.querySelector('head').appendChild(link);
        }
      } catch (error) {
        console.error('Error accessing iframe content:', error);
      }
    }, 1000);
  };

  // iframを読み込むためにHTMLに挿入
  document.querySelector('.bloglist.block').append(iframe);
}
