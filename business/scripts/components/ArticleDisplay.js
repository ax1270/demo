/**
 * 記事表示コンポーネント
 */

import AccordionBuilder from '../classes/AccordionBuilder.js';
import { createOptimizedPicture } from '../aem.js';

export default class ArticleDisplay {
  constructor(container, groupedTags, extractedData) {
    this.container = container;
    this.groupedTags = groupedTags;
    this.extractedData = extractedData;
    this.currentIndex = 0;
    this.itemsPerPage = 9;
    this.filteredData = [...extractedData];
    this.tagContainer = document.createElement('div');
    this.tagContainer.className = 'tag-container';
  }

  static createInitialStructure() {
    return `
      <div class="articleCards-wrapper">
        <div class="articleCards" >
          <ul class="articleCards-list"></ul>
        </div>
      </div>
      <div class="load-more-container">
        <button class="load-more-button">もっと見る</button>
      </div>
    `;
  }

  async initialize() {
    this.createTagCheckboxes();
    this.container.innerHTML = ArticleDisplay.createInitialStructure();

    // アコーディオンの作成と追加
    const accordion = new AccordionBuilder(
      'キーワードから探す',
      this.tagContainer,
      true,
    ).build();

    // アコーディオンをp-index-contentに追加
    document.querySelector('.p-index-content').insertBefore(
      accordion,
      document.querySelector('.p-index-content').firstChild,
    );

    this.displayItems(this.currentIndex);
    this.updateLoadMoreButton();

    // 記事件数を表示するDOMを作成
    this.updateArticleCount(this.extractedData.length); // 初期値として全件数を表示

    const loadMoreButton = this.container.querySelector('.load-more-button');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', async () => {
        this.displayItems(this.currentIndex);
      });
    }
  }

  createTagCheckboxes() {
    Object.entries(this.groupedTags).forEach(([groupName, tags]) => {
      const groupItem = document.createElement('div');
      const groupContainer = document.createElement('div');
      groupContainer.className = 'tag-group';
      groupItem.className = 'tag-group-item';

      const groupTitle = document.createElement('h3');
      groupTitle.className = 'tag-group-title';
      groupTitle.textContent = groupName;
      groupItem.appendChild(groupTitle);

      const tagList = document.createElement('ul');
      tagList.className = 'tag-list';

      tags.forEach((tag) => {
        const checkboxWrapper = document.createElement('li');
        checkboxWrapper.className = 'checkbox-wrapper';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${groupName}-${tag}`;
        checkbox.value = tag;
        checkbox.dataset.group = groupName;

        const label = document.createElement('label');
        label.htmlFor = `${groupName}-${tag}`;
        label.textContent = tag;
        label.className = 'tag-label';

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        tagList.appendChild(checkboxWrapper);
      });

      groupItem.appendChild(tagList);
      groupContainer.appendChild(groupItem);
      this.tagContainer.appendChild(groupContainer);
    });

    // チェックボックスの変更イベントを一括で設定
    this.tagContainer.addEventListener('change', () => {
      this.filterArticles();
    });
  }

  /**
   * 選択されたタグに基づいて記事をフィルタリングする
   */
  filterArticles() {
    const selectedTagsByGroup = this.getSelectedTagsByGroup();
    this.filteredData = ArticleDisplay.filterDataByTags(this.extractedData, selectedTagsByGroup);
    this.updateDisplayAfterFiltering();
  }

  /**
   * 各グループで選択されているタグを取得する
   * @returns {Object} グループ名をキーとし、選択されたタグの配列を値とするオブジェクト
   */
  getSelectedTagsByGroup() {
    return Object.keys(this.groupedTags).reduce((acc, group) => {
      const checkboxes = this.tagContainer.querySelectorAll(`input[data-group="${group}"]:checked`);
      acc[group] = Array.from(checkboxes).map((cb) => cb.value);
      return acc;
    }, {});
  }

  /**
   * 記事データを選択されたタグでフィルタリングする
   * @param {Array} target - フィルタリング対象の記事データ配列
   * @param {Object} selectedTagsByGroup - グループごとの選択されたタグ
   * @returns {Array} フィルタリングされた記事データ配列
   */
  static filterDataByTags(data, selectedTagsByGroup) {
    const target = data;
    return target.filter((item) => {
      // 各グループのタグ選択状態をチェック
      const isItemValid = Object.entries(selectedTagsByGroup).every(([_, selectedTags]) => {
        // タグが選択されていない場合は true
        if (selectedTags.length === 0) return true;

        // 選択されたタグのいずれかが記事のタグに含まれているかチェック
        return selectedTags.some((tag) => item.tags.includes(tag));
      });

      return isItemValid;
    });
  }

  /**
   * フィルタリング後の表示を更新する
   */
  updateDisplayAfterFiltering() {
    this.updateArticleCount(this.filteredData.length);
    this.currentIndex = 0;
    const articleCardsList = this.container.querySelector('.articleCards-list');
    if (articleCardsList) {
      articleCardsList.innerHTML = '';
      this.displayItems(this.currentIndex);
      this.updateLoadMoreButton();
    }
  }

  /**
   * 記事件数の表示を更新する
   * @param {number} count - 表示する記事の件数
   */
  updateArticleCount(count) {
    const articleCountClass = 'article-count';
    const articleCountNumClass = 'article-count-num';
    const articleCountText = `該当する記事<span class="${articleCountNumClass}">${count}</span>件（新着順）`;
    const articleCountElement = this.container.querySelector(`.${articleCountClass}`);

    if (articleCountElement) {
      articleCountElement.innerHTML = articleCountText;
    } else {
      const newCountElement = document.createElement('div');
      newCountElement.className = articleCountClass;
      newCountElement.innerHTML = articleCountText;
      this.container.querySelector('.articleCards').insertBefore(
        newCountElement,
        this.container.querySelector('.articleCards-list'),
      );
    }
  }

  static createCardElement(data) {
    return `
      <li class="articleCards-card-item">
        <a href="${data.path}" class="articleCards-card-link">
          <div class="articleCards-card-image">
            ${createOptimizedPicture(data.imagePath, data.title, false, [{ width: '600' }]).outerHTML}
          </div>
          <div class="articleCards-card-body">
            <div class="articleCards-card-date">
              <p>${data.lastModified}</p>
            </div>
            <div class="articleCards-card-title">
              <p id="${data.title.replace(/\s+/g, '-')}">${data.title}</p>
            </div>
            ${data.tags.length ? `
              <div class="articleCards-card-tags">
                <ul class="articleCards-card-tags-list">
                  ${data.tags.map((tag) => `<li class="articleCards-card-tag">${tag}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </a>
      </li>
    `;
  }

  displayItems(startIndex) {
    const articleCardsList = this.container.querySelector('.articleCards-list');
    if (!articleCardsList) return;

    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
    const newCards = this.filteredData
      .slice(startIndex, endIndex)
      .map((data) => ArticleDisplay.createCardElement(data))
      .join('');

    articleCardsList.insertAdjacentHTML('beforeend', newCards);
    this.currentIndex = endIndex;
    this.updateLoadMoreButton();
  }

  updateLoadMoreButton() {
    const loadMoreButton = this.container.querySelector('.load-more-button');
    if (loadMoreButton) {
      if (this.currentIndex >= this.filteredData.length) {
        loadMoreButton.style.display = 'none';
      } else {
        loadMoreButton.style.display = 'flex';
      }
    }
  }
}
