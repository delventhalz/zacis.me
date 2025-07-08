import { h, render } from 'preact';
import { sortByRelevance } from './controls.js';
import { Projects } from './projects.js';
import data from './data.json' with { type: 'json' };

const initialData = sortByRelevance(data).map(datum => ({
  ...datum,
  display: true
}));

const gallerySection = document.getElementById('project-gallery');
render(h(Projects, { data: initialData }), gallerySection);
