import { getMetadata } from '../../scripts/aem.js';

export default function decorate(block) {
  // 製品情報ID
  const productId = getMetadata('Productid');

  // 製品情報リスト
  const productList = '/product-info.json';

  block.setAttribute('id', `testId`);

  if (getMetadata('productid') === "1111") {
    const container = document.createElement('div');
    container.classList.add('testClass');
    container.append(`cccc`);
    block.prepend(container);
  }
}