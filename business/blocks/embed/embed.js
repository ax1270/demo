/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

// ========================================
// 定数定義
// ========================================

/** 埋め込み動画として扱うURLパターン */
const EMBED_URL_PATTERNS = ['youtube.com', 'youtu.be', 'vimeo.com'];

/** 無条件で保持する見出しタグ */
const HEADING_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

/** 無条件で保持するリストタグ */
const LIST_TAGS = ['UL', 'OL'];

/** テキストコンテンツとして保持する要素タグ */
const TEXT_CONTENT_TAGS = ['BLOCKQUOTE', 'PRE', 'CODE'];

/** CSSクラス名 */
const CSS_CLASSES = {
  embedTextContent: 'embed-text-content',
  embedPlaceholder: 'embed-placeholder',
  embedPlaceholderPlay: 'embed-placeholder-play',
  embedVideoContainer: 'embed-video-container',
  embedVideo: 'embed-video',
  embedIsLoaded: 'embed-is-loaded',
  embedBox: 'embed-box',
};

// ========================================
// ユーティリティ関数
// ========================================

/**
 * スクリプトを動的に読み込む
 * @param {string} url スクリプトのURL
 * @param {Function} callback 読み込み完了時のコールバック
 * @param {string} type スクリプトのtype属性
 * @returns {HTMLScriptElement} 作成されたscript要素
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
 * URLが埋め込み動画のURLかどうかを判定
 * @param {string} url チェックするURL
 * @returns {boolean} 埋め込み動画のURLの場合true
 */
const isEmbedUrl = (url) => {
  if (!url) return false;
  return EMBED_URL_PATTERNS.some((pattern) => url.includes(pattern));
};

// ========================================
// 埋め込みプロバイダー関数
// ========================================

/**
 * デフォルトの埋め込みHTMLを生成
 * @param {URL} url 埋め込むURL
 * @returns {string} 埋め込みHTML
 */
const getDefaultEmbed = (url) => `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

/**
 * YouTube埋め込みHTMLを生成
 * @param {URL} url YouTubeのURL
 * @param {boolean} autoplay 自動再生するかどうか
 * @returns {string} 埋め込みHTML
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
 * Vimeo埋め込みHTMLを生成
 * @param {URL} url VimeoのURL
 * @param {boolean} autoplay 自動再生するかどうか
 * @returns {string} 埋め込みHTML
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
 * Twitter埋め込みHTMLを生成
 * @param {URL} url TwitterのURL
 * @returns {string} 埋め込みHTML
 */
const embedTwitter = (url) => {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
};

/** 埋め込みプロバイダーの設定 */
const EMBEDS_CONFIG = [
  {
    match: ['youtube', 'youtu.be'],
    embed: embedYoutube,
  },
  {
    match: ['vimeo'],
    embed: embedVimeo,
  },
  {
    match: ['twitter'],
    embed: embedTwitter,
  },
];

// ========================================
// DOM操作関数
// ========================================

/**
 * コンテナに埋め込みコンテンツをロード
 * @param {HTMLElement} container 埋め込み先のコンテナ
 * @param {string} link 埋め込むURL
 * @param {boolean} autoplay 自動再生するかどうか
 */
const loadEmbedInContainer = (container, link, autoplay) => {
  if (container.classList.contains(CSS_CLASSES.embedIsLoaded)) {
    return;
  }

  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  const url = new URL(link);

  if (config) {
    container.innerHTML = config.embed(url, autoplay);
    container.classList.add(CSS_CLASSES.embedVideo, `embed-${config.match[0]}`);
  } else {
    container.innerHTML = getDefaultEmbed(url);
    container.classList.add(CSS_CLASSES.embedVideo);
  }

  container.classList.add(CSS_CLASSES.embedIsLoaded);
};

/**
 * 動画コンテナ要素を作成
 * @returns {HTMLDivElement} 動画コンテナ要素
 */
const createVideoContainer = () => {
  const container = document.createElement('div');
  container.className = CSS_CLASSES.embedVideoContainer;
  return container;
};

/**
 * テキストコンテンツ要素を作成
 * @param {Array<Element>} elements 含める要素の配列
 * @returns {HTMLDivElement|null} テキストコンテンツ要素（要素がない場合はnull）
 */
const createTextContent = (elements) => {
  if (elements.length === 0) return null;

  const textContent = document.createElement('div');
  textContent.className = CSS_CLASSES.embedTextContent;
  elements.forEach((element) => {
    textContent.appendChild(element.cloneNode(true));
  });
  return textContent;
};

/**
 * プレースホルダー要素を作成
 * @param {HTMLElement} picture プレースホルダー画像
 * @param {string} link 動画URL
 * @returns {HTMLDivElement} プレースホルダー要素
 */
const createPlaceholder = (picture, link) => {
  const wrapper = document.createElement('div');
  wrapper.className = CSS_CLASSES.embedPlaceholder;
  wrapper.innerHTML = `<div class="${CSS_CLASSES.embedPlaceholderPlay}"><button type="button" title="Play"></button></div>`;
  wrapper.prepend(picture);

  wrapper.addEventListener('click', () => {
    const videoContainer = createVideoContainer();
    loadEmbedInContainer(videoContainer, link, true);
    wrapper.replaceWith(videoContainer);
  });

  return wrapper;
};

// ========================================
// コンテンツフィルタリング関数
// ========================================

/**
 * 要素を保持すべきかどうかを判定
 * @param {Element} element チェックする要素
 * @returns {boolean} 保持すべき場合true
 */
const shouldKeepElement = (element) => {
  // 見出しタグは無条件で保持
  if (HEADING_TAGS.includes(element.tagName)) {
    return true;
  }

  // リスト要素（ul/ol）は無条件で保持（captionクラス含む、内部にリンクがあってもOK）
  if (LIST_TAGS.includes(element.tagName)) {
    return true;
  }

  // pタグの判定
  if (element.tagName === 'P') {
    const hasText = element.textContent.trim().length > 0;

    // 画像（picture/img/source）を含む場合は除外
    const hasPicture = element.querySelector('picture, img, source') !== null;
    if (hasPicture) {
      return false;
    }

    // aタグを含む場合は、埋め込み動画のURLかどうかで判定
    const links = element.querySelectorAll('a');
    if (links.length > 0) {
      // すべてのaタグが埋め込み動画のURLでない場合のみ保持
      const hasOnlyEmbedLinks = Array.from(links).every((a) => isEmbedUrl(a.href));
      if (hasOnlyEmbedLinks) {
        return false; // 埋め込み動画のリンクのみの場合は除外
      }
    }

    return hasText;
  }

  // その他のテキストコンテンツ要素
  if (TEXT_CONTENT_TAGS.includes(element.tagName)) {
    const hasText = element.textContent.trim().length > 0;
    const hasPicture = element.querySelector('picture, img, source') !== null;
    return hasText && !hasPicture;
  }

  return false;
};

/**
 * 要素を再帰的に処理して、保持すべき要素を抽出
 * @param {Element} element 処理する要素
 * @returns {Element|null} 処理後の要素（保持しない場合はnull）
 */
const processElement = (element) => {
  // divの場合は再帰的に子要素を処理
  if (element.tagName === 'DIV') {
    const childElements = Array.from(element.children);
    const processedChildren = childElements
      .map((child) => processElement(child))
      .filter((child) => child !== null);

    if (processedChildren.length > 0) {
      // 保持すべき子要素がある場合はdivを複製して子要素を追加
      const clonedDiv = element.cloneNode(false); // 属性だけコピー
      processedChildren.forEach((child) => {
        clonedDiv.appendChild(child);
      });
      return clonedDiv;
    }
    return null; // 保持する子要素がない場合はnull
  }

  // div以外の要素は判定に基づいて保持
  if (shouldKeepElement(element)) {
    return element.cloneNode(true);
  }

  return null;
};

/**
 * 埋め込みコンテンツとテキストコンテンツを抽出
 * @param {HTMLElement} embedDiv 処理する要素
 * @returns {Array<Element>} 保持すべき要素の配列
 */
const extractTextContent = (embedDiv) => {
  const elements = [];
  const topLevelElements = Array.from(embedDiv.children);

  topLevelElements.forEach((element) => {
    const processedElement = processElement(element);
    if (processedElement !== null) {
      elements.push(processedElement);
    }
  });

  return elements;
};

/**
 * Intersection Observerで動画の遅延読み込みを設定
 * @param {HTMLElement} embedDiv 埋め込み要素
 * @param {string} link 動画URL
 */
const setupLazyLoad = (embedDiv, link) => {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();

      const videoContainer = createVideoContainer();
      loadEmbedInContainer(videoContainer, link, false);

      // テキストコンテンツの前に動画を挿入
      const textContent = embedDiv.querySelector(`.${CSS_CLASSES.embedTextContent}`);
      if (textContent) {
        embedDiv.insertBefore(videoContainer, textContent);
      } else {
        embedDiv.appendChild(videoContainer);
      }
    }
  });
  observer.observe(embedDiv);
};

// ========================================
// メイン処理関数
// ========================================

/**
 * 単一の埋め込みdivを処理
 * @param {HTMLElement} embedDiv 処理する埋め込み要素
 */
const processSingleEmbedDiv = (embedDiv) => {
  const placeholder = embedDiv.querySelector('picture');
  const linkElement = embedDiv.querySelector('a');

  // リンクが存在しない場合は処理しない
  if (!linkElement) {
    return;
  }

  const link = linkElement.href;

  // テキストコンテンツを抽出
  const textElements = extractTextContent(embedDiv);

  // embedDivの内容をクリア
  embedDiv.textContent = '';

  // テキストコンテンツを追加
  const textContent = createTextContent(textElements);
  if (textContent) {
    embedDiv.appendChild(textContent);
  }

  // プレースホルダーがある場合はクリック時に動画を読み込み
  if (placeholder) {
    const placeholderElement = createPlaceholder(placeholder, link);
    embedDiv.prepend(placeholderElement);
  } else {
    // プレースホルダーがない場合は遅延読み込み
    setupLazyLoad(embedDiv, link);
  }
};

/**
 * embedブロックを装飾
 * @param {HTMLElement} block embedブロック要素
 */
export default function decorate(block) {
  // カラムレイアウト（col2/col3/col4）の判定
  const isMultiColumn = block.classList.contains('col2')
                       || block.classList.contains('col3')
                       || block.classList.contains('col4');

  if (isMultiColumn) {
    // マルチカラムの場合は各子divを個別に処理
    const childDivs = Array.from(block.children).filter((child) => child.tagName === 'DIV');
    childDivs.forEach((childDiv) => {
      childDiv.classList.add(CSS_CLASSES.embedBox);
      processSingleEmbedDiv(childDiv);
    });
  } else {
    // シングルカラムの場合はブロック全体を処理
    processSingleEmbedDiv(block);
  }
}
