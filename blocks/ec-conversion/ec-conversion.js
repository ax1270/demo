import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();

  // 製品情報ID
  const productId = getMetadata('productid');

  // 製品情報リスト
  const source = '/product-info.json';
  const data = await fetchData({ source, placeholders }.source);

  block.setAttribute('id', `testId`);

  if (getMetadata('productid') === "1111") {
    const container = document.createElement('div');
    container.classList.add('testClass');
    container.append(`cccc`);
    block.prepend(container);
  }
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