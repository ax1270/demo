import { testFunction } from './test.js';
import { customCarouselDecorate } from './test2.js';
import { customcustomcarouselDecorate } from '../customcarousel/customcarousel.js';

export default function decorate(block) {
  // testFunction(block);
  customcustomcarouselDecorate(block);
}