import { h } from 'preact';

export function Project({ id, image, title, ...props }) {
  return h('div', { id, class: 'project', ...props },
    h('img', {
      src: `images/${image}`,
      alt: title,
      title
    }),
    h('div', { class: 'project-label' }, title)
  );
}
