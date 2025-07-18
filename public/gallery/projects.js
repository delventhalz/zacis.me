import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Animated } from './animated.js';
import { Controls } from './controls.js';
import { getDomNode, mixClasses, urlsToSet } from './dom.js';
import { Mirror } from './funhouse.js';
import { Overlay } from './overlay.js';

/**
 * A single project as displayed within the gallery.
 */
function Project({ data, lazy, onClick, display: _, ...divProps }) {
  const className = mixClasses(divProps, 'project');
  const srcSet = urlsToSet(data.images);
  const projectRef = useRef(null);

  const handleClick = () => {
    onClick({ data, element: getDomNode(projectRef) });
  };

  return h('button', {
    ...divProps,
    class: className,
    onClick: handleClick,
    ref: projectRef
  },
    data.id === 'zacisme' ? (
      h(Mirror, {
        class: 'project-image',
        source: 'main',
        defaultImage: data.image,
      })
    ) : (
      h('img', {
        class: 'project-image',
        title: data.title,
        ...(lazy ? { loading: 'lazy' } : {}),
        ...(srcSet ? { srcSet } : { src: data.image })
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
  const [overlayShowing, setOverlayShowing] = useState(false);
  const [modifiedData, setModifiedData] = useState(data);

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
      modifiedData.map((data, i) => (
        h(Project, {
          key: data.id,
          class: expandedProject?.data.id === data.id && overlayShowing ? 'hidden' : null,
          onClick: setExpandedProject,
          lazy: i > 5,
          display: data.display,
          data
        })
      ))
    ),

    expandedProject && (
      h(Overlay, {
        data: expandedProject.data,
        start: expandedProject.element.getBoundingClientRect(),
        onShowing: setOverlayShowing,
        onDismiss: onDismissOverlay
      })
    )
  ];
}
