export default function decorate(block) {
  // カルーセルの設定
  const config = {
    autoPlayInterval: 4000,
    slideSpeed: 600,
    slideWidth: 32, // 1枚あたりの幅（%）- カード幅30% + マージン2%
    visibleSlides: 3.2, // 表示するスライド数（3枚完全+1枚見切れ）
    bufferSets: 50, // 非常に大きなバッファで実質無限を実現
    minBuffer: 10, // 最小バッファ（セット数）
  };

  // レスポンシブ設定を追加
  function updateConfig() {
    if (window.innerWidth <= 768) {
      config.slideWidth = 74;
      config.visibleSlides = 1.2; // 1枚完全表示 + 2枚目が0.2分見切れ
    } else {
      config.slideWidth = 32;
      config.visibleSlides = 3.2;
    }
  }

  // 初期設定
  updateConfig();

  // リサイズ時に設定を更新
  window.addEventListener('resize', () => {
    updateConfig();
    showSlide(currentIndex, false);
  });

  let currentIndex = 0;
  let isPlaying = true;
  let currentButton = null;
  let startTime = null;
  let pausedTime = null;
  let isTransitioning = false;

  // SVGプログレスバーを作成
  function createProgressCircle() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const baseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('viewBox', '0 0 36 36');

    // ベースとなる灰色の円を設定
    baseCircle.setAttribute('cx', '18');
    baseCircle.setAttribute('cy', '18');
    baseCircle.setAttribute('r', '16');
    baseCircle.classList.add('base');

    // プログレス用の円を設定
    progressCircle.setAttribute('cx', '18');
    progressCircle.setAttribute('cy', '18');
    progressCircle.setAttribute('r', '16');
    progressCircle.classList.add('progress');

    svg.appendChild(baseCircle);
    svg.appendChild(progressCircle);
    return { svg, circle: progressCircle };
  }

  // プログレスバーの更新
  function updateProgress() {
    if (!isPlaying || !currentButton) return;

    const progressCircle = currentButton.querySelector('circle.progress');
    if (!progressCircle) return;

    const now = Date.now();
    const elapsed = startTime ? now - startTime : 0;
    const progress = Math.min((elapsed / config.autoPlayInterval) * 100, 100);

    progressCircle.style.strokeDasharray = `${progress} 100`;

    if (progress >= 100) {
      startTime = now;
      showSlide(currentIndex + 1);
    } else {
      requestAnimationFrame(updateProgress);
    }
  }

  // 元のコンテンツを処理
  const items = Array.from(block.children);
  if (items.length === 0) return;

  // カルーセル構造を作成
  const wrapper = document.createElement('div');
  wrapper.className = 'pickup-carousel-wrapper';

  const track = document.createElement('ul');
  track.className = 'pickup-carousel-track';

  // カルーセルアイテムを作成する関数
  function createCarouselItem(item) {
    // リンクを抽出
    const linkElement = item.querySelector('a');
    const linkUrl = linkElement ? linkElement.href : '#';

    // liタグでアイテムを囲む
    const listItem = document.createElement('li');

    // 全体をaタグで囲む
    const carouselItem = document.createElement('a');
    carouselItem.className = 'pickup-carousel-item';

    // URLが太字かどうかを判定してクラスを追加
    const isBoldUrl = linkElement && (
      linkElement.querySelector('strong')
      || linkElement.querySelector('b')
      || linkElement.parentElement?.querySelector('strong a')
      || linkElement.parentElement?.querySelector('b a')
    );

    if (isBoldUrl) {
      carouselItem.classList.add('text-hide');
    }

    carouselItem.href = linkUrl;
    carouselItem.target = '_blank';
    carouselItem.rel = 'noopener noreferrer';

    // タッチイベントでのリンク遷移を防止
    carouselItem.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      currentX = startX;
      isDragging = true;
      initialTranslateX = -(currentIndex * config.slideWidth);
      stopAutoPlay();
      track.style.transition = 'none';
    }, { passive: true });

    carouselItem.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      const translateX = initialTranslateX + (diffX / track.offsetWidth * 100);
      track.style.transform = `translateX(${translateX}%)`;
    }, { passive: false });

    carouselItem.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;

      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      const threshold = track.offsetWidth * 0.2;

      track.style.transition = `transform ${config.slideSpeed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

      if (Math.abs(diffX) > threshold && !isTransitioning) {
        if (diffX > 0) {
          showSlide(currentIndex + 1);
          e.preventDefault(); // リンク遷移を防止
        } else {
          showSlide(currentIndex - 1);
          e.preventDefault(); // リンク遷移を防止
        }
      } else {
        // 閾値を超えない場合は元の位置に戻す
        const translateX = -(currentIndex * config.slideWidth);
        track.style.transform = `translateX(${translateX}%)`;
      }

      // スワイプ操作が小さい場合はリンクを機能させる
      if (Math.abs(diffX) < 10) {
        return true;
      }
      e.preventDefault();

      // 一時停止ボタンが再生状態の場合のみ自動再生を再開
      const isPauseButton = pauseButton.querySelector('img[alt="一時停止"]');
      if (isPauseButton) {
        startAutoPlay();
      }
    }, { passive: false });

    // 画像を抽出
    const img = item.querySelector('img');
    if (img) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'image-wrapper';
      imageWrapper.style.backgroundImage = `url(${img.src})`;
      carouselItem.appendChild(imageWrapper);
    }

    // テキストコンテンツを作成
    const content = document.createElement('div');
    content.className = 'pickup-carousel-content';

    // カテゴリを抽出（斜体タグではないp要素から）
    let categoryText = '';
    const pElements = item.querySelectorAll('p');
    for (const p of pElements) {
      // 斜体タグ（em, i）を含まないp要素を探す
      if (!p.querySelector('em, i') && p.textContent.trim()) {
        categoryText = p.textContent.trim();
        break;
      }
    }

    const category = document.createElement('p');
    category.className = 'tag';
    // カテゴリーテキストが見つからない場合は要素を作成しない
    if (categoryText) {
      category.textContent = categoryText;
      content.appendChild(category);
    }

    // タイトルを抽出（h3要素のテキストを改行を保持して取得）
    const h3Element = item.querySelector('h3');
    let titleText = '';

    if (h3Element) {
      // HTMLの改行タグを実際の改行文字に変換
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = h3Element.innerHTML;

      // <br>タグを改行文字に変換
      tempDiv.querySelectorAll('br').forEach((br) => {
        br.replaceWith('\n');
      });

      titleText = tempDiv.textContent.trim();
    }

    const title = document.createElement('h3');
    title.className = 'title';
    title.textContent = titleText;

    // 詳細ボタンを作成
    const detailsButton = document.createElement('p');
    detailsButton.className = 'details-button';
    detailsButton.textContent = '詳しく見る';

    // コンテンツの上部にカテゴリ、下部にタイトルとボタン
    const bottomSection = document.createElement('div');
    bottomSection.appendChild(title);
    bottomSection.appendChild(detailsButton);

    content.appendChild(bottomSection);
    carouselItem.appendChild(content);

    listItem.appendChild(carouselItem);

    return listItem;
  }

  // 初期スライドの作成（非常に大きなバッファを確保）
  for (let i = 0; i < config.bufferSets; i += 1) {
    items.forEach((item) => {
      const carouselItem = createCarouselItem(item);
      track.appendChild(carouselItem);
    });
  }

  // 開始位置を中央に設定
  currentIndex = items.length * Math.floor(config.bufferSets / 2);

  // trackをwrapperに追加
  wrapper.appendChild(track);

  // ナビゲーションボタンを作成
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pickup-carousel-nav prev';
  prevBtn.setAttribute('aria-label', '前のスライド');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pickup-carousel-nav next';
  nextBtn.setAttribute('aria-label', '次のスライド');

  // インジケーターを作成
  const indicators = document.createElement('ol');
  indicators.className = 'pickup-carousel-indicators';

  items.forEach((_, idx) => {
    const li = document.createElement('li');
    li.className = 'pickup-carousel-indicator';
    const button = document.createElement('button');
    button.className = 'svg-button';
    button.setAttribute('aria-label', `スライド ${idx + 1}`);

    // インジケーターのクリックイベントを追加
    button.addEventListener('click', () => {
      if (!isTransitioning) {
        // 現在のactualIndexから目標のindexへの最短パスを計算
        const currentActualIndex = ((currentIndex % items.length) + items.length) % items.length;
        const targetIndex = idx;

        // 最短距離でスライドを移動
        let newIndex;
        const forward = (targetIndex - currentActualIndex + items.length) % items.length;
        const backward = (currentActualIndex - targetIndex + items.length) % items.length;

        if (forward <= backward) {
          // 前進する方が短い場合
          newIndex = currentIndex + forward;
        } else {
          // 後退する方が短い場合
          newIndex = currentIndex - backward;
        }

        showSlide(newIndex);
      }
    });

    li.appendChild(button);
    indicators.appendChild(li);
  });

  // 一時停止ボタンを作成
  const pauseButton = document.createElement('button');
  pauseButton.className = 'pause-button svg-button';
  pauseButton.innerHTML = '<img src="/business/icons/pause.svg" alt="一時停止">';
  indicators.appendChild(pauseButton);

  // スライドを切り替える関数
  function showSlide(index, animate = true) {
    if (isTransitioning) return;

    currentIndex = index;

    // スライドの位置を更新
    if (animate) {
      isTransitioning = true;
      track.style.transition = `transform ${config.slideSpeed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    } else {
      track.style.transition = 'none';
    }

    const translateX = -(currentIndex * config.slideWidth);
    track.style.transform = `translateX(${translateX}%)`;

    // アニメーション完了後の処理
    if (animate) {
      const handleTransitionEnd = () => {
        isTransitioning = false;
        track.removeEventListener('transitionend', handleTransitionEnd);
        // バッファ補充は非同期で行い、ユーザーに見せない
        setTimeout(checkAndMaintainBuffer, 0);
      };
      track.addEventListener('transitionend', handleTransitionEnd, { once: true });
    } else {
      setTimeout(checkAndMaintainBuffer, 0);
    }

    // インジケーターの更新
    const actualIndex = ((currentIndex % items.length) + items.length) % items.length;
    updateIndicators(actualIndex);
  }

  // バッファを維持する関数（よりアグレッシブに）
  function checkAndMaintainBuffer() {
    const totalSlides = track.children.length;
    const currentSet = Math.floor(currentIndex / items.length);
    const totalSets = Math.floor(totalSlides / items.length);

    const remainingLeftSets = currentSet;
    const remainingRightSets = totalSets - currentSet - 1;

    // 右側のバッファが不足している場合（早めに補充）
    if (remainingRightSets < config.minBuffer) {
      const setsToAdd = config.minBuffer * 2; // より多く追加
      for (let i = 0; i < setsToAdd; i += 1) {
        items.forEach((item) => {
          const carouselItem = createCarouselItem(item);
          track.appendChild(carouselItem);
        });
      }
    }

    // 左側のバッファが不足している場合（早めに補充）
    if (remainingLeftSets < config.minBuffer) {
      const setsToAdd = config.minBuffer * 2; // より多く追加
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < setsToAdd; i += 1) {
        items.forEach((item) => {
          const carouselItem = createCarouselItem(item);
          fragment.appendChild(carouselItem);
        });
      }

      // 位置調整をユーザーに見せないように実行
      track.style.transition = 'none';
      track.insertBefore(fragment, track.firstChild);

      // インデックスを調整
      const repositionOffset = setsToAdd * items.length;
      currentIndex += repositionOffset;

      // 新しい位置を即座に適用
      const translateX = -(currentIndex * config.slideWidth);
      track.style.transform = `translateX(${translateX}%)`;

      // 次のフレームでトランジションを復活（ユーザーには見えない）
      requestAnimationFrame(() => {
        track.style.transition = `transform ${config.slideSpeed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      });
    }
  }

  // インジケーターを更新する関数
  function updateIndicators(actualIndex) {
    const buttons = indicators.querySelectorAll('.pickup-carousel-indicator button');
    buttons.forEach((button, idx) => {
      if (idx === actualIndex) {
        if (currentButton) {
          currentButton.removeAttribute('disabled');
          const oldSvg = currentButton.querySelector('svg');
          if (oldSvg) oldSvg.remove();
        }

        button.setAttribute('disabled', 'true');
        const { svg, circle } = createProgressCircle();
        button.appendChild(svg);
        currentButton = button;

        circle.style.strokeDasharray = '0 100';

        // プログレスバーを0%にリセットした場合、pausedTimeもリセット
        if (!isPlaying) {
          pausedTime = null;
        }

        if (isPlaying) {
          startTime = Date.now();
          requestAnimationFrame(updateProgress);
        }
      } else {
        button.removeAttribute('disabled');
        const svg = button.querySelector('svg');
        if (svg) svg.remove();
      }
    });
  }

  // 自動再生の制御
  function startAutoPlay() {
    if (!isPlaying) {
      isPlaying = true;
      startTime = Date.now();
      if (pausedTime) {
        startTime -= pausedTime;
        pausedTime = null;
      }
      requestAnimationFrame(updateProgress);
    }
  }

  function stopAutoPlay() {
    if (isPlaying) {
      isPlaying = false;
      pausedTime = Date.now() - startTime;
      startTime = null;
    }
  }

  // イベントリスナーを設定
  prevBtn.addEventListener('click', () => {
    if (!isTransitioning) {
      showSlide(currentIndex - 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!isTransitioning) {
      showSlide(currentIndex + 1);
    }
  });

  // 一時停止ボタンのクリックイベント
  pauseButton.addEventListener('click', () => {
    if (isPlaying) {
      stopAutoPlay();
      pauseButton.innerHTML = '<img src="/business/icons/play.svg" alt="再生">';
    } else {
      startAutoPlay();
      pauseButton.innerHTML = '<img src="/business/icons/pause.svg" alt="一時停止">';
    }
  });

  // タッチイベントの処理
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  let initialTranslateX = 0;

  // DOMを構築
  block.textContent = '';

  // カルーセル全体のコンテナ
  const container = document.createElement('div');
  container.className = 'pickup-carousel';

  // カルーセルコンテンツ用のラッパー
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'pickup-carousel-content-wrapper';

  // overflow: hiddenを持つ内側のラッパー
  const innerWrapper = document.createElement('div');
  innerWrapper.className = 'pickup-carousel-inner';

  // 構造を組み立て
  innerWrapper.appendChild(track);
  contentWrapper.appendChild(innerWrapper);
  container.appendChild(contentWrapper);

  // ナビゲーションボタンをcontainerに直接追加
  container.appendChild(prevBtn);
  container.appendChild(nextBtn);

  // 全体をblockに追加
  block.appendChild(container);
  block.appendChild(indicators);

  // 初期化
  showSlide(currentIndex, false);
  startAutoPlay();
}
