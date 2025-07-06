import { h, render } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
import { Overlay } from './overlay.js';
import { Project } from './project.js';
import { Reorderable } from './reorderable.js';
import data from './data.json' with { type: 'json' };

const shuffle = (array) => {
  return array
    .map(item => [Math.random(), item])
    .sort(([a], [b]) => a - b)
    .map(([_, item]) => item);
};

function Projects() {
  const [expandedProject, setExpandedProject] = useState(null);
  const [orderedData, setOrderedData] = useState(data);

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

  const onRandom = () => {
    setOrderedData(shuffle);
  };

  const onReverse = () => {
    setOrderedData(prev => prev.toReversed());
  };

  return [
    h('h2', null, 'Projects'),

    h('button', { class: 'text-button', onClick: onRandom },
      'Random'
    ),

    h('button', { class: 'text-button', onClick: onReverse },
      'Reverse'
    ),

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
