import { getMetadata, wrapTextNodes } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders('jp');
  const { ecConversionOnlileStoreButtonName } = placeholders;
  const { ecConversionText } = placeholders;

  // 見出しエリア
  const headlineArea = document.createElement('h5');
  // headlineArea.classList.add('headline-area-class');
  headlineArea.append(ecConversionOnlileStoreButtonName);

  // テキストエリア
  const textlineArea = document.createElement('p');
  // textlineArea.classList.add('textline-area-class');
  textlineArea.append(ecConversionText);

  // DOM構造生成
  block.append(headlineArea);

  // 製品情報リスト取得
  const source = '/product-info.json';
  const data = await fetchData({ source, placeholders }.source);

  // 製品情報ID取得
  const productId = getMetadata('productid');

  // 製品情報リストでループ
  data.forEach(element => {

    // 製品IDが一致する場合のみボタンエリアを作成
    if (element.productId === productId) {

      const buttonArea = document.createElement('div');
      buttonArea.classList.add('div-container');

      // 楽天ボタンリンクあり
      if (element.rakuten !== "") {
        const button = createButton('Rakuten', element.rakuten);
        buttonArea.append(button);
      }

      // Lohacoボタンリンクあり
      if (element.lohaco !== "") {
        const button = createButton('LOHACO', element.lohaco);
        buttonArea.append(button);
      }

      // amazonボタンリンクあり
      if (element.amazon !== "") {
        const button = createButton('Amazon', element.amazon);
        buttonArea.append(button);
      }

      // DOM構造生成
      block.append(buttonArea);
    }
  });

  // DOM構造生成
  block.append(textlineArea);


  // 見出しエリア
  wrapTextNodes(block);
}


export async function fetchData(source) {
  const response = await fetch(source);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading API response', response);
    return null;
  }

  const json = await response.json();
  if (!json) {
    // eslint-disable-next-line no-console
    console.error('empty API response', source);
    return null;
  }

  return json.data;
}


function createButton(buttonName, url) {
  // 親
  const p = document.createElement('p');
  p.classList.add('ec-button-class');

  // 子
  const button = document.createElement('a');
  button.setAttribute("href", url);

  // 新規タブで開く設定
  button.setAttribute("target", "_blank");
  button.classList.add('button');
  button.append(buttonName);

  p.append(button);

  return p;
}