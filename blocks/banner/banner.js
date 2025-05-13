import { testFunction } from './test.js';

export default async function decorate(block) {
  block.setAttribute('id', `aaaa`);
  testFunction(block);
}