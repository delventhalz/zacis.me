import { h } from 'preact';
import { Mirror } from './funhouse.js';

/**
 * A single project as displayed within the gallery.
 */
export function Project({ data, onClick, display: _, ...divProps }) {
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
