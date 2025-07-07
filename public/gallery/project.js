import { h } from 'preact';
import { useCallback } from 'preact/hooks';
import { Mirror } from './funhouse.js';

/**
 * A single project as displayed within the gallery.
 */
export function Project({ id, title, image, display: _, ...divProps }) {
  const onClick = useCallback((event) => {
    // Ensure currentTarget is populated
    event.currentTarget ??= event.target.closest('.project');

    divProps.onClick?.(event);
  }, [divProps.onClick]);

  const className = divProps.class ? `project ${divProps.class}` : 'project';

  return h('div', { ...divProps, id, class: className, onClick },
    id === 'zacisme' ? (
      h(Mirror, {
        class: 'project-image',
        alt: title,
        source: 'main',
        defaultImage: `images/${image}`,
      })
    ) : (
      h('img', {
        class: 'project-image',
        src: `images/${image}`,
        alt: title,
        title
      })
    ),
    h('div', { class: 'project-label' }, title)
  );
}
