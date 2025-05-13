import { testFunction } from './test.js';
import { decorate } from '../carousel/carousel.js';

export default function decorate(block) {
  testFunction(block);
  decorate(block);
}