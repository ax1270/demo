import { fetchCarousel } from '../../blocks/carousel/carousel.js';
import { fetchTest } from '../../scripts/test.js';

export default function decorate(block) {
  fetchCarousel;
  fetchTest.testFunction(block);
}