import { h, render } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
import { sortByRelevance, Controls } from './controls.js';
import { Overlay } from './overlay.js';
import { Project } from './project.js';
import { Reorderable } from './reorderable.js';
import data from './data.json' with { type: 'json' };

const sortedData = sortByRelevance(data);

function Projects() {
  const [expandedProject, setExpandedProject] = useState(null);
  const [orderedData, setOrderedData] = useState(sortedData);

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

    h(Controls, { fullData: sortedData, onClick: setOrderedData }),

    h(Reorderable, { class: 'gallery' },
      orderedData.map(({ id, image, title }) => h(Project, {
        key: id,
        id,
        image,
        title,
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
