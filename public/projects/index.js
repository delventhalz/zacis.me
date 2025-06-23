import { h, render } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { Overlay } from './overlay.js';
import { Project } from './project.js';
import { DragAndDrop } from './draggable.js';
import data from './data.json' with { type: 'json' };

function Projects() {
  const [expandedProject, setExpandedProject] = useState(null);

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

    h(DragAndDrop, {
      class: 'projects',
      draggableComponent: Project,
      propsForDraggables: data.map(({ id, image, title }) => ({
        key: id,
        id,
        image,
        title,
        onClick: onProjectClick
      }))
    }),

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
