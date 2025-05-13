import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { fetchCarousel } from '../../scripts/carousel/carousel.js';

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
    block.setAttribute('id', `carousel-${carouselId}`);
    const rows = block.querySelectorAll(':scope > div');
    const isSingleSlide = rows.length < 2;
  
    const placeholders = await fetchPlaceholders();
    const carousel = await fetchCarousel();
  
    block.setAttribute('role', 'region');
    block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');
  
    const container = document.createElement('div');
    container.classList.add('carousel-slides-container');
  
    const slidesWrapper = document.createElement('ul');
    slidesWrapper.classList.add('carousel-slides');
    block.prepend(slidesWrapper);
  
    let slideIndicators;
    if (!isSingleSlide) {
      const slideIndicatorsNav = document.createElement('nav');
      slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
      slideIndicators = document.createElement('ol');
      slideIndicators.classList.add('carousel-slide-indicators');
      slideIndicatorsNav.append(slideIndicators);
      block.append(slideIndicatorsNav);
  
      const slideNavButtons = document.createElement('div');
      slideNavButtons.classList.add('carousel-navigation-buttons');
      slideNavButtons.innerHTML = `
        <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
        <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
      `;
  
      container.append(slideNavButtons);
    }
  
    rows.forEach((row, idx) => {
      const slide = carousel.createSlide(row, idx, carouselId);
      slidesWrapper.append(slide);
  
      if (slideIndicators) {
        const indicator = document.createElement('li');
        indicator.classList.add('carousel-slide-indicator');
        indicator.dataset.targetSlide = idx;
        indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
        slideIndicators.append(indicator);
      }
      row.remove();
    });
  
    container.append(slidesWrapper);
    block.prepend(container);
  
    if (!isSingleSlide) {
      carousel.bindEvents(block);
    }
}