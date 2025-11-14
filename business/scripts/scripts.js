/**
 * メインスクリプトファイル - 分割されたモジュールの統合ポイント
 *
 * このファイルは各機能モジュールをインポートし、ページロード処理を開始します。
 * 機能ごとに分割されたモジュールを適切に統合して実行タイミングを維持します。
 */

// 分割されたモジュールをインポート
import { loadPage } from './core/lifecycle.js';

// エクスポートされた関数を再エクスポート（外部からのアクセス用）
export { decorateButtonsForBlocks } from './utils/buttons.js';
export { default as buildBreadcrumbs } from './utils/breadcrumbs.js';
export { default as decorateMain } from './core/decorateMain.js';

// メインのページロード処理を実行
loadPage();
