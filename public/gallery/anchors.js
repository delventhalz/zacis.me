import { h } from 'preact';

/**
 * Flexibly generates an anchor link. If name is omitted, generates one from
 * the url. If url is omitted, returns the name with no wrapping anchor.
 */
export function Anchor({ name, url }) {
  if (!url) {
    return name;
  }

  const text = name || url.replace(/^https?:\/\/(?:www\.)?/, '');

  return h('a', { href: url, target: '_blank' }, text);
}

/**
 * Converts an array of link data into anchors with English language separators
 * (commas and/or "and").
 */
export function AnchorChain({ data }) {
  switch (data.length) {
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
