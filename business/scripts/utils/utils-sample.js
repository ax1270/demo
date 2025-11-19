/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
export function wrapImgsInLinks(container) {
    const pictures = container.querySelectorAll('picture');
    pictures.forEach((pic) => {
      let link = pic.nextElementSibling;
  
      // Skip br elements and find the next valid sibling
      while (link && link.tagName === 'BR') {
        link = link.nextElementSibling;
      }
  
      if (link && link.tagName === 'A' && link.href) {
        link.innerHTML = pic.outerHTML;
        pic.replaceWith(link);
        const siblingBr = link.nextElementSibling;
        if (siblingBr && siblingBr.tagName === 'BR') {
          siblingBr.remove();
        }
      }
    });
  }


  /**
 * 外部リンクかどうかを判定する
 * lifecycle.jsの処理と同じロジックを使用
 * loadEagerより後にHeaderの生成処理が走るため、ここで実装を持つ
 * @param {string} href リンクのhref属性
 * @returns {boolean} 外部リンクの場合true
 */
export function isExternalLink(href) {
  if (!href) return false;
  
  // 内部サイトのURLパターン
  const internalPatterns = [
    'https://main--softbank-eds-develop--aquaring.aem.page/',
    'https://main--aem-eds--softbankbtob.aem.page/',
    'https://www.softbank.jp/biz/',
    'http://localhost:3000/',
    'https://sb-test--demo--ax1270.aem.page/', // TODO
  ];
  
  return !internalPatterns.some(pattern => href.includes(pattern));
}

/**
 * セクションからpタグの情報を取得するヘルパー関数
 * @param {Element} section セクション要素
 * @returns {Object|null} {text, href, hasLink} または null
 */
export function extractParagraphInfo(section) {
  if (!section) return null;
  
  const p = section.querySelector('p');
  if (!p) return null;

  const link = p.querySelector('a');
  let text = '';
  let href = '';
  let hasLink = false;

  if (link) {
    href = link.getAttribute('href') || '';
    text = link.textContent.trim();
    hasLink = !!href;
  } else {
    text = p.textContent.trim();
  }

  if (!text) return null;

  return { text, href, hasLink };
}