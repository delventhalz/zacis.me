import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Animated } from './animated.js';
import { Controls } from './controls.js';
import { Mirror } from './funhouse.js';
import { Overlay } from './overlay.js';

/**
 * A single project as displayed within the gallery.
 */
function Project({ data, onClick, display: _, ...divProps }) {
  const className = divProps.class ? `project ${divProps.class}` : 'project';

  const handleClick = (event) => {
    // Ensure currentTarget is populated
    event.currentTarget ??= event.target.closest('.project');
    onClick(event);
  };

  return h('button', { ...divProps, class: className, onClick: handleClick },
    data.id === 'zacisme' ? (
      h(Mirror, {
        class: 'project-image',
        source: 'main',
        defaultImage: `images/${data.image}`,
      })
    ) : (
      h('img', {
        class: 'project-image',
        src: `images/${data.image}`,
        title: data.title
      })
    ),
    h('div', { class: 'project-label' }, data.title)
  );
}

/**
 * The entire project gallery, including header, controls, and projects.
 */
export function Projects({ data }) {
  const [expandedProject, setExpandedProject] = useState(null);
  const [modifiedData, setModifiedData] = useState(data);

  const onProjectClick = (data, { currentTarget }) => {
    setExpandedProject({ data, elem: currentTarget });
  };

  const onDismissOverlay = () => {
    setExpandedProject(null);
  };

  return [
    h('h2', null, 'Projects'),

    h(Controls, {
      initialData: data,
      inert: Boolean(expandedProject),
      onClick: setModifiedData
    }),

    h(Animated, { class: 'gallery', inert: Boolean(expandedProject) },
      modifiedData.map((data) => (
        h(Project, {
          key: data.id,
          class: expandedProject?.data.id === data.id ? 'hidden' : null,
          onClick: event => onProjectClick(data, event),
          display: data.display,
          data
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
