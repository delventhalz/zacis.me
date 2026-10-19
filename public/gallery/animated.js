import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { fadeIn, fadeOut, moveFrom } from './animations.js';
import { getDomNode } from './dom.js';

const FADE_DURATION = 600;

const IGNORE_PROP = '__animated_ignore_child';

const hasUniqueProp = (array, propName) => {
  const seen = [];

  for (const item of array) {
    if (!item || !item.hasOwnProperty(propName)) {
      return false;
    }

    if (seen.includes(item[propName])) {
      return false;
    }

    seen.push(item[propName]);
  }

  return true;
};

const getAnimatableElements = (parentRef) => {
  const parent = getDomNode(parentRef);
  return parent ? [...parent.children].filter(ch => !ch[IGNORE_PROP]) : [];
};

const attachFixedClone = (parentRef, element) => {
  const targetLoc = element.getBoundingClientRect();

  const fixedClone = element.cloneNode(true);
  fixedClone[IGNORE_PROP] = true;
  fixedClone.ariaHidden = true;
  fixedClone.inert = true;

  fixedClone.style.position = 'fixed';
  fixedClone.style.top = `${targetLoc.y}px`;
  fixedClone.style.left = `${targetLoc.x}px`;

  getDomNode(parentRef).prepend(fixedClone);

  // Deal with border-box shifting position on me
  const shiftedLoc = fixedClone.getBoundingClientRect();
  const shiftX = targetLoc.x - shiftedLoc.x;
  const shiftY = targetLoc.y - shiftedLoc.y;
  fixedClone.style.top = `${targetLoc.y + shiftY}px`;
  fixedClone.style.left = `${targetLoc.x + shiftX}px`;

  return fixedClone;
};

/**
 * A wrapper component designed to naturally animate changes in children.
 * Must provide a flat array of children with unique keys to animate.
 *
 * Animates:
 *   - Moves from one index to another
 *   - Fade out on removal
 *   - Fade in on addition
 *   - Fade in/out on toggling the "display" prop on the child
 */
export function Animated({ children, ...divProps }) {
  const parentRef = useRef(null);
  const [renderedChildren, setRenderedChildren] = useState(children);

  useEffect(() => {
    if (!Array.isArray(children) || !hasUniqueProp(children, 'key')) {
      console.warn('Pass Animated a flat array of children with unique keys to animate');
      setRenderedChildren(children);
      return;
    }

    setRenderedChildren(prevChildren => {
      const prevElements = getAnimatableElements(parentRef);
      const prevLocations = prevElements.map(el => el.getBoundingClientRect());

      // Clone elements which are about to be removed so we can keep them
      // around long enough to fade out
      const prevElementsToFade = prevChildren.flatMap((prevChild, prevIndex) => {
        if (children.some(ch => ch.key === prevChild.key)) {
          return [];
        }

        const fadingElement = attachFixedClone(parentRef, prevElements[prevIndex]);
        return [fadingElement];
      });

      // Trigger all animations after preact renders the next children
      requestAnimationFrame(() => {
        const nextElements = getAnimatableElements(parentRef);

        for (const element of prevElementsToFade) {
          fadeOut(element, { duration: FADE_DURATION }).then(() => {
            element.remove();
          });
        }

        children.forEach((nextChild, nextIndex) => {
          const prevChild = prevChildren.find(ch => ch.key === nextChild.key);
          const prevIndex = prevChildren.findIndex(ch => ch.key === nextChild.key);
          const element = nextElements[nextIndex];

          if (!prevChild) {
            fadeIn(element, { duration: FADE_DURATION });
          }

          if (prevChild && prevIndex !== nextIndex) {
            moveFrom(element, prevLocations[prevIndex], { dynamicDuration: 0.6 });
          }

          if (prevChild && prevChild.props.display && !nextChild.props.display) {
            element.inert = true;
            fadeOut(element, { duration: FADE_DURATION }).then(() => {
              element.classList.add('hidden');
            });
          }

          if (prevChild && !prevChild.props.display && nextChild.props.display) {
            element.inert = false;
            fadeIn(element, { duration: FADE_DURATION}).then(() => {
              element.classList.remove('hidden');
            });
          }
        });
      });

      return children;
    });
  }, [children]);

  return h('div', { ...divProps, ref: parentRef },
    renderedChildren
  );
}
