export default function decorate(block) {
  block.setAttribute('id', `test`);

  const container = document.createElement('div');
  container.classList.add('test');

  block.prepend(container);
}