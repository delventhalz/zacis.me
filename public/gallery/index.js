import { h, render } from 'preact';
import { sortByRelevance } from './controls.js';
import { renderTempImage } from './dom.js';
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
vanilla HTML, CSS, and JavaScript with a bit of Preact. Everything is served \
statically without a build step, so feel free to poke around if you want \
details. You might also head over to https://github.com/delventhalz/zacis.me \
if you really want to dig in. \
`;
const name = '\n\n\n– Zac'

console.log(`%c${header}%c${body}%c${name}`, headerStyle, bodyStyle, nameStyle);

const initialData = sortByRelevance(data).map(datum => ({
  ...datum,
  display: true
}));

const gallerySection = document.getElementById('project-gallery');
render(h(Projects, { data: initialData }), gallerySection);

initDraggable(gallerySection, {
  dragTrigger: '.drag-trigger',
  draggedClass: 'hidden',
  animateDrop: true,
  animateCancel: true,
  makeDragImage: (target) => {
    const dragImage = target.cloneNode(true);

    [...dragImage.children].forEach((child, i) => {
      if (child.tagName === 'CANVAS') {
        child.getContext('2d').drawImage(target.children[i], 0, 0);
      }
    });

    return dragImage;
  }
});

// Wait a couple of frames then temporarily render all large images.
// This prevents a flash of white on opening the overlay
// by caching the image render ahead of time.
setTimeout(() => {
  for (const { largeImages } of data) {
    if (largeImages.length > 0) {
      renderTempImage(largeImages);
    }
  }
}, 32);
