import { h } from 'preact';

export function Project(props) {
  const { title } = props;

  return h('div', { class: 'project' },
    h('h3', null, title),
    h('div', null, 'Some text')
  );
}
