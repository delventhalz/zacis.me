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
