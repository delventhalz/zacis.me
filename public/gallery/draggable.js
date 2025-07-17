const DEFAULT_OPTIONS = {
  draggable: '[draggable="true"]',
  dragTrigger: '[draggable="true"]'
};

const handlePointerMove = (event, state) => {
  event.preventDefault();
  state.target.style.top = `${event.y - state.offset.y}px`;
  state.target.style.left = `${event.x - state.offset.x}px`;
  state.target.dispatchEvent(new DragEvent('drag', event));
};

const handlePointerUp = (event, state) => {
  event.preventDefault();
  state.restore();
  state.target.dispatchEvent(new DragEvent('dragend', event));
};

// Kicks off initial DOM modifications and all the other event listeners
const handlePointerDown = (event, settings) => {
  const trigger = event.target.closest(settings.dragTrigger);
  const target = trigger?.closest(settings.draggable);
  if (!trigger || !target || window.getComputedStyle(trigger).touchAction !== 'none') {
    return;
  }

  event.preventDefault();

  const { x, y } = target.getBoundingClientRect();
  const offset = {
    x: event.x - x,
    y: event.y - y
  };

  const placeholder = target.cloneNode();
  placeholder.opacity = 0;
  placeholder.inert = true;
  target.replaceWith(placeholder);

  const originalStyles = {
    position: target.style.position,
    top: target.style.top,
    left: target.style.left
  };

  target.style.position = 'fixed';
  target.style.top = `${y}px`;
  target.style.left = `${x}px`;
  settings.container.append(target);

  // Mutable state shared by all handlers
  const state = { target, offset, settings };

  const onPointerMove = ev => handlePointerMove(ev, state);
  const onPointerUp = ev => handlePointerUp(ev, state);

  target.dispatchEvent(new DragEvent('dragstart', event));
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  state.restore = () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    target.style.position = originalStyles.position;
    target.style.top = originalStyles.top;
    target.style.left = originalStyles.left;
    placeholder.replaceWith(target);
  };
};

/**
 * Sets up drag listeners on the specified container node and returns a function
 * which will disconnect those listeners. After setup, whenever a drag trigger
 * is pressed, the normal click/touch behavior is overridden and the wrapping
 * draggable element will move with the pointer until it is lifted.
 *
 * Drag gestures will emit the following DOM events:
 *   - "dragstart"
 *   - "drag" (on every pointer movement)
 *   - "dragend"
 *
 * By default a draggable element is any element with the "draggable" property,
 * but this can be customized by passing a CSS selector to the init options.
 *
 * A drag trigger element must:
 *   - be within a draggable element or be the draggable element itself
 *   - have the style touch-action: none
 *   - match a CSS selector (also '[draggable="true"]' by default)
 */
export const initDraggable = (container, options = {}) => {
  const settings = { container, ...DEFAULT_OPTIONS, ...options };

  const onPointerDown = ev => handlePointerDown(ev, settings);
  container.addEventListener('pointerdown', onPointerDown);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown);
  };
};
