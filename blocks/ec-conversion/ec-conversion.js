import { getMetadata } from '../../scripts/aem.js';

export default function decorate(block) {
  const productId = getMetadata('ProductId');

  block.setAttribute('id', `testId`);

  if (getMetadata('productId') === "1111") {
    const container = document.createElement('div');
    container.classList.add('testClass');
    container.append(`bbbbb`);
    block.prepend(container);
  }
}