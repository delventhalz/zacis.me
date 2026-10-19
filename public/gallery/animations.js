import { getDomNode } from './dom.js';

const DEFAULT_DURATION = 400;
const DEFAULT_EASE = 'ease-in-out';

const getRectX = (partialRect, defaultBounds) => {
  if (typeof partialRect.x === 'number') {
    return partialRect.x;
  }
  if (typeof partialRect.left === 'number') {
    return partialRect.left;
  }
  if (typeof partialRect.right === 'number') {
    return partialRect.right - (partialRect.width ?? defaultBounds.width);
  }
  return defaultBounds.x;
};

const getRectY = (partialRect, defaultBounds) => {
  if (typeof partialRect.y === 'number') {
    return partialRect.y;
  }
  if (typeof partialRect.top === 'number') {
    return partialRect.top;
  }
  if (typeof partialRect.bottom === 'number') {
    return partialRect.bottom - (partialRect.height ?? defaultBounds.height);
  }
  return defaultBounds.y;
};

const getFullBounds = (partialRect, defaultBounds) => ({
  width: partialRect.width ?? defaultBounds.width,
  height: partialRect.height ?? defaultBounds.height,
  x: getRectX(partialRect, defaultBounds),
  y: getRectY(partialRect, defaultBounds)
});

const applyMatrix = (bounds, matrix) => {
  const [scaleX, _, __, scaleY, translateX, translateY] = matrix;
  return {
    width: bounds.width / scaleX,
    height: bounds.height / scaleX,
    x: bounds.x - translateX,
    y: bounds.y - translateY
  };
};

const boundsToMatrix = (originalBounds, transformedBounds) => {
  return [
    transformedBounds.width / originalBounds.width, // scaleX
    0, // skewX
    0, // skewY
    transformedBounds.height / originalBounds.height, // scaleY
    transformedBounds.x - originalBounds.x, // translateX
    transformedBounds.y - originalBounds.y // translateY
  ];
};

const matrixToTransformFrame = (matrix) => ({
  transformOrigin: 'top left',
  transform: `matrix(${matrix.join(', ')})`
});

const makeTransformResetFrame = () => ({
  transform: 'matrix(1, 0, 0, 1, 0, 0)'
});

const getOriginalBounds = (element, currentBounds) => {
  const transformStr = window.getComputedStyle(element).transform;
  const matrixStr = transformStr.match(/matrix\(([0-9 ,]+?)\)/)?.[1];
  if (!matrixStr) {
    return currentBounds;
  }

  const matrix = matrixStr.split(', ').map(Number);
  return applyMatrix(currentBounds, matrix);
};

// Duration grows quickly with distance but then levels off, 500ms ~ 800ms
const calcDynamicDuration = (prevBounds, nextBounds) => {
  const deltaX = prevBounds.x - nextBounds.x;
  const deltaY = prevBounds.y - nextBounds.y;
  const deltaWidth = prevBounds.width - nextBounds.width;
  const deltaHeight = prevBounds.height - nextBounds.height;

  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  const growth = Math.sqrt(deltaWidth ** 2 + deltaHeight ** 2);
  const magnitude = distance + growth;

  return Math.max(0, 150 * Math.log(1.5 * magnitude) - 300);
};

const hasDynamicDuration = (options) => {
  return typeof options.dynamicDuration === 'number' && typeof options.duration !== 'number';
};

const makeStaticTransformOptions = (options) => {
  const { dynamicDuration: _, ...animateOptions } = options;

  return {
    fill: 'forwards',
    ...animateOptions
  };
};

const makeDynamicTransformOptions = (options, prevBounds, nextBounds) => {
  const animateOptions = makeStaticTransformOptions(options);

  if (hasDynamicDuration(options)) {
    const rawDynamicDuration = calcDynamicDuration(prevBounds, nextBounds);
    return {
      ...animateOptions,
      duration: options.dynamicDuration * rawDynamicDuration
    }
  }

  return animateOptions;
};

/**
 * Thin wrapper around the built in animate method. Fills in some default
 * options and silently no-ops if passed a null element. Returns a Promise
 * which resolves when the animation is finished.
 */
export const animate = (elemOrRef, frames, options = {}) => {
  const element = getDomNode(elemOrRef);
  if (!element) {
    return Promise.resolve();
  }

  const animation = element.animate(frames, {
    duration: DEFAULT_DURATION,
    easing: DEFAULT_EASE,
    ...options
  });

  return animation.finished;
};

/**
 * Animate from opacity 0 to opacity 1
 */
export const fadeIn = (elemOrRef, options) => {
  return animate(elemOrRef, [{ opacity: 0 }, { opacity: 1 }], options);
};

/**
 * Animate from opacity 1 to opacity 0
 */
export const fadeOut = (elemOrRef, options) => {
  return animate(elemOrRef, [{ opacity: 1 }, { opacity: 0 }], options);
};

/**
 * Animate a matrix transformation generated from a static BoundingClientRect.
 * The animation fills forward by default, so the transformation will hold until
 * animated again, regardless of any other styling applied.
 */
export const transform = (elemOrRef, partialNextRect, options = {}) => {
  const element = getDomNode(elemOrRef);
  if (!element) {
    return animate(elemOrRef, []);
  }

  const currentBounds = element.getBoundingClientRect();
  const originalBounds = getOriginalBounds(element, currentBounds);
  const nextBounds =  getFullBounds(partialNextRect, currentBounds);

  const matrix = boundsToMatrix(originalBounds, nextBounds);
  const transformFrame = matrixToTransformFrame(matrix);
  const animateOptions = makeDynamicTransformOptions(options, currentBounds, nextBounds);

  return animate(element, [transformFrame], animateOptions);
};

/**
 * Animate from a matrix transformation into an untransformed state
 */
export const transformFrom = (elemOrRef, partialFromRect, options = {}) => {
  const element = getDomNode(elemOrRef);
  if (!element) {
    return animate(elemOrRef, []);
  }

  const currentBounds = element.getBoundingClientRect();
  const originalBounds = getOriginalBounds(element, currentBounds);
  const fromBounds = getFullBounds(partialFromRect, currentBounds);

  const fromMatrix = boundsToMatrix(originalBounds, fromBounds);
  const fromFrame = matrixToTransformFrame(fromMatrix);
  const toFrame = makeTransformResetFrame();
  const animateOptions = makeDynamicTransformOptions(options, fromBounds, originalBounds);

  return animate(element, [fromFrame, toFrame], {
    fill: 'both',
    ...animateOptions
  });
};

/**
 * Animate into an untransformed state
 */
export const transformReset = (elemOrRef, options = {}) => {
  const resetFrame = makeTransformResetFrame();

  if (hasDynamicDuration(options)) {
    const element = getDomNode(elemOrRef);

    if (element) {
      const currentBounds = element.getBoundingClientRect();
      const originalBounds = getOriginalBounds(element, currentBounds);
      const animateOptions = makeDynamicTransformOptions(options, currentBounds, originalBounds);
      return animate(element, [resetFrame], animateOptions);
    }
  }

  const animateOptions = makeStaticTransformOptions(options);
  return animate(element, [resetFrame], animateOptions);
};

export const move = (elemOrRef, { x, y }, options) => {
  return transform(elemOrRef, { x, y }, options);
};

export const moveFrom = (elemOrRef, { x, y }, options) => {
  return transformFrom(elemOrRef, { x, y }, options);
};

export const resize = (elemOrRef, { width, height }, options) => {
  return transform(elemOrRef, { width, height }, options);
};

export const resizeFrom = (elemOrRef, { width, height }, options) => {
  return transformFrom(elemOrRef, { width, height }, options);
};
