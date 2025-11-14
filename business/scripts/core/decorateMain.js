/**
 * メイン装飾機能の統合
 */

import {
  decorateIcons,
  decorateSections,
  decorateBlocks,
} from '../aem.js';

import { decorateButtonsForBlocks } from '../utils/buttons.js';
import { setupSmoothScroll } from '../utils/scroll.js';
import {
  processSectionBackgroundColor, processCaptionLists, processPointSections, addFileIcons,
} from '../utils/sections.js';

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
function decorateMain(main) {
  // ボタン装飾（text-link, primary, secondary, tertiaryを含む）
  decorateButtonsForBlocks(main);
  // PDFリンクとZIPリンクにアイコンを追加（ボタン装飾の後に実行）
  addFileIcons(main);
  // ページ内リンクのスムーススクロールを設定
  setupSmoothScroll(main);
  // リスト内のcodeタグを処理してcaptionクラスを追加
  processCaptionLists(main);
  decorateIcons(main);
  // buildAutoBlocks(main);
  decorateSections(main);
  // data-background-color属性を持つsectionの背景色処理
  processSectionBackgroundColor(main);
  // ブロックの装飾を実行（この中で各ブロックが再度decorateButtonsForBlocksを呼び出すが、スキップ処理により二重装飾は防止される）
  decorateBlocks(main);
  // data-section-type="point"を持つsectionを処理（decorateBlocksの後）
  processPointSections(main);
}

export default decorateMain;
