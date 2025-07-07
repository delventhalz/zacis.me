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

const filterAll = data => data;
const filterProfessional = data => data.filter(data => data.clients.length > 0);
const filterPersonal = data => data.filter(data => data.clients.length === 0);

const smooshKey = key => key.replaceAll(/\s/gi, '').toLowerCase();
const filterByKey = (data, key) => {
  const searchKey = smooshKey(key);
  return data.filter(({ tools, tags }) => {
    return [...tools, ...tags]
      .map(smooshKey)
      .some(smooshed => smooshed.includes(searchKey));
  })
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
  All: filterAll,
  Professional: filterProfessional,
  Personal: filterPersonal,
  React: filterByKey,
  'React Native': filterByKey,
  Node: filterByKey,
  AWS: filterByKey,
  GCP: filterByKey,
  TypeScript: filterByKey,
  Rust: filterByKey,
  Python: filterByKey,
  Web: filterByKey,
  Mobile: filterByKey,
  Games: filterByKey,
  'Open Source': filterByKey,
};
const FILTER_KEYS = Object.keys(FILTER_MAP);

export function Controls({ fullData, onClick }) {
  const [sort, setSort] = useState(SORT_KEYS[0]);
  const [filter, setFilter] = useState(FILTER_KEYS[0]);
  const [disabled, setDisabled] = useState(false);
  const seedRef = useRef(0);

  const debounce = () => {
    setDisabled(true);
    setTimeout(() => {
      setDisabled(false);
    }, DEBOUNCE_DURATION);
  };

  const getOnSortClick = (key) => () => {
    if (key === 'Random') {
      seedRef.current = Math.random();
    }

    if (sort !== key || key === 'Random') {
      const sortFn = SORT_MAP[key]
      const filterFn = FILTER_MAP[filter];
      onClick(sortFn(filterFn(fullData, filter), seedRef.current));
      setSort(key);
      debounce();
    }
  };

  const getOnFilterClick = (key) => () => {
    if (filter !== key) {
      const sortFn = SORT_MAP[sort]
      const filterFn = FILTER_MAP[key];
      onClick(sortFn(filterFn(fullData, key), seedRef.current));
      setFilter(key);
      debounce();
    }
  };

  return [
    h('div', { class: 'control-panel' },
      h('h3', null, 'Sort'),
      h('div', { class: 'buttons' },
        SORT_KEYS.map((key) => (
          h('button',
            {
              key,
              disabled,
              class: `text-button ${sort === key ? 'active' : 'inactive'}`,
              onClick: getOnSortClick(key)
            },
            key
          )
        ))
      )
    ),

    h('div', { class: 'control-panel' },
      h('h3', null, 'Filter'),
      h('div', { class: 'buttons' },
        FILTER_KEYS.map((key) => (
          h('button',
            {
              key,
              disabled,
              class: `text-button ${filter === key ? 'active' : 'inactive'}`,
              onClick: getOnFilterClick(key)
            },
            key
          )
        ))
      )
    )
  ]
}
