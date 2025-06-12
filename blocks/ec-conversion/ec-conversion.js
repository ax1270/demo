import { getMetadata } from '../../scripts/aem.js';

export default function decorate(block) {
  const productId = getMetadata('ProductId');

  block.setAttribute('id', `testId`);

  const container = document.createElement('div');
  container.classList.add('testClass');
  container.append(`aaaaaaaaa`);

  if (getMetadata('ProductId') === 1111) {
    block.prepend(container);
  }
}