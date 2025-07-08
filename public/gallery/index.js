import { h, render } from 'preact';
import { useState } from 'preact/hooks';

import { Animated } from './animated.js';
import { sortByRelevance, Controls } from './controls.js';
import { Overlay } from './overlay.js';
import { Project } from './project.js';

import data from './data.json' with { type: 'json' };

const initialData = sortByRelevance(data).map(datum => ({
  ...datum,
  display: true
}));

function Projects() {
  const [expandedProject, setExpandedProject] = useState(null);
  const [modifiedData, setModifiedData] = useState(initialData);

  const onProjectClick = (data, { currentTarget }) => {
    setExpandedProject({ data, elem: currentTarget });
  };

  const onDismissOverlay = () => {
    setExpandedProject(null);
  };

  return [
    h('h2', null, 'Projects'),

    h(Controls, {
      initialData,
      inert: Boolean(expandedProject),
      onClick: setModifiedData
    }),

    h(Animated, { class: 'gallery', inert: Boolean(expandedProject) },
      modifiedData.map((data) => (
        h(Project, {
          key: data.id,
          class: expandedProject?.data.id === data.id ? 'hidden' : null,
          id: data.id,
          image: data.image,
          title: data.title,
          display: data.display,
          onClick: event => onProjectClick(data, event)
        })
      ))
    ),

    expandedProject && (
      h(Overlay, {
        data: expandedProject.data,
        start: expandedProject.elem.getBoundingClientRect(),
        onDismiss: onDismissOverlay
      })
    )
  ];
}

render(h(Projects), document.getElementById('project-gallery'));
