/**
 * Google Cloud検索ウィジェットの設定
 */
const SEARCH_WIDGET_CONFIG = {
  scriptUrl: 'https://cloud.google.com/ai/gen-app-builder/client?hl=ja',
  defaultConfigId: 'f760eeb7-3667-4bc1-99e0-6189313e2ab9',
  defaultTriggerId: 'searchWidgetTrigger',
  defaultPlaceholder: '検索',
  mobilePlaceholder: '検索',
  mobileBreakpoint: 768,
  widgetStyles: {
    display: 'block',
  },
};

/**
 * レスポンシブプレースホルダー管理者
 * 単一責任: 画面サイズに応じたプレースホルダーテキストの管理
 */
class ResponsivePlaceholderManager {
  constructor(config) {
    this.config = config;
  }

  /**
   * 現在の画面サイズに適したプレースホルダーテキストを取得
   * @returns {string}
   */
  getCurrentPlaceholder() {
    return this._isMobile() ? this.config.mobilePlaceholder : this.config.defaultPlaceholder;
  }

  /**
   * プレースホルダーテキストを動的に更新
   * @param {HTMLInputElement} inputElement
   */
  updatePlaceholder(inputElement) {
    if (inputElement) {
      inputElement.placeholder = this.getCurrentPlaceholder();
    }
  }

  /**
   * リサイズイベントリスナーを設定
   * @param {HTMLInputElement} inputElement
   */
  setupResizeListener(inputElement) {
    const handleResize = () => {
      this.updatePlaceholder(inputElement);
    };

    window.addEventListener('resize', handleResize);

    // 初期設定
    this.updatePlaceholder(inputElement);
  }

  /**
   * モバイル画面かどうかを判定
   * @returns {boolean}
   * @private
   */
  _isMobile() {
    return window.innerWidth <= this.config.mobileBreakpoint;
  }
}

/**
 * Google Cloudスクリプトローダー
 * 単一責任: Google Cloud検索ウィジェットスクリプトの読み込み
 */
class GoogleCloudScriptLoader {
  constructor(config) {
    this.config = config;
  }

  /**
   * Google Cloudスクリプトを読み込む
   * @returns {Promise<void>}
   */
  async loadScript() {
    if (this._isScriptAlreadyLoaded()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = this._createScriptElement();

      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        const error = new Error('Google Cloud search widget script loading failed');
        console.error('Google Cloudスクリプトの読み込みに失敗:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * スクリプトが既に読み込まれているかチェック
   * @returns {boolean}
   * @private
   */
  _isScriptAlreadyLoaded() {
    return document.querySelector('script[src*="gen-app-builder/client"]') !== null;
  }

  /**
   * スクリプト要素を作成
   * @returns {HTMLScriptElement}
   * @private
   */
  _createScriptElement() {
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = this.config.scriptUrl;
    return script;
  }
}

/**
 * 検索ウィジェット要素
 * 単一責任: Google Cloud検索ウィジェット要素の作成と設定
 */
class SearchWidgetElementFactory {
  constructor(config, configId) {
    this.config = config;
    this.configId = configId || config.defaultConfigId;
    this.placeholderManager = new ResponsivePlaceholderManager(config);
  }

  /**
   * 検索ウィジェット要素群を作成
   * @returns {Array<HTMLElement>} [widgetElement, triggerWrapperElement]
   */
  createWidgetElements() {
    // 検索ウィジェット要素を作成
    const widgetElement = this._createSearchWidget();
    const triggerWrapperElement = this._createTriggerWrapper();

    return [widgetElement, triggerWrapperElement];
  }

  /**
   * gen-search-widget要素を作成
   * @returns {HTMLElement}
   * @private
   */
  _createSearchWidget() {
    const element = document.createElement('gen-search-widget');
    this._applyWidgetStyles(element);
    this._setWidgetAttributes(element);
    return element;
  }

  /**
   * トリガー用のラッパー要素を作成（アイコン + span + input）
   * @returns {HTMLDivElement}
   * @private
   */
  _createTriggerWrapper() {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-trigger-wrapper';

    // コンテンツ表示用のラッパー
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'search-content-wrapper';

    // アイコン要素を作成
    const iconElement = this._createSearchIcon();

    // テキスト表示用のspan要素を作成
    const textElement = this._createSearchText();

    // input要素を作成（透明で全体をカバー）
    const input = this._createTriggerInput();

    contentWrapper.appendChild(iconElement);
    contentWrapper.appendChild(textElement);

    wrapper.appendChild(contentWrapper);
    wrapper.appendChild(input);

    return wrapper;
  }

  /**
   * 検索アイコン要素を作成
   * @returns {HTMLElement}
   * @private
   */
  _createSearchIcon() {
    const icon = document.createElement('div');
    icon.className = 'search-icon';
    return icon;
  }

  /**
   * 検索テキスト表示用のspan要素を作成
   * @returns {HTMLSpanElement}
   * @private
   */
  _createSearchText() {
    const span = document.createElement('span');
    span.className = 'search-text';

    // 初期テキストを設定
    span.textContent = this.placeholderManager.getCurrentPlaceholder();

    // リサイズ時にテキストを更新
    const handleResize = () => {
      span.textContent = this.placeholderManager.getCurrentPlaceholder();
    };
    window.addEventListener('resize', handleResize);

    return span;
  }

  /**
   * トリガー用のinput要素を作成
   * @returns {HTMLInputElement}
   * @private
   */
  _createTriggerInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = this.config.defaultTriggerId;
    input.className = 'search-input';

    // placeholderは空にする（spanで表示するため）
    input.placeholder = '';

    return input;
  }

  /**
   * ウィジェット要素にスタイルを適用
   * @param {HTMLElement} element
   * @private
   */
  _applyWidgetStyles(element) {
    Object.assign(element.style, this.config.widgetStyles);
  }

  /**
   * ウィジェット要素に属性を設定
   * @param {HTMLElement} element
   * @private
   */
  _setWidgetAttributes(element) {
    element.setAttribute('configId', this.configId);
    element.setAttribute('triggerId', this.config.defaultTriggerId);
  }
}

/**
 * 検索ウィジェット統合管理者
 * 責任: 全体の初期化フローを管理
 */
class SearchWidgetIntegrationManager {
  constructor(configId, config = SEARCH_WIDGET_CONFIG) {
    this.configId = configId;
    this.config = config;
    this.scriptLoader = new GoogleCloudScriptLoader(config);
    this.elementFactory = new SearchWidgetElementFactory(config, configId);
  }

  /**
   * 検索ウィジェット統合を初期化
   * @param {HTMLElement} container
   * @returns {Promise<void>}
   */
  async initialize(container) {
    try {
      await this.scriptLoader.loadScript();
      this._setupContent(container);
    } catch (error) {
      console.error('検索ウィジェットの初期化に失敗:', error);
      this._showErrorMessage(container);
    }
  }

  /**
   * コンテンツを設定
   * @param {HTMLElement} container
   * @private
   */
  _setupContent(container) {
    container.innerHTML = '';

    const [widgetElement, triggerWrapperElement] = this.elementFactory.createWidgetElements();
    container.appendChild(widgetElement);
    container.appendChild(triggerWrapperElement);
  }

  /**
   * エラーメッセージを表示
   * @param {HTMLElement} container
   * @private
   */
  _showErrorMessage(container) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>検索ウィジェットの読み込みに失敗しました</p>
        <p>しばらく時間をおいてから再度お試しください</p>
      </div>
    `;
  }
}

/**
 * メインのdecorate関数
 * 依存性注入によりテスタビリティを向上
 */
export default function decorate(block) {
  // ブロック内のテキストからカスタムプレースホルダーを取得（もしあれば）
  const configElement = block.querySelector('p');
  const customPlaceholderText = configElement ? configElement.textContent.trim() : null;

  // カスタム設定オブジェクトを作成
  const config = {
    ...SEARCH_WIDGET_CONFIG,
    ...(customPlaceholderText && {
      defaultPlaceholder: customPlaceholderText,
      mobilePlaceholder: customPlaceholderText,
    }),
  };

  const manager = new SearchWidgetIntegrationManager(config.defaultConfigId, config);

  const initializeWhenReady = async () => {
    await manager.initialize(block);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
  } else {
    initializeWhenReady();
  }
}
