const DEFAULT_DURATION = 400;
const DEFAULT_EASE = 'ease-in-out';

const getDomElement = (elemOrRef) => {
  if (elemOrRef.animate) {
    return elemOrRef;
  }
  if (elemOrRef.base?.animate) {
    return elemOrRef.base;
  }
  if (elemOrRef.current?.animate) {
    return elemOrRef.current;
  }
  if (elemOrRef.current?.base?.animate) {
    return elemOrRef.current.base;
  }
  return null;
}

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

/**
 * Takes an element and some start and/or end props, then builds and runs
 * an animation.
 */
export const animate = (elemOrRef, options = {}) => {
  const element = getDomElement(elemOrRef);
  if (!element) {
    return;
  }

  const { start, end, ...animateOptions } = options;
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
