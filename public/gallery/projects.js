import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Animated } from './animated.js';
import { Controls } from './controls.js';
import { getDomNode, mixClasses, urlsToSet } from './dom.js';
import { Mirror } from './funhouse.js';
import { Overlay } from './overlay.js';
import { useDragOver } from './use-drag-over.js';

const SWAP_THRESHOLD = 0.2;

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
    draggable: true,
    'data-droppable': true,
    ...divProps,
    id: `project-${data.id}`,
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
    h('div', { class: 'project-label' }, data.title),
    h('div', { class: 'drag-trigger' },
      h('img', {
        src: 'images/drag-icon.svg',
        alt: 'Drag to rearrange',
        title: 'Drag to rearrange'
      })
    )
  );
}

/**
 * The entire project gallery, including header, controls, and projects.
 */
export function Projects({ data }) {
  const [expandedProject, setExpandedProject] = useState(null);
  const [overlayShowing, setOverlayShowing] = useState(false);
  const [modifiedData, setModifiedData] = useState(data);
  const galleryRef = useRef(null);

  useDragOver((over, under) => {
    setModifiedData(prevData => {
      const overIndex = prevData.findIndex(data => over.id === `project-${data.id}`);
      const underIndex = prevData.findIndex(data => under.id === `project-${data.id}`);

      const nextData = [...prevData];
      nextData[overIndex] = prevData[underIndex];
      nextData[underIndex] = prevData[overIndex];

      return nextData;
    });
  }, { threshold: SWAP_THRESHOLD });

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

    h(Animated, {
      class: 'gallery',
      inert: Boolean(expandedProject),
      ref: galleryRef
    },
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
