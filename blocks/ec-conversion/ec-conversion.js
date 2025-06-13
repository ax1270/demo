import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();

  // 見出しエリア
  const headlineArea = block.firstElementChild;
  headlineArea.classList.add('headline-area-class');

  // テキストエリア
  const textlineArea = block.lastElementChild;
  textlineArea.classList.add('textline-area-class');


  // ID付与してみる
  block.setAttribute('id', `testId`);

  // 製品情報ID取得
  const productId = getMetadata('productid');

  // 製品情報リスト取得
  const source = '/product-info.json';
  const data = await fetchData({ source, placeholders }.source);

  // 製品情報リストでループ
  data.forEach(element => {

    // 製品IDが一致する場合のみボタンを追加
    if (element.productId === productId) {

      const div = document.createElement('div');
      div.classList.add('div-container');

      // 楽天ボタンリンクあり
      if (element.rakuten !== "") {
        const button = createButton('楽天', element.rakuten);
        div.append(button);
      }

      // Lohacoボタンリンクあり
      if (element.lohaco !== "") {
        const button = createButton('Lohaco', element.lohaco);
        div.append(button);
      }

      // amazonボタンリンクあり
      if (element.amazon !== "") {
        const button = createButton('Amazon', element.amazon);
        div.append(button);
      }

      headlineArea.after(div);
    }
  });
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
  button.classList.add('button');
  button.append(buttonName);

  p.append(button);

  return p;
}