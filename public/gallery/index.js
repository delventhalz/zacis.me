import { h, render } from 'preact';
import { sortByRelevance } from './controls.js';
import { initDraggable } from './draggable.js';
import { Mirror } from './funhouse.js';
import { Projects } from './projects.js';
import data from './data.json' with { type: 'json' };

const headerStyle = 'font: normal 700 2rem "Corbel", "Lato", sans-serif;'
const bodyStyle = 'font: normal 400 1rem "Corbel", "Lato", sans-serif;'
const nameStyle = 'font: italic 400 1rem "Corbel", "Lato", sans-serif;'

const header = 'Hello\n\n';
const body = `\
It looks like you are curious how I built this site. I mostly just used \
vanilla HTML, CSS, and JavaScript with a bit of Preact, but everything is \
served statically without a build step, so feel free to poke around in here \
if you want the details. You might also head over to \
https://github.com/delventhalz/zacis.me if you are going to really dig in.\
`;
const name = '\n\n\n– Zac'

console.log(`%c${header}%c${body}%c${name}`, headerStyle, bodyStyle, nameStyle);

const initialData = sortByRelevance(data).map(datum => ({
  ...datum,
  display: true
}));

const gallerySection = document.getElementById('project-gallery');
render(h(Projects, { data: initialData }), gallerySection);

// Can't just clone a Mirror, it needs a bunch of listeners
const swapMirror = (container) => {
  // Assuming mirror element is first with ui elements on top
  const uiElements = [...container.children].slice(1);
  container.replaceChildren();

  const mirror = h(Mirror, {
    class: 'project-image',
    source: 'main',
    defaultImage: 'images/zacisme.webp'
  });
  render(mirror, container);

  for (const uiElement of uiElements) {
    container.append(uiElement);
  }
};

initDraggable(gallerySection, {
  dragTrigger: '.drag-trigger',
  draggedClass: 'hidden',
  makeDragImage: (target) => {
    const dragImage = target.cloneNode(true);

    if (dragImage.id === 'project-zacisme') {
      swapMirror(dragImage);
    }

    return dragImage;
  }
});
