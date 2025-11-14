/**
 * パンくずリスト生成ユーティリティ
 */

/**
 * パンくずリストを作成する
 * @returns {Promise<HTMLElement>} パンくずリスト要素
 */
async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = [
    { title: '法人のお客様', url: 'https://www.softbank.jp/biz/' },
    { title: 'ブログ', url: 'https://www.softbank.jp/biz/blog/' },
    { title: 'ビジネスブログ', url: 'https://www.softbank.jp/biz/blog/business/' },
  ];

  // 現在のページのURLを取得
  const currentUrl = document.location.href;
  const isHomePage = currentUrl === 'https://www.softbank.jp/biz/'
    || currentUrl === 'https://main--aem-eds--softbankbtob.aem.page/'
    || currentUrl === 'https://main--softbank-eds-develop--aquaring.aem.page/'
    || currentUrl === 'http://localhost:3000/';

  const ol = document.createElement('ol');
  crumbs.forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    a.textContent = item.title;
    li.append(a);
    ol.appendChild(li);
  });

  // トップページ以外の場合、現在のページの情報を追加
  if (!isHomePage) {
    const h1 = document.querySelector('h1');
    if (h1) {
      const currentItem = document.createElement('li');
      const currentLink = document.createElement('a');
      currentLink.href = currentUrl;
      currentLink.textContent = h1.textContent;
      currentItem.appendChild(currentLink);
      ol.appendChild(currentItem);
    }
  }

  breadcrumbs.append(ol);
  return breadcrumbs;
}

export default buildBreadcrumbs;
