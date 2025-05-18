import { h } from 'preact';

export function Project({ id, title, ...props }) {
  return h('div', { id, class: 'project', ...props },
    h('h3', null, title),
    h('div', null, 'Some text')
  );
}
