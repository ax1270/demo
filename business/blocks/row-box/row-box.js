import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateButtonsForBlocks } from '../../scripts/scripts.js';

/**
 * ========================================
 * 動画埋め込み関連の関数（embed.jsより）
 * ========================================
 */

/**
 * スクリプトを動的に読み込む
 */
const loadScript = (url, callback, type) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  script.onload = callback;
  head.append(script);
  return script;
};

/**
 * YouTube動画の埋め込みHTMLを生成
 */
const embedYoutube = (url, autoplay) => {
  const usp = new URLSearchParams(url.search);
  const suffix = autoplay ? '&muted=1&autoplay=1' : '';
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

/**
 * Vimeo動画の埋め込みHTMLを生成
 */
const embedVimeo = (url, autoplay) => {
  const [, video] = url.pathname.split('/');
  const suffix = autoplay ? '?muted=1&autoplay=1' : '';
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

/**
 * 動画埋め込み設定
 */
const VIDEO_EMBEDS_CONFIG = [
  {
    match: ['youtube', 'youtu.be'],
    embed: embedYoutube,
  },
  {
    match: ['vimeo'],
    embed: embedVimeo,
  },
];

/**
 * コンテナに動画を埋め込む
 */
const loadVideoInContainer = (container, link, autoplay) => {
  if (container.classList.contains('row-box-video-loaded')) {
    return;
  }

  const config = VIDEO_EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  const url = new URL(link);

  if (config) {
    container.innerHTML = config.embed(url, autoplay);
    container.classList.add('row-box-video', `row-box-video-${config.match[0]}`);
  }

  container.classList.add('row-box-video-loaded');
};

/**
 * URLが動画URL（YouTube/Vimeo）かチェック
 */
const isVideoUrl = (url) => VIDEO_EMBEDS_CONFIG.some((config) => config.match.some((match) => url.includes(match)));

/**
 * ========================================
 * row-boxブロックを装飾する関数
 * ========================================
 */
export default function decorate(block) {
  // クラス名の定義
  const baseClass = 'row-box';
  const itemsClass = `${baseClass}-items`;
  const imgClass = `${baseClass}-img`;
  const contentClass = `${baseClass}-content`;
  const buttonWrapClass = `${baseClass}-button-wrap`;
  const itemTagsClass = `${baseClass}-tags`;
  const itemListsClass = `${baseClass}-lists`;
  const videoPlaceholderClass = `${baseClass}-video-placeholder`;
  const videoContainerClass = `${baseClass}-video-container`;
  const videoPlayClass = `${baseClass}-video-play`;

  // 画像の最適化設定
  const breakpoints = [
    { media: '(min-width: 600px)', width: '2000' },
    { width: '750' },
  ];

  // ========================================
  // 各アイテムを処理
  // ========================================

  [...block.children].forEach((row) => {
    // 親divにクラスを追加
    row.className = itemsClass;

    // ボタンの装飾処理を実行（DOM構築前に実行）
    decorateButtonsForBlocks(row);

    // 動画URLを検出
    let videoUrl = null;
    let videoLinkElement = null;
    const allLinks = row.querySelectorAll('a');

    allLinks.forEach((link) => {
      if (isVideoUrl(link.href)) {
        videoUrl = link.href;
        videoLinkElement = link;
      }
    });

    // 子要素を処理
    [...row.children].forEach((div) => {
      // imgタグの有無でクラスを決定
      if (div.querySelector('img')) {
        div.className = imgClass;
      } else {
        div.className = contentClass;
      }

      // リストul・olにitemTagsClassをつける
      const innerList = row.querySelectorAll('ul, ol');
      innerList.forEach((list) => {
        // .captionクラスがついているリストはそのままにする
        if (list.classList.contains('caption')) {
          return;
        }

        list.className = itemTagsClass;
      });

      // data-alignとdata-valignの処理
      if (div.hasAttribute('data-align')) {
        const alignValue = div.getAttribute('data-align');
        div.style.textAlign = alignValue;
      }

      if (div.hasAttribute('data-valign')) {
        const valignValue = div.getAttribute('data-valign');
        div.style.verticalAlign = valignValue;
      }
    });

    // ========================================
    // 動画埋め込み処理
    // ========================================

    if (videoUrl && videoLinkElement) {
      // 動画URLがある場合の処理
      let imgDiv = row.querySelector(`.${imgClass}`);

      // 画像（サムネイル）の有無をチェック
      const hasThumbnail = imgDiv && imgDiv.querySelector('img');

      // 動画URLのリンク要素を含む要素を保存
      const videoLinkParentDiv = videoLinkElement.closest(`.${contentClass}`);

      // 動画URLのリンク要素を含むpタグを削除
      const linkParagraph = videoLinkElement.closest('p');
      if (linkParagraph) {
        linkParagraph.remove();
      }

      // row-box-imgがない場合
      if (!imgDiv) {
        // 動画URLを含むdivが存在する場合、それをimgDivとして再利用（MDの順序を保持）
        if (videoLinkParentDiv) {
          imgDiv = videoLinkParentDiv;
          imgDiv.className = imgClass;
        } else {
          // どちらも存在しない場合は新規作成して最初に挿入
          imgDiv = document.createElement('div');
          imgDiv.className = imgClass;
          row.insertBefore(imgDiv, row.firstChild);
        }
      }

      const targetDiv = imgDiv;

      if (hasThumbnail) {
        // ========================================
        // サムネイルあり：プレースホルダーを作成
        // ========================================

        // 画像を最適化
        const img = targetDiv.querySelector('img');
        if (img) {
          const picture = img.closest('picture');
          if (picture) {
            const optimizedPicture = createOptimizedPicture(img.src, img.alt, false, breakpoints);
            picture.replaceWith(optimizedPicture);
          }
        }

        // プレースホルダーを作成
        const placeholder = document.createElement('div');
        placeholder.className = videoPlaceholderClass;

        const playButton = document.createElement('div');
        playButton.className = videoPlayClass;
        playButton.innerHTML = '<button type="button" title="Play"></button>';

        placeholder.innerHTML = targetDiv.innerHTML;
        placeholder.appendChild(playButton);

        // クリックイベント
        placeholder.addEventListener('click', () => {
          const videoContainer = document.createElement('div');
          videoContainer.className = videoContainerClass;
          loadVideoInContainer(videoContainer, videoUrl, true);
          placeholder.replaceWith(videoContainer);
        });

        targetDiv.innerHTML = '';
        targetDiv.appendChild(placeholder);
      } else {
        // ========================================
        // サムネイルなし：遅延読み込み
        // ========================================

        const observer = new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect();

            const videoContainer = document.createElement('div');
            videoContainer.className = videoContainerClass;
            loadVideoInContainer(videoContainer, videoUrl, false);

            targetDiv.innerHTML = '';
            targetDiv.appendChild(videoContainer);
          }
        });
        observer.observe(targetDiv);
      }

      // 動画URLを含んでいた要素が空になった場合は削除（ただし、imgDivとして再利用された場合を除く）
      if (videoLinkParentDiv && videoLinkParentDiv !== imgDiv && videoLinkParentDiv.innerHTML.trim() === '') {
        videoLinkParentDiv.remove();
      }
    } else {
      // ========================================
      // 動画URLがない場合：通常の画像処理
      // ========================================

      const imgDiv = row.querySelector(`.${imgClass}`);
      if (imgDiv) {
        const img = imgDiv.querySelector('img');
        if (img) {
          const picture = img.closest('picture');
          if (picture) {
            const optimizedPicture = createOptimizedPicture(img.src, img.alt, false, breakpoints);
            picture.replaceWith(optimizedPicture);
          }
        }
      }
    }

    // ========================================
    // リストの処理
    // ========================================

    const innerList = row.querySelectorAll('ul, ol');
    innerList.forEach((list) => {
      // .captionクラスがついているリストはそのままにする
      if (list.classList.contains('caption')) {
        return;
      }

      const hasEmTags = Array.from(list.children).every((li) => li.querySelector('em'));
      if (hasEmTags) {
        list.className = itemTagsClass;
        // emタグを削除してテキストのみを残す
        list.querySelectorAll('li em').forEach((em) => {
          const { textContent } = em;
          em.parentNode.textContent = textContent;
        });
      } else {
        list.className = itemListsClass;
      }
    });

    // ========================================
    // ボタンラップの処理
    // ========================================

    // 全ての row-box-content に対して処理
    const contentDivs = row.querySelectorAll(`.${contentClass}`);
    contentDivs.forEach((contentDiv) => {
      // ボタンコンテナを処理
      const buttonContainers = contentDiv.querySelectorAll('p.button-container');
      if (buttonContainers.length > 0) {
        const buttonWrap = document.createElement('div');
        buttonWrap.className = buttonWrapClass;

        const firstButtonContainer = buttonContainers[0];
        const { parentElement } = firstButtonContainer;
        const firstButtonIndex = Array.from(parentElement.children).indexOf(firstButtonContainer);

        buttonContainers.forEach((container) => {
          buttonWrap.appendChild(container);
        });

        parentElement.insertBefore(buttonWrap, parentElement.children[firstButtonIndex] || null);
      }
    });

    // ========================================
    // link-all処理
    // ========================================

    const isLinkAll = block.classList.contains('link-all') && row.querySelector('a');

    // link-allの場合は行全体をリンクに変換
    if (isLinkAll) {
      const innerLink = row.querySelector('a');
      if (innerLink) {
        const linkWrapper = document.createElement('a');
        linkWrapper.href = innerLink.href;
        linkWrapper.className = itemsClass;
        linkWrapper.classList.add('-link');
        linkWrapper.append(...row.childNodes);

        // リンクを含んでいたdivを削除（cards-normalと同じ処理）
        innerLink.closest('div').remove();

        row.replaceWith(linkWrapper);
      }
    }
  });
}
