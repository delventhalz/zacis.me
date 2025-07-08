import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { fadeIn, fadeOut } from './animations.js';

const FADE_DURATION = 600;

const matchChildElements = (parent, flatChildren) => {
  const childElements = [...parent.children];
  return flatChildren.map((child) => {
    return child && typeof child === 'object' ? childElements.shift() : null;
  });
};

// Equivalent to findIndex but returns -1 if there is more than one match
const matchIndex = (array, matcher) => {
  let matchedIndex = -1;

  for (let i = 0; i < array.length; i += 1) {
    if (matcher(array[i])) {
      if (matchedIndex !== -1) {
        return -1;
      }

      matchedIndex = i;
    }
  }

  return matchedIndex;
};

const isDefined = (val) => {
  return val !== undefined && val !== null;
};

const isDefinedMatch = (a, b) => {
  return isDefined(a) && isDefined(b) && a === b;
};

const matchChildIndex = (childArray, child) => {
  if (!child || typeof child !== 'object') {
    return -1;
  }

  const byKeyIndex = matchIndex(childArray, ch => isDefinedMatch(ch?.key, child.key));
  if (byKeyIndex !== -1) {
    return byKeyIndex;
  }

  const byIdIndex = matchIndex(childArray, ch => isDefinedMatch(ch?.props?.id, child.props?.id));
  if (byIdIndex !== -1) {
    return byIdIndex;
  }

  const byIdentityIndex = matchIndex(childArray, ch => ch === child);
  if (byIdentityIndex !== -1) {
    return byIdentityIndex;
  }

  return -1;
};

const animateReorder = (element, end) => {
  const start = element.getBoundingClientRect();
  const movedX = start.x - end.x;
  const movedY = start.y - end.y;

  // Duration grows quickly with distance but then levels off, 500ms ~ 800ms
  const distance = Math.sqrt(movedX ** 2 + movedY ** 2);
  const duration = Math.max(0, 150 * Math.log(1.5 * distance) - 300);

  element.animate(
    [
      {
        transformOrigin: 'top left',
        transform: `translate(${movedX}px, ${movedY}px)`,
      },
      {},
    ],
    { duration, easing: 'ease-in-out' }
  );
};

/**
 * A wrapper component designed to animate changes in children. Animates moves
 * from one index to another, as well as fades in/out (using "display" prop).
 */
export function Animated({ children, ...divProps }) {
  const parentRef = useRef(null);
  const locationCacheRef = useRef([]);
  const [renderedChildren, setRenderedChildren] = useState(children);

  useEffect(() => {
    setRenderedChildren(prevChildren => {
      const flatPrevChildren = prevChildren.flat(Infinity);
      const flatNextChildren = children.flat(Infinity);
      const childElements = matchChildElements(parentRef.current, flatPrevChildren);
      const childLocations = childElements.map(el => el.getBoundingClientRect());

      // Start animations for index changes
      flatNextChildren.forEach((child, nextIndex) => {
        const prevIndex = matchChildIndex(flatPrevChildren, child);
        if (prevIndex !== -1 && prevIndex !== nextIndex) {
          const end = childLocations[nextIndex] ?? locationCacheRef.current[nextIndex];
          if (end) {
            animateReorder(childElements[prevIndex], end);
          }
        }

        const prevChild = flatPrevChildren[prevIndex];
        if (prevChild && prevChild.props.display && !child.props.display) {
          childElements[prevIndex].inert = true;
          fadeOut(childElements[prevIndex], { duration: FADE_DURATION });
        }
        if (prevChild && !prevChild.props.display && child.props.display) {
          childElements[prevIndex].inert = false;
          fadeIn(childElements[prevIndex], { duration: FADE_DURATION });
        }
      });

      // Keep previous locations cached in case we return to a previous size
      if (childLocations.length >= locationCacheRef.current.length) {
        locationCacheRef.current = childLocations;
      }

      // Render updated children only after animation starts
      return children;
    });
  }, [children]);

  return h('div', { ...divProps, ref: parentRef },
    renderedChildren
  );
}
