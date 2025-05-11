import { h, render } from 'preact';
import { Project } from './project.js';
import data from './data.json' with { type: 'json' };

function Projects() {
  return [
    h('h2', null, 'Projects'),
    data.map(({ id, title }) => h(Project, { key: id, title }))
  ];
}

render(h(Projects), document.getElementById('projects'));
