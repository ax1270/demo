import { testFunction } from './test.js';
import { customDecorate } from './test2.js';

export default function decorate(block) {
  testFunction(block);
  customDecorate(block);
}