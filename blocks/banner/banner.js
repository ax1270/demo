import { testFunction } from './test.js';
import { customCarouselDecorate } from './test2.js';
import { customcustomcarouselDecorate } from '../customcarousel/customcarousel.js';
import { aaa } from '../carousel/carousel.js';

export default function decorate(block) {
  // testFunction(block);
  aaa(block);
}