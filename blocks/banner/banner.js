import { aaa } from './test.js';

export default function decorate(block) {
  block.setAttribute('id', `aaaa`);
  // aaa(block);
  // bbb(block);
}

function bbb(block) {
  block.setAttribute('id', `bbbb`);
}