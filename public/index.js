import { h, render } from 'https://esm.sh/preact';

function Gallery() {
  return h('h2', null, 'Gallery');
}

render(h(Gallery), document.getElementById('gallery'));
