import { productInfo } from 'product-info.json';

export default function decorate(block) {
  block.classList.add(`ec-conversion`);
  const productId = getMetadata('productId');
  block.append("<div>" + productId + "</div>");
}
