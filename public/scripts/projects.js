import { h, render } from 'preact';

function Projects() {
  return h('h2', null, 'Projects');
}

render(h(Projects), document.getElementById('projects'));
