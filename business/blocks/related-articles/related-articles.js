export default function decorate(block) {
  const section = block.closest('.section');

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes'
          && mutation.attributeName === 'data-section-status'
          && mutation.target.dataset.sectionStatus === 'loaded') {
        // DOM構造を変更
        const relatedArticlesContainer = section;
        if (relatedArticlesContainer) {
          // default-content-wrapperとcards-wrapperを移動
          const defaultContent = relatedArticlesContainer.querySelector('.default-content-wrapper');
          const cardsWrapper = relatedArticlesContainer.querySelector('.cards-wrapper');

          if (defaultContent && cardsWrapper) {
            const relatedArticlesBlock = relatedArticlesContainer.querySelector('.related-articles.block');
            if (relatedArticlesBlock) {
              relatedArticlesBlock.appendChild(defaultContent);
              relatedArticlesBlock.appendChild(cardsWrapper);
            }
          }
        }

        // article-containerを取得して移動
        const articleContainer = document.querySelector('.article-container');
        if (articleContainer) {
          const pageArticleContainer = document.querySelector('.page-article-container');
          if (pageArticleContainer) {
            pageArticleContainer.appendChild(section);
          }
        }

        observer.disconnect();
      }
    });
  });

  if (section) {
    observer.observe(section, {
      attributes: true,
      attributeFilter: ['data-section-status'],
    });
  }
}
