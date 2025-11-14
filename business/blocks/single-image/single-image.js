/**
 * ⚠️ 重要な注意事項 ⚠️
 * これは廃止予定ブロックなので、編集しないでください。
 * image.jsを修正してください。
 */

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const isLinkAll = block.classList.contains('link-all') && row.querySelector('a');
    let linkHref;

    if (isLinkAll) {
      const link = row.querySelector('a');
      if (link) {
        linkHref = link.href;
        link.closest('div').remove();
      }
    }

    [...row.children].forEach((div) => {
      const li = document.createElement('li');
      const wrapper = document.createElement(isLinkAll ? 'a' : 'div');

      if (isLinkAll && linkHref) {
        wrapper.href = linkHref;
        wrapper.classList.add('-link');
      }

      wrapper.append(div);
      li.append(wrapper);
      ul.append(li);
    });
  });

  block.textContent = '';
  block.append(ul);
}
