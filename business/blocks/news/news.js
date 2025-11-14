export default function decorate() {
  // PDFとZIPリンクにアイコンを追加する関数
  function addFileIconsToNews(element) {
    const fileTypes = [
      {
        extension: 'pdf',
        linkClass: 'pdf-link',
        alt: 'PDF',
      },
      {
        extension: 'zip',
        linkClass: 'zip-link',
        alt: 'ZIP',
      },
    ];

    element.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href) {
        const extension = href.split('.').pop().trim().toLowerCase();
        const fileType = fileTypes.find((type) => type.extension === extension);
        if (fileType) {
          a.classList.add(fileType.linkClass);
        }
      }
    });
  }

  // 最初にすべてのnewsブロックから-tagクラスを削除し、date、tagareaクラスも削除
  document.querySelectorAll('.news').forEach((newsBlock) => {
    newsBlock.classList.remove('-tag');
    // 既存のdate、tagareaクラスも削除
    newsBlock.querySelectorAll('.date').forEach((dateEl) => {
      dateEl.classList.remove('date');
      // class属性が空になった場合は属性を削除
      if (dateEl.className === '') {
        dateEl.removeAttribute('class');
      }
    });
    newsBlock.querySelectorAll('.tagarea').forEach((tagareaEl) => {
      tagareaEl.classList.remove('tagarea');
      // class属性が空になった場合は属性を削除
      if (tagareaEl.className === '') {
        tagareaEl.removeAttribute('class');
      }
    });
  });

  document.querySelectorAll('.news > div').forEach((newsItem, index) => {
    // news-innerクラスを追加
    newsItem.classList.add('news-inner');

    // news-inner直下のdiv要素の数をチェック（DOM変更前）
    const newsInnerDivs = newsItem.querySelectorAll(':scope > div');
    const shouldAddTagClass = newsInnerDivs.length === 2;

    // デバッグログ
    console.log(`News item ${index}:`, {
      divCount: newsInnerDivs.length,
      shouldAddTagClass,
      divs: Array.from(newsInnerDivs).map((div) => ({
        className: div.className,
        textContent: div.textContent?.trim(),
      })),
    });

    const linkElement = newsItem.querySelector('a');
    if (linkElement) {
      const url = linkElement.getAttribute('href');
      const titleText = linkElement.getAttribute('title');
      // .button-containerを削除
      const buttonContainers = newsItem.querySelectorAll('.button-container');
      buttonContainers.forEach((buttonContainer) => {
        buttonContainer.remove();
      });
      // リンク要素内のボタンコンテナも削除
      const linkButtonContainers = linkElement.querySelectorAll('.button-container');
      linkButtonContainers.forEach((buttonContainer) => {
        buttonContainer.remove();
      });

      // 新しい<a>タグを作成し、news-item-linkをラップ
      const wrapper = document.createElement('a');
      wrapper.href = url;
      wrapper.className = 'news-item-link';
      wrapper.title = titleText;

      // PDF/ZIPリンクの場合はクラスを追加
      const extension = url.split('.').pop().trim().toLowerCase();
      if (extension === 'pdf') {
        wrapper.classList.add('pdf-link');
      } else if (extension === 'zip') {
        wrapper.classList.add('zip-link');
      }

      // titleの文言を<p>タグで追加
      if (titleText) {
        const titleParagraph = document.createElement('p');
        titleParagraph.className = 'news-title';
        titleParagraph.textContent = titleText;
        newsItem.appendChild(titleParagraph);
      }

      // 元の<a>タグを削除
      linkElement.remove();

      // newsItemを<a>の中に移動
      newsItem.replaceWith(wrapper);
      wrapper.appendChild(newsItem);

      // div要素が2つあった場合、newsブロックに-tagクラスを追加
      if (shouldAddTagClass) {
        console.log(`Adding -tag class to news item ${index}`);
        wrapper.closest('.news').classList.add('-tag');
        // 1つ目のdivにdateクラスを追加
        const firstDiv = newsInnerDivs[0];
        if (firstDiv) {
          firstDiv.classList.add('date');
        }
        // 2つ目のdivにtagareaクラスを追加
        const secondDiv = newsInnerDivs[1];
        if (secondDiv) {
          secondDiv.classList.add('tagarea');
        }
      }
    } else if (shouldAddTagClass) {
      // linkElementがない場合も-tagクラスを追加するかチェック
      console.log(`Adding -tag class to news item ${index} (no link)`);
      newsItem.closest('.news').classList.add('-tag');
      // 1つ目のdivにdateクラスを追加
      const firstDiv = newsInnerDivs[0];
      if (firstDiv) {
        firstDiv.classList.add('date');
      }
      // 2つ目のdivにtagareaクラスを追加
      const secondDiv = newsInnerDivs[1];
      if (secondDiv) {
        secondDiv.classList.add('tagarea');
      }
    }
  });

  // 既に処理済みの要素もチェック
  document.querySelectorAll('.news-inner').forEach((newsInner, index) => {
    const newsInnerDivs = newsInner.querySelectorAll(':scope > div');

    // デバッグログ（処理済み要素）
    console.log(`Processed news item ${index}:`, {
      divCount: newsInnerDivs.length,
      willAddTag: newsInnerDivs.length === 2,
      divs: Array.from(newsInnerDivs).map((div) => ({
        className: div.className,
        textContent: div.textContent?.trim(),
      })),
    });

    // div要素が2つの場合のみ-tagクラスを追加
    if (newsInnerDivs.length === 2) {
      console.log(`Adding -tag class to processed news item ${index}`);
      newsInner.closest('.news').classList.add('-tag');
      // 1つ目のdivにdateクラスを追加
      const firstDiv = newsInnerDivs[0];
      if (firstDiv) {
        firstDiv.classList.add('date');
      }
      // 2つ目のdivにtagareaクラスを追加
      const secondDiv = newsInnerDivs[1];
      if (secondDiv) {
        secondDiv.classList.add('tagarea');
      }
    } else {
      // div要素が2つ未満の場合は-tagクラスを削除
      console.log(`Removing -tag class from processed news item ${index} (div count: ${newsInnerDivs.length})`);
      newsInner.closest('.news').classList.remove('-tag');
      // dateクラスとtagareaクラスも適切に設定
      if (newsInnerDivs.length === 1) {
        const firstDiv = newsInnerDivs[0];
        if (firstDiv) {
          firstDiv.classList.add('date');
        }
      }
    }
  });

  // すべてのnews-item-linkにPDF/ZIPクラスを追加
  document.querySelectorAll('.news-item-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      const extension = href.split('.').pop().trim().toLowerCase();
      if (extension === 'pdf') {
        link.classList.add('pdf-link');
      } else if (extension === 'zip') {
        link.classList.add('zip-link');
      }
    }
  });

  // スクロールバーが表示されている場合のみpadding-rightを追加
  const newsBlocks = document.querySelectorAll('.news.scroll.block');
  newsBlocks.forEach((newsBlock) => {
    // ResizeObserverを使用して要素のサイズ変更を監視
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { target } = entry;
        // スクロールバーが表示されているかチェック
        if (target.scrollHeight > target.clientHeight) {
          // スクロールバーが表示されている場合、padding-rightを追加
          target.style.paddingRight = '8px';
        } else {
          // スクロールバーが表示されていない場合、padding-rightを削除
          target.style.paddingRight = '0';
        }
      });
    });

    // 監視開始
    resizeObserver.observe(newsBlock);
  });
}
