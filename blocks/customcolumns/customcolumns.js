export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`customcolumns-${cols.length}-cols`);

  // テストコード
  const count = 1;

  // setup image customcolumns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('customcolumns-img-col');
        }
      }

      // テストコード
      if (count == 1) {
        // 1列目だけCSS入れる
        col.classList.add('testtest');
      }
      count++;
    });
  });
}
