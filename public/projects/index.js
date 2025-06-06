import { h, render } from 'preact';
import { useState } from 'preact/hooks';
import { Project } from './project.js';
import { DragAndDrop } from './draggable.js';
import data from './data.json' with { type: 'json' };

function Projects() {
  const [state, setState] = useState(Object.fromEntries(data.map(d => [d.title, {}])));

  return [
    h('h2', null, 'Projects'),
    h(DragAndDrop, {
      class: 'projects',
      draggableComponent: Project,
      propsForDraggables: data.map(({ id, image, title }) => ({ key: id, id, image, title }))
    })
  ];
}

render(h(Projects), document.getElementById('project-gallery'));
