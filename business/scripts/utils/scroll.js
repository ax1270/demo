/**
 * スムーススクロール関連のユーティリティ関数
 *
 * URL直接遷移とアンカーリンククリック時のスクロール位置の一貫性を保ち、
 * ナビゲーション状態（fixed/通常）に関係なく適切なスクロール位置を計算します。
 */

/**
 * スクロール設定定数
 */
const SCROLL_CONFIG = {
  // レスポンシブ判定のブレークポイント
  MOBILE_BREAKPOINT: 768,

  // ヘッダー高さのフォールバック値（デバイス別）
  HEADER_HEIGHT: {
    MOBILE: 58,
    DESKTOP: 75,
    SMB_MOBILE: 55,
  },

  // スクロール実行時の待機時間（ms）
  DELAY: {
    MOBILE_LAYOUT_WAIT: 400, // モバイル：レイアウト安定化待機
    DESKTOP_LAYOUT_WAIT: 100, // PC：レイアウト安定化待機
    IMAGE_LOAD_WAIT: 200, // 画像読み込み待機
    ANCHOR_EXECUTION: 50, // アンカーリンク実行待機
  },

  // スクロールマージン（px）
  MARGIN: {
    MOBILE: 20,
    DESKTOP: 40,
  },

  // スクロール実行管理
  EXECUTION_TIMEOUT: 1000, // 実行タイムアウト
  MIN_BODY_PADDING_FOR_HEADER: 50, // ヘッダー分の最小body padding
};

/**
 * スクロール実行状態管理
 * 重複実行を防ぎ、実行IDで管理します
 */
const scrollExecutionState = {
  isExecuting: false, // 実行中フラグ
  targetId: null, // 現在のターゲットID
  currentExecutionId: 0, // 現在の実行ID
};

/**
 * デバイス判定ユーティリティ（キャッシュ付き）
 * パフォーマンス向上のため、デバイス判定結果をキャッシュします
 * @returns {boolean} モバイルデバイスかどうか
 */
let deviceCache = null;

function isMobileDevice() {
  if (deviceCache === null) {
    deviceCache = window.innerWidth <= SCROLL_CONFIG.MOBILE_BREAKPOINT;
  }
  return deviceCache;
}

/**
 * デバイス判定キャッシュをリセット
 * リサイズ時やナビゲーション状態変化時に呼び出されます
 */
function resetDeviceCache() {
  deviceCache = null;
}

/**
 * ヘッダーの高さを取得する
 *
 * URL直接遷移とアンカーリンククリック時で一貫したヘッダー高さを計算します。
 * ナビゲーション状態（fixed/通常）に関係なく適切な高さを取得します。
 *
 * @param {boolean} forceRecalculate - 強制再計算フラグ（未使用、将来の拡張用）
 * @returns {number} ヘッダーの高さ（px）
 */
// eslint-disable-next-line no-unused-vars
function getHeaderHeight(forceRecalculate = false) {
  const isMobile = isMobileDevice();

  /**
   * 統一されたヘッダー検出ロジック
   * 固定状態と通常状態の両方に対応します
   */
  const getUnifiedHeaderHeight = () => {
    // 1. 固定されたナビゲーション要素を優先検出
    const fixedSelectors = [
      '.nav-wrapper.is-fixed',
      '.nav-wrapper[style*="position: fixed"]',
      'header[style*="position: fixed"]',
      'nav[style*="position: fixed"]',
      '.header[style*="position: fixed"]',
      '.global-nav[style*="position: fixed"]',
      '.main-nav[style*="position: fixed"]',
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const selector of fixedSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        // 固定されていて表示されている場合
        if (computedStyle.position === 'fixed'
            && computedStyle.display !== 'none'
            && rect.height > 0) {
          return Math.ceil(rect.height);
        }
      }
    }

    // 2. 通常のナビゲーション要素（固定ではないが上部に配置）
    const navSelectors = [
      '.global-nav',
      '.main-nav',
      '#global-nav',
      '#main-nav',
      '.nav-wrapper',
      'nav#nav',
      '.header',
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const selector of navSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        // 上部に配置されていて表示されている場合
        if (rect.top <= 10 && rect.height > 0 && computedStyle.display !== 'none') {
          return Math.ceil(rect.height);
        }
      }
    }

    // 3. body padding-topをチェック（ヘッダー分の余白として設定されている場合）
    const bodyPadding = parseInt(window.getComputedStyle(document.body).paddingTop, 10);
    if (bodyPadding >= SCROLL_CONFIG.MIN_BODY_PADDING_FOR_HEADER) {
      return bodyPadding;
    }

    return null;
  };

  // 統一されたヘッダー高さを取得
  const unifiedHeight = getUnifiedHeaderHeight();
  if (unifiedHeight !== null) {
    return unifiedHeight;
  }

  // フォールバック値（デバイス別）
  return isMobile ? SCROLL_CONFIG.HEADER_HEIGHT.MOBILE : SCROLL_CONFIG.HEADER_HEIGHT.DESKTOP;
}

/**
 * 指定された要素にスムーススクロールを実行
 *
 * ヘッダー高さを考慮した適切なスクロール位置に移動します。
 * 重複実行を防ぎ、デバイス別の最適化を行います。
 *
 * @param {string} targetId - 対象要素のID
 * @param {number|null} executionId - 実行ID（重複防止用、省略可能）
 */
export function smoothScrollToElement(targetId, executionId = null) {
  const element = document.getElementById(targetId);
  if (!element) return;

  // 重複実行防止チェック
  if (executionId && scrollExecutionState.currentExecutionId !== executionId) {
    return; // 古い実行IDの場合はキャンセル
  }

  // 重複実行防止：実行中フラグをチェック
  if (scrollExecutionState.isExecuting && scrollExecutionState.targetId === targetId) {
    return;
  }

  // デバイス判定とマージン設定（一度だけ実行）
  const isMobile = isMobileDevice();
  const margin = isMobile
    ? SCROLL_CONFIG.MARGIN.MOBILE
    : SCROLL_CONFIG.MARGIN.DESKTOP;
  const delay = isMobile
    ? SCROLL_CONFIG.DELAY.MOBILE_LAYOUT_WAIT
    : SCROLL_CONFIG.DELAY.DESKTOP_LAYOUT_WAIT;

  /**
   * スクロール実行処理
   * ヘッダー高さとマージンを考慮した位置にスクロールします
   */
  const performScroll = () => {
    scrollExecutionState.isExecuting = true;
    scrollExecutionState.targetId = targetId;

    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top + window.pageYOffset;
    const headerHeight = getHeaderHeight();
    const targetPosition = elementTop - headerHeight - margin;

    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior: 'smooth',
    });

    // スクロール完了後にフラグをリセット
    setTimeout(() => {
      scrollExecutionState.isExecuting = false;
      scrollExecutionState.targetId = null;
    }, SCROLL_CONFIG.EXECUTION_TIMEOUT);
  };

  // 統合された待機処理
  setTimeout(() => {
    const currentPosition = element.getBoundingClientRect().top + window.pageYOffset;
    if (currentPosition > 0) {
      performScroll();
    }
  }, delay);
}

/**
 * ターゲット要素を検索（URLデコード対応）
 *
 * 日本語IDやURLエンコードされたIDに対応し、
 * 効率的な順序で要素を検索します。
 *
 * @param {string} targetId - 対象要素のID
 * @returns {Element|null} 見つかった要素またはnull
 */
function findTargetElement(targetId) {
  // URLエンコードされた日本語IDをデコード
  const decodedTargetId = decodeURIComponent(targetId);

  // 要素を検索（効率的な順序で検索）
  return document.getElementById(decodedTargetId) // デコードIDで検索
         || document.getElementById(targetId) // 元のIDで検索
         || document.querySelector(`[id*="${decodedTargetId}"]`) // 部分一致（ID）
         || document.querySelector(`[class*="${decodedTargetId}"]`) // 部分一致（クラス）
         || document.querySelector(`[data-id*="${decodedTargetId}"]`); // 部分一致（data-id）
}

/**
 * アンカーリンクを確実にスクロールする
 *
 * URL直接遷移とアンカーリンククリック時で一貫したスクロール処理を実行します。
 * デバイス別の最適化と画像読み込み状態の考慮を行います。
 *
 * @param {string} targetId - 対象要素のID
 * @param {boolean} isDirectNavigation - URL直接遷移かどうか
 */
export function handleAnchorLink(targetId, isDirectNavigation = false) {
  if (!targetId) return;

  // 実行ID生成（重複防止用）
  scrollExecutionState.currentExecutionId += 1;
  const { currentExecutionId } = scrollExecutionState;

  // 既に同じターゲットで実行中の場合はキャンセル
  if (scrollExecutionState.isExecuting && scrollExecutionState.targetId === targetId) {
    return;
  }

  // 対象要素を検索
  const targetElement = findTargetElement(targetId);
  if (!targetElement) return;

  const isMobile = isMobileDevice();
  const decodedTargetId = decodeURIComponent(targetId);

  /**
   * 統一された実行処理
   * 実行IDをチェックして重複実行を防止します
   */
  const executeScroll = () => {
    if (scrollExecutionState.currentExecutionId === currentExecutionId) {
      smoothScrollToElement(decodedTargetId, currentExecutionId);
    }
  };

  /**
   * 統一された待機処理
   * URL直接遷移とクリック時で同じロジックを使用します
   */
  const getUnifiedDelay = () => {
    if (isMobile) {
      // スマホ時：画像読み込み状態チェック
      const images = Array.from(document.querySelectorAll('img'));
      const unloadedImages = images.filter((img) => !img.complete || img.naturalHeight === 0);

      if (unloadedImages.length === 0) {
        return 0; // 即座に実行
      }
      return SCROLL_CONFIG.DELAY.IMAGE_LOAD_WAIT;
    }
    // PC時：固定ヘッダーとレイアウトの安定化を確実に待つ
    return isDirectNavigation
      ? SCROLL_CONFIG.DELAY.DESKTOP_LAYOUT_WAIT
      : SCROLL_CONFIG.DELAY.ANCHOR_EXECUTION;
  };

  const delay = getUnifiedDelay();

  if (delay === 0) {
    executeScroll();
  } else {
    setTimeout(executeScroll, delay);
  }
}

/**
 * ページ内リンクのスムーススクロール設定
 *
 * アンカーリンクにスムーススクロール機能を設定します。
 * 同一ページ内のアンカーリンクのみを対象とし、効率的に処理します。
 *
 * @param {Element} element - コンテナ要素
 */
export function setupSmoothScroll(element) {
  // アンカーリンクを含むリンクを検索（効率的なフィルタリング）
  const anchorLinks = Array.from(element.querySelectorAll('a[href*="#"]'));

  anchorLinks.forEach((a) => {
    const hrefAttr = a.getAttribute('href') || '';

    // 同一ページ内アンカーかどうかを判定（最適化）
    let isAnchorLink = hrefAttr.startsWith('#');
    if (!isAnchorLink) {
      try {
        const url = new URL(hrefAttr, window.location.href);
        isAnchorLink = url.pathname === window.location.pathname && !!url.hash;
      } catch (e) {
        isAnchorLink = false;
      }
    }

    if (!isAnchorLink) return;

    a.classList.add('button-anchor-link');

    /**
     * スムーススクロール機能を設定
     * デフォルトのアンカーリンク動作を無効化し、カスタムスクロールを実行
     */
    a.onclick = (e) => {
      e.preventDefault();
      const hash = hrefAttr.slice(hrefAttr.indexOf('#') + 1);
      const targetId = decodeURIComponent(hash);

      handleAnchorLink(targetId);

      // URLを更新（ブラウザの履歴に追加）
      // eslint-disable-next-line no-restricted-globals
      window.history.pushState(null, '', `#${encodeURIComponent(targetId)}`);
    };
  });
}

/**
 * ナビゲーション状態の変化を監視してヘッダー高さを再計算
 *
 * スクロール時にナビゲーションのfixed状態が変化した場合、
 * デバイス判定キャッシュをリセットして適切なヘッダー高さを再計算します。
 */
function setupNavigationStateWatcher() {
  // eslint-disable-next-line no-unused-vars
  let lastScrollY = window.scrollY;
  let isNavigationFixed = false;

  /**
   * ナビゲーション状態をチェック
   * 状態変化時にデバイス判定キャッシュをリセットします
   */
  const checkNavigationState = () => {
    const currentScrollY = window.scrollY;
    const navWrapper = document.querySelector('.nav-wrapper');

    if (navWrapper) {
      const isCurrentlyFixed = navWrapper.classList.contains('is-fixed')
                               || window.getComputedStyle(navWrapper).position === 'fixed';

      // ナビゲーション状態が変化した場合、デバイス判定キャッシュをリセット
      if (isCurrentlyFixed !== isNavigationFixed) {
        isNavigationFixed = isCurrentlyFixed;
        resetDeviceCache();
      }
    }

    lastScrollY = currentScrollY;
  };

  // スクロール時の状態チェック（throttle付き）
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(checkNavigationState, 100);
  });

  // リサイズ時の状態チェック
  window.addEventListener('resize', () => {
    resetDeviceCache();
    checkNavigationState();
  });
}

// ナビゲーション状態監視の初期化
setupNavigationStateWatcher();
