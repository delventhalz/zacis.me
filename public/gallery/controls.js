import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

const getPrng = (initialSeed) => {
  let seed = initialSeed;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483646;
  };
};

export const sortByRelevance = (data) => {
  // Reseed the PRNG every hour for slight content variations
  const prng = getPrng(Math.floor(Date.now() / 3_600_000));

  return data
    .map(datum => [datum.relevance + (2 * prng()) ** 2, datum])
    .sort(([a], [b]) => b - a)
    .map(([_, datum]) => datum);
};

const sortByDate = (data) => {
  return data.toSorted((a, b) => b.endDate.localeCompare(a.endDate));
};

const sortByTitle = (data) => {
  return data.toSorted((a, b) => a.title.localeCompare(b.title));
};

const shuffle = (array, seed) => {
  // Allow shuffle to be rerun with the same seed to get the same shuffle
  const prng = getPrng(seed * 2147483646);

  return array
    .map(item => [prng(), item])
    .sort(([a], [b]) => a - b)
    .map(([_, item]) => item);
};

const displayAll = data => data.map(datum => ({ ...datum, display: true }));
const displayProfessional = data => data.map(datum => ({
  ...datum,
  display: datum.clients.length > 0
}));
const displayPersonal = data => data.map(datum => ({
  ...datum,
  display: datum.clients.length === 0
}));

const smooshKey = key => key.replaceAll(/\s/gi, '').toLowerCase();
const displayByKey = (data, key) => {
  const searchKey = smooshKey(key);
  return data.map(datum => {
    const keywords = [...datum.tools, ...datum.tags].map(smooshKey);
    return {
      ...datum,
      display: keywords.some(word => word.includes(searchKey))
    };
  });
};

const DEBOUNCE_DURATION = 800;

const SORT_MAP = {
  Relevance: sortByRelevance,
  Date: sortByDate,
  Alphabetical: sortByTitle,
  Random: shuffle,
};
const SORT_KEYS = Object.keys(SORT_MAP);

const FILTER_MAP = {
  All: displayAll,
  Professional: displayProfessional,
  Personal: displayPersonal,
  React: data => displayByKey(data, 'React'),
  'React Native': data => displayByKey(data, 'React Native'),
  Node: data => displayByKey(data, 'Node'),
  AWS: data => displayByKey(data, 'AWS'),
  GCP: data => displayByKey(data, 'GCP'),
  TypeScript: data => displayByKey(data, 'TypeScript'),
  Rust: data => displayByKey(data, 'Rust'),
  Python: data => displayByKey(data, 'Python'),
  Web: data => displayByKey(data, 'Web'),
  Mobile: data => displayByKey(data, 'Mobile'),
  Games: data => displayByKey(data, 'Games'),
  'Open Source': data => displayByKey(data, 'Open Source')
};
const FILTER_KEYS = Object.keys(FILTER_MAP);

/**
 * Display controls for an array of data. Allows the user to sort or filter the
 * data in a variety of ways, calling an "onClick" function with each new array.
 *
 * In order to make animations possible in rendered data, anything filtered out
 * is marked as display: false and placed at the end, rather than actually being
 * omitted from the new array.
 */
export function Controls({ initialData, onClick }) {
  const [sort, setSort] = useState(SORT_KEYS[0]);
  const [display, setFilter] = useState(FILTER_KEYS[0]);
  const [disabled, setDisabled] = useState(false);

  const seedRef = useRef(0);
  const parentRef = useRef(null);

  const debounce = () => {
    setDisabled(true);
    setTimeout(() => {
      setDisabled(false);
    }, DEBOUNCE_DURATION);
  };

  const onAnyClick = (sortKey, displayKey) => {
    const sortFn = SORT_MAP[sortKey]
    const sorted = sortFn(initialData, seedRef.current);

    const displayFn = FILTER_MAP[displayKey];
    const nextDisplay = displayFn(sorted);

    debounce();
    onClick([
      ...nextDisplay.filter(datum => datum.display),
      ...nextDisplay.filter(datum => !datum.display)
    ]);
  };

  const onSortClick = (key) => {
    if (key === 'Random') {
      seedRef.current = Math.random();
    }

    if (sort !== key || key === 'Random') {
      onAnyClick(key, display);
      setSort(key);
    }
  };

  const onFilterClick = (key) => {
    const nextKey = display === key ? 'All' : key;
    if (display !== nextKey) {
      onAnyClick(sort, nextKey);
      setFilter(nextKey);
    }
  };

  return [
    h('h3', null, 'Sort'),
    h('div', { class: 'control-panel' },
      SORT_KEYS.map((key) => (
        h('button',
          {
            key,
            disabled,
            class: `text-button ${sort === key ? '' : 'quiet'}`,
            onClick: () => onSortClick(key)
          },
          key
        )
      ))
    ),

    h('h3', null, 'Filter'),
    h('div', { class: 'control-panel' },
      FILTER_KEYS.map((key) => (
        h('button',
          {
            key,
            disabled,
            class: `text-button ${display === key ? '' : 'quiet'}`,
            onClick: () => onFilterClick(key)
          },
          key
        )
      ))
    )
  ];
}
