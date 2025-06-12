import { productInfo } from 'product-info.json';

export default function decorate(block) {
  block.classList.add(`ec-conversion`);
  block.append("<div>" + productInfo + "</div>");
}
