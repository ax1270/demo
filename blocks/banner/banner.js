import { fetchPlaceholders } from '../../scripts/placeholders.js';

function createSlide(row, slideIndex, bannerId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `banner-${bannerId}-slide-${slideIndex}`);
  slide.classList.add('banner-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`banner-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let bannerId = 0;
export default async function decorate(block) {
  bannerId += 1;
  block.setAttribute('id', `banner-${bannerId}`);
  const rows = block.querySelectorAll(':scope > div');
  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.banner || 'banner');

  const container = document.createElement('div');
  container.classList.add('banner-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('banner-slides');
  block.prepend(slidesWrapper);

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, bannerId);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);
}