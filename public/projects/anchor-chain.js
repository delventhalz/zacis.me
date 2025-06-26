import { h } from 'preact';

function Anchor({ name, url }) {
  if (!url) {
    return name;
  }

  return h('a', { href: url, target: '_blank' }, name);
}

export function AnchorChain({ data }) {
  switch(data.length) {
    case 0:
      return [];
    case 1:
      return [h(Anchor, data[0])];
    case 2:
      return [
        h(Anchor, data[0]),
        ' and ',
        h(Anchor, data[1])
      ];
    default:
      return [
        ...data.slice(0, -1).flatMap(datum => [h(Anchor, datum), ', ']),
        'and ',
        h(Anchor, data.at(-1))
      ];
  }
}
