class AccordionBuilder {
  constructor(title, content, isOpen = true) {
    this.title = title;
    this.content = content;
    this.isOpen = isOpen;
  }

  build() {
    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'accordion-container';

    const accordion = document.createElement('details');
    accordion.className = 'accordion';
    if (this.isOpen) accordion.setAttribute('open', '');

    const header = document.createElement('summary');
    header.className = 'accordion-header';

    const headerText = document.createElement('span');
    headerText.className = 'accordion-title';
    headerText.textContent = this.title;
    header.appendChild(headerText);

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.appendChild(this.content);

    accordion.appendChild(header);
    accordion.appendChild(content);
    accordionContainer.appendChild(accordion);

    return accordionContainer;
  }
}

export default AccordionBuilder;
