const DEFAULT_IMAGE_TIMEOUT = 400;

/**
 * Accepts any number of strings or props objects and joins them into one string
 */
export const mixClasses = (...classArgs) => {
  return classArgs
    .flat(Infinity)
    .map(arg => arg?.class ? arg.class : arg)
    .filter(className => className && typeof className === 'string')
    .join(' ');
};

/**
 * Convert an array of URL strings to "1x, 2x..." srcset string
 */
export const urlsToSet = (imageUrls) => {
  return imageUrls.map((url, i) => `${url} ${i + 1}x`).join(', ');
};

/**
 * Pull a valid DOM node out of a preact ref or element
 */
export const getDomNode = (elemOrRef) => {
  if (elemOrRef?.nodeType) {
    return elemOrRef;
  }
  if (elemOrRef?.base?.nodeType) {
    return elemOrRef.base;
  }
  if (elemOrRef?.current?.nodeType) {
    return elemOrRef.current;
  }
  if (elemOrRef?.current?.base?.nodeType) {
    return elemOrRef.current.base;
  }
  return null;
};

/**
 * Simple Promise wrapper around requestAnimationFrame
 */
export const untilNextFrame = () => {
  return new Promise(requestAnimationFrame);
};

/**
 * Returns a Promise which resolves when an image has finished loading.
 *
 * Accepts a "timeout" option to resolve the Promise early if the image
 * is taking too long to load. Defaults to 400 ms. Explicitly set to null
 * or -1 to have no timeout.
 */
export const untilImageLoads = (imgElemOrRef, options = {}) => {
  const { timeout = DEFAULT_IMAGE_TIMEOUT } = options;
  const img = getDomNode(imgElemOrRef);

  // If complete is not set to false, the image has either already loaded or is
  // in an unknown state. Either way, cannot wait for it. Resolve immediately.
  if (img?.complete !== false) {
    return Promise.resolve(img);
  }

  return new Promise((resolve) => {
    let timeoutId;

    const onEvent = async (event) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      img.removeEventListener('load', onEvent);
      img.removeEventListener('error', onEvent);

      // Wait an additional frame to ensure the loaded image is rendered
      await untilNextFrame();
      resolve(event.target);
    };

    img.addEventListener('load', onEvent);
    img.addEventListener('error', onEvent);

    if (typeof timeout === 'number' && timeout >= 0) {
      const onTimeout = () => {
        img.removeEventListener('load', onEvent);
        img.removeEventListener('error', onEvent);
        resolve(img);
      };

      timeoutId = setTimeout(onTimeout, timeout);
    }
  });
};

/**
 * Brute force way to get an image render cached. Renders the image offscreen,
 * waits for it to load, then removes it.
 */
export const renderTempImage = async (imgSrcOrSet) => {
  const img = document.createElement('img');

  if (typeof imgSrcOrSet === 'string') {
    img.src = imgSrcOrSet;
  } else {
    img.srcset = urlsToSet(imgSrcOrSet);
  }

  img.style.position = 'absolute';
  img.style.top = `${window.innerHeight + 100}px`;
  img.style.left = '0px';

  document.body.appendChild(img);
  await untilNextFrame();
  await untilImageLoads(img);
  await untilNextFrame();

  img.remove();
};
