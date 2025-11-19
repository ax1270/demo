/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
export function wrapImgsInLinks(container) {
    const pictures = container.querySelectorAll('picture');
    pictures.forEach((pic) => {
      let link = pic.nextElementSibling;
  
      // Skip br elements and find the next valid sibling
      while (link && link.tagName === 'BR') {
        link = link.nextElementSibling;
      }
  
      if (link && link.tagName === 'A' && link.href) {
        link.innerHTML = pic.outerHTML;
        pic.replaceWith(link);
        const siblingBr = link.nextElementSibling;
        if (siblingBr && siblingBr.tagName === 'BR') {
          siblingBr.remove();
        }
      }
    });
  }