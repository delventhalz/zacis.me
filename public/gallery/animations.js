import { getDomNode } from './dom.js';

const DEFAULT_DURATION = 400;
const DEFAULT_EASE = 'ease-in-out';

const makeFrame = (element, props) => {
  const frame = {};
  const rect = element.getBoundingClientRect();

  if (typeof props.opacity === 'number') {
    frame.opacity = props.opacity;
  }

  if (typeof props.width === 'number' || typeof props.height === 'number') {
    frame.width = `${props.width ?? rect.width}px`;
    frame.height = `${props.height ?? rect.height}px`;
  }

  if (typeof props.x === 'number' || typeof props.y === 'number') {
    const deltaX = props.x - rect.x;
    const deltaY = props.y - rect.y;
    frame.transformOrigin = 'top left';
    frame.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  return frame;
};

// Duration grows quickly with distance but then levels off, 500ms ~ 800ms
const calcDynamicDuration = (element, start = {}, end = {}) => {
  const loc = element.getBoundingClientRect();

  const deltaX = (start.x ?? loc.x) - (end.x ?? loc.x);
  const deltaY = (start.y ?? loc.y) - (end.y ?? loc.y);
  const deltaWidth = (start.width ?? loc.width) - (end.width ?? loc.width);
  const deltaHeight = (start.height ?? loc.height) - (end.height ?? loc.height);

  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const growth = Math.sqrt(deltaWidth ** 2 + deltaHeight ** 2);
  const magnitude = distance + growth;

  return Math.max(0, 150 * Math.log(1.5 * magnitude) - 300);
};

/**
 * Takes an element and some start and/or end props, then builds and runs
 * an animation.
 */
export const animate = (elemOrRef, options = {}) => {
  const element = getDomNode(elemOrRef);
  if (!element) {
    return;
  }

  const { start, end, dynamicDuration, ...animateOptions } = options;
  const dynamicOptions = {
    duration: DEFAULT_DURATION,
    easing: DEFAULT_EASE
  };

  if (start && end) {
    dynamicOptions.fill = 'both';
  } else if (start) {
    dynamicOptions.fill = 'backwards';
  } else if (end) {
    dynamicOptions.fill = 'forwards';
  }

  if (typeof dynamicDuration === 'number') {
    dynamicOptions.duration = dynamicDuration * calcDynamicDuration(element, start, end);
  }

  // Add any passed animateOptions into our final dynamicOptions object
  Object.assign(dynamicOptions, animateOptions);

  const frames = [{}];

  if (start) {
    frames.unshift(makeFrame(element, start));
  }
  if (end) {
    frames.push(makeFrame(element, end));
  }

  const animation = element.animate(frames, dynamicOptions);
  return animation.finished;
};

export const fadeIn = (elemOrRef, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    start: { opacity: 0 },
    end: { opacity: 1 },
  });
};

export const fadeOut = (elemOrRef, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    start: { opacity: 1 },
    end: { opacity: 0 },
  });
};

export const moveIn = (elemOrRef, { x, y }, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    start: { x, y }
  });
};

export const moveOut = (elemOrRef, { x, y }, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    end: { x, y }
  });
};

export const resizeIn = (elemOrRef, { width, height }, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    start: { width, height }
  });
};

export const resizeOut = (elemOrRef, { width, height }, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    end: { width, height }
  });
};

export const transformIn = (elemOrRef, start, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    start
  });
};

export const transformOut = (elemOrRef, end, options = {}) => {
  return animate(elemOrRef, {
    ...options,
    end
  });
};
