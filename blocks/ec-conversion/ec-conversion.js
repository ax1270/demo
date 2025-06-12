import { productInfo } from 'product-info.json';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`ec-conversion`);

  block.add("<div>" + productInfo + "</div>");
}
