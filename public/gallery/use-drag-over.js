import { useEffect, useRef } from 'preact/hooks';
import { getDomNode } from './dom.js';

const DEFAULT_OPTIONS = {
  container: document.body,
  threshold: 0
};

const INITIAL_STATE = {
  target: null,
  dropTarget: null,
  dropLocation: null,
  enter: null,
  restore: null,
  restoreEnter: null
};

const handleDrag = (stateRef, event) => {
    const {
      target,
      dropTarget,
      dropLocation,
      enter,
      restoreEnter,
      settings
    } = stateRef.current;

    const thresholdX = dropLocation.width * settings.threshold;
    const thresholdY = dropLocation.height * settings.threshold;
    const distanceX = Math.abs(enter.x - event.x);
    const distanceY = Math.abs(enter.y - event.y);

    if (distanceX > thresholdX || distanceY > thresholdY) {
      restoreEnter?.();
      settings.onDragOver(target, dropTarget);
    }
};

const handleDragEnter = (stateRef, event) => {
  const container = getDomNode(stateRef.current.settings.container);
  stateRef.current.dropTarget = event.target;
  stateRef.current.dropLocation = event.target.getBoundingClientRect();
  stateRef.current.enter = event;

  const onDrag = ev => handleDrag(stateRef, ev);
  container.addEventListener('drag', onDrag);

  stateRef.current.restoreEnter = () => {
    container.removeEventListener('drag', onDrag);
    stateRef.current.dropTarget = null;
    stateRef.current.dropLocation = null;
    stateRef.current.enter = null;
    stateRef.current.restoreEnter = null;
  };
};

const handleDragLeave = (stateRef, _event) => {
  stateRef.current.restoreEnter?.();
};

const handleDragEnd = (stateRef, _event) => {
  stateRef.current.restoreEnter?.();
  stateRef.current.restore?.();
};

const handleDragStart = (stateRef, event) => {
  const container = getDomNode(stateRef.current.settings.container);
  stateRef.current.target = event.target;

  const onDragEnter = ev => handleDragEnter(stateRef, ev);
  const onDragLeave = ev => handleDragLeave(stateRef, ev);
  const onDragEnd = ev => handleDragEnd(stateRef, ev);

  container.addEventListener('dragenter', onDragEnter);
  container.addEventListener('dragleave', onDragLeave);
  container.addEventListener('dragend', onDragEnd);

  stateRef.current.restore = () => {
    container.removeEventListener('dragenter', onDragEnter);
    container.removeEventListener('dragleave', onDragLeave);
    container.removeEventListener('dragend', onDragEnd);
    Object.assign(stateRef.current, INITIAL_STATE);
  };
};

/**
 * A hook which attaches a "drag over" listener to draggable elements within a
 * container (document.body by default). This listener will be called with two
 * arguments, the draggable element and the overlapped droppable element, every
 * time an element is dragged such that the pointer overlaps a droppable
 * element. The listener will fire only once per overlap. For it to fire again,
 * the pointer would have to leave the droppable element and then pass into
 * another (or return to a previous droppable).
 *
 * By default the listener will fire as soon as the pointer crosses into the
 * droppable element, but this behavior can be customized with a "threshold",
 * which is a 0 to 1 percentage of how much of the droppable element must be
 * crossed.
 */
export const useDragOver = (onDragOver, options = {}) => {
  const stateRef = useRef({ ...INITIAL_STATE, settings: {} });
  stateRef.current.settings.onDragOver = onDragOver;
  Object.assign(stateRef.current.settings, DEFAULT_OPTIONS, options);

  const container = getDomNode(stateRef.current.settings.container);

  useEffect(() => {
    if (!container) {
      return;
    }

    const onDragStart = ev => handleDragStart(stateRef, ev);
    container.addEventListener('dragstart', onDragStart);

    return () => {
      container.removeEventListener('dragstart', onDragStart);
    }
  }, [container]);
};
