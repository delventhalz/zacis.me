import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

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

const shuffle = (array) => {
  return array
    .map(item => [Math.random(), item])
    .sort(([a], [b]) => a - b)
    .map(([_, item]) => item);
};

const DEBOUNCE_DURATION = 800;

const SORT_MAP = {
  Relevance: sortByRelevance,
  Date: sortByDate,
  Alphabetical: sortByTitle,
  Random: shuffle,
};
const SORT_KEYS = Object.keys(SORT_MAP);

export function Controls({ fullData, onClick }) {
  const [sort, setSort] = useState(SORT_KEYS[0]);
  const [disabled, setDisabled] = useState(false);

  const debounce = () => {
    setDisabled(true);
    setTimeout(() => {
      setDisabled(false);
    }, DEBOUNCE_DURATION);
  };

  const getOnSortClick = (key) => () => {
    if (sort !== key || key === 'Random') {
      const sortFn = SORT_MAP[key]
      onClick(sortFn(fullData));
      setSort(key);
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
    )
  ]
}
