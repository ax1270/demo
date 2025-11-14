export default function decorate() {
  // section.article-main-containerが存在する場合
  const articleMainContainer = document.querySelector('.section.article-main-container');
  const main = document.querySelector('main');

  if (articleMainContainer) {
    // シェアボタンのリストを作成
    const socialShareWrp = document.createElement('div');
    const socialShareList = document.createElement('ul');
    const socialShareClassName = 't-social-share-button';
    socialShareWrp.className = socialShareClassName;
    socialShareList.className = `${socialShareClassName}-list`;

    // mainタグに"page-article"のクラスを付与
    main.classList.add('page-article');

    // article-containerを作成
    const articleContainer = document.createElement('div');
    articleContainer.className = 'article-container';

    // 現在のURLをエンコード
    const currentUrl = encodeURIComponent(window.location.href);

    // mainタグ直下の要素を取得
    const children = Array.from(main.children);

    // 要素をarticle-containerに移動
    children.forEach((child) => {
      const isArticleMain = child.classList.contains('article-main-container');
      const isFragment = child.classList.contains('fragment-container');
      const isRelatedArticles = child.classList.contains('related-articles');

      if (!isArticleMain && !isFragment && !isRelatedArticles) {
        articleContainer.appendChild(child);
      }
    });

    // 各ソーシャルメディアのボタンを追加
    const socialMediaLinks = [
      {
        className: '-facebook',
        url: `https://www.facebook.com/share.php?u=${currentUrl}%3Futm_source%3Dfacebook%26utm_medium%3Dsocial%26utm_campaign%3D_BIZ_0017`,
        imgSrc: '/business/icons/sns-facebook.svg',
        alt: 'facebook icon',
      },
      {
        className: '-twitter',
        url: `https://twitter.com/share?url=${currentUrl}%3Futm_source%3Dtwitter%26utm_medium%3Dsocial%26utm_campaign%3D_BIZ_0018`,
        imgSrc: '/business/icons/sns-x-black.svg',
        alt: 'x icon',
      },
      {
        className: '-linkedin',
        url: `https://www.linkedin.com/shareArticle?mini=true&url=${currentUrl}%3Futm_source%3Dlinkdin%26utm_medium%3Dsocial%26utm_campaign%3D_BIZ_0019`,
        imgSrc: '/business/icons/sns-linkedin.svg',
        alt: 'linkedin icon',
      },
    ];

    // 各アイテムを追加
    socialMediaLinks.forEach((link) => {
      const li = document.createElement('li');
      li.className = `${`${socialShareClassName}-list-item`} ${link.className}`;

      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.className = `${`${socialShareList.className}-list-item`}-link`;

      const img = document.createElement('img');
      img.src = link.imgSrc;
      img.alt = link.alt;
      img.className = `${`${socialShareList.className}-list-item`}-icon`;

      a.appendChild(img);
      li.appendChild(a);
      socialShareList.appendChild(li);
    });

    // article-containerに追加
    socialShareWrp.appendChild(socialShareList);
    articleContainer.appendChild(socialShareWrp);

    // article-containerをmainタグに追加
    main.insertBefore(articleContainer, articleMainContainer.nextSibling);
  }

  // page-article-containerを追加
  const pageArticleContainer = document.createElement('div');
  pageArticleContainer.className = 'page-article-container';

  // mainの中身をすべてpage-article-containerに入れる
  const pageArticleChildren = Array.from(main.children);
  pageArticleChildren.forEach((child) => {
    pageArticleContainer.appendChild(child);
  });

  // page-article-containerをmainの直下に追加
  main.appendChild(pageArticleContainer);
}
