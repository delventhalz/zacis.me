import { h, render } from 'preact';
import { useCallback, useState } from 'preact/hooks';

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

  const onProjectClick = useCallback((data, { currentTarget }) => {
    currentTarget.style.opacity = 0; // Prevent flicker
    setExpandedProject({ data, elem: currentTarget });
  }, [setExpandedProject]);

  const onDismissOverlay = useCallback(() => {
    setExpandedProject((prevExpandedProject) => {
      prevExpandedProject.elem.style.opacity = 1;
      return null;
    });
  }, [setExpandedProject]);

  return [
    h('h2', null, 'Projects'),

    h(Controls, { initialData, onClick: setModifiedData }),

    h(Animated, { class: 'gallery' },
      modifiedData.map((data) => (
        h(Project, {
          key: data.id,
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
