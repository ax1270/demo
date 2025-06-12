import { productInfo } from 'product-info.json';

export default function decorate(block) {
  const tag = block.querySelectorAll('.ec-conversion');
  const productId = getMetadata('productId');
  tag.append(document.createTextNode('製品情報ID'), document.createElement('div'), productId);
}