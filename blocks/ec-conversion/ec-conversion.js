import { productInfo } from 'product-info.json';

export default function decorate(block) {
  const productId = getMetadata('productid ');
  block.setAttribute('id', productId);
//   tag.append(document.createTextNode('製品情報ID'), document.createElement('div'), productId);
}