import { h } from 'preact';
import { useCallback } from 'preact/hooks';

export function Project({ id, title, image, ...divProps }) {
  const onClick = useCallback((event) => {
    // Ensure currentTarget is populated
    event.currentTarget ??= event.target.closest('.project');

    divProps.onClick?.(event);
  }, [divProps.onClick]);

  const className = divProps.class ? `project ${divProps.class}` : 'project';

  return h('div', { ...divProps, id, class: className, onClick },
    h('img', {
      src: `images/${image}`,
      alt: title,
      title
    }),
    h('div', { class: 'project-label' }, title)
  );
}
