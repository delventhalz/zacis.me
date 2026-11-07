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
 * Sends a low priority fetch request for a resource so it will be cached
 */
export const cacheResource = async (resourceUrl) => {
  await fetch(resourceUrl, { priority: 'low', cache: 'reload' });
};

/**
 * Caches the correct pixel density image from an array of image urls.
 * Array must be sorted starting with 1x, then 2x, and so on with no gaps.
 */
export const cacheImageSet = async (imageUrls) => {
  const usedIndex = Math.ceil(window.devicePixelRatio - 1);
  const imageUrl = imageUrls[usedIndex] ?? imageUrls.at(-1);
  await cacheResource(imageUrl);
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
