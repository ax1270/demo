import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders('jp');
  const { ecConversionHeadline } = placeholders;
  const { ecConversionTextline } = placeholders;

  // 見出しエリア
  const headlineArea = document.createElement('div');
  headlineArea.classList.add('headline-area-class');

  const h5 = document.createElement('h5');
  h5.append(ecConversionHeadline);

  headlineArea.append(h5);

  // テキストエリア
  const textlineArea = document.createElement('div');
  textlineArea.classList.add('textline-area-class');

  const p = document.createElement('p');
  p.append(ecConversionTextline);

  textlineArea.append(p);


  // DOM構造生成
  block.append(headlineArea);

  // 製品情報リスト取得
  const source = '/product-data.json';
  const productData = await fetchData({ source, placeholders }.source);
  // var obj = JSON.parse(productData.data);

  // 製品情報ID取得
  const productId = getMetadata('productid');

  // 製品情報リストでループ
  productData.data.forEach(element => {

    // 製品IDが一致する場合のみボタンエリアを作成
    if (element["JAN Code"] === productId) {

      const buttonArea = document.createElement('div');
      buttonArea.classList.add('div-container');

      // 楽天ボタンリンクあり
      if (element["Rakuten Link"] !== "") {
        const button = createButton('Rakuten', element["Rakuten Link"]);
        buttonArea.append(button);
      }

      // Lohacoボタンリンクあり
      if (element["Lohaco Link"] !== "") {
        const button = createButton('LOHACO', element["Lohaco Link"]);
        buttonArea.append(button);
      }

      // amazonボタンリンクあり
      if (element["Amazon Link"] !== "") {
        const button = createButton('Amazon', element["Amazon Link"]);
        buttonArea.append(button);
      }

      // DOM構造生成
      block.append(buttonArea);
    }
  });

  // DOM構造生成
  block.append(textlineArea);
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