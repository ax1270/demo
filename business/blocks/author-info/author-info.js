/**
 * 著者情報ブロックをデコレートする関数
 * @param {HTMLElement} block - 著者情報ブロック要素
 */
export default function decorate(block) {
  // 元のコンテンツを取得

  const authorInfoBlock = block.children[0];
  if (!authorInfoBlock) return;

  const classes = ['picture', 'heading', 'text'];
  classes.forEach((c, i) => {
    const el = authorInfoBlock.children[i];
    if (el) el.classList.add(`author-info-${c}`);
  });

  const heading = authorInfoBlock.querySelector('.author-info-heading');
  const pic = authorInfoBlock.querySelector('.author-info-picture');
  if (heading && pic) {
    heading.prepend(pic);
  }
}
