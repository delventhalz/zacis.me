import { h, render } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
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

  const onProjectClick = useCallback((event) => {
    event.currentTarget.style.opacity = 0; // Prevent flicker
    setExpandedProject(event.currentTarget);
  }, [setExpandedProject]);

  const onDismissOverlay = useCallback(() => {
    setExpandedProject(prevExpandedProject => {
      prevExpandedProject.style.opacity = 1;
      return null;
    })
  }, [setExpandedProject]);

  return [
    h('h2', null, 'Projects'),

    h(Controls, { initialData, onClick: setModifiedData }),

    h(Animated, { class: 'gallery' },
      modifiedData.map(({ id, image, title, display }) => h(Project, {
        key: id,
        image,
        title,
        display,
        onClick: onProjectClick
      }))
    ),

    expandedProject && (
      h(Overlay, {
        data: data.find(({ id }) => id === expandedProject.id),
        start: expandedProject.getBoundingClientRect(),
        onDismiss: onDismissOverlay
      })
    )
  ];
}

render(h(Projects), document.getElementById('project-gallery'));
