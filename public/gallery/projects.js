import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Animated } from './animated.js';
import { Controls } from './controls.js';
import { getDomNode, mixClasses, urlsToSet } from './dom.js';
import { Mirror } from './funhouse.js';
import { Overlay } from './overlay.js';
import { useDragOver } from './use-drag-over.js';

const SWAP_THRESHOLD = 0.2;

// No guarantee Preact renders before window loads so we need a global listener
let globalIsPageLoaded = false;
window.addEventListener('load', () => {
  globalIsPageLoaded = true;
}, { once: true });

/**
 * A single project as displayed within the gallery.
 */
function Project({
  data,
  onClick,
  useLowRes,
  useHighRes,
  display: _,
  ...divProps
}) {
  const className = mixClasses(divProps, 'project');
  const src = data.image || data.images[0] || '';
  const srcSet = urlsToSet(useHighRes ? data.largeImages : data.images);
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
        ...(srcSet && !useLowRes ? { srcSet } : { src })
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
  const [isPageLoaded, setIsPageLoaded] = useState(globalIsPageLoaded);
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

  useEffect(() => {
    const onLoad = () => {
      setIsPageLoaded(true);
    };

    if (!isPageLoaded) {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', onLoad);
    }
  }, []);

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
          useLowRes: !isPageLoaded && i > 5, // Speed up initial load if off screen
          useHighRes: isPageLoaded, // Use overlay images to prevent flash of white
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
