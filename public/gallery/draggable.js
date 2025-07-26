const DEFAULT_OPTIONS = {
  draggable: '[draggable="true"]',
  dragTrigger: '[draggable="true"]',
  droppable: '[data-droppable="true"]'
};

const handleEnterLeave = (event, state) => {
  const droppables = [...state.settings.container.querySelectorAll(state.settings.droppable)];
  const hits = droppables.filter(element => {
    const location = element.getBoundingClientRect();
    return element !== state.target
      && element !== state.placeholder
      && !element.inert
      && !element.disabled
      && event.x > location.x
      && event.x < location.x + location.width
      && event.y > location.y
      && event.y < location.y + location.height;
  });

  // Sort hits by which is displayed on top
  hits.reverse().sort((a, b) => {
    const zStyleA = a.style.zIndex ?? window.getComputedStyle(a).zIndex;
    const zStyleB = b.style.zIndex ?? window.getComputedStyle(b).zIndex;
    const zIndexA = isNaN(zStyleA) ? Number.MIN_SAFE_INTEGER : Number(zStyleA);
    const zIndexB = isNaN(zStyleB) ? Number.MIN_SAFE_INTEGER : Number(zStyleB);
    return zIndexB - zIndexA;
  });

  const dropTarget = hits[0] ?? null;
  if (dropTarget === state.dropTarget) {
    return;
  }

  if (state.dropTarget) {
    state.dropTarget.dispatchEvent(new DragEvent('dragleave', event));
  }

  state.dropTarget = dropTarget;

  if (dropTarget) {
    dropTarget.dispatchEvent(new DragEvent('dragenter', event));
  }
};

const handlePointerMove = (event, state) => {
  event.preventDefault();
  state.target.style.top = `${event.y - state.offset.y}px`;
  state.target.style.left = `${event.x - state.offset.x}px`;
  state.target.dispatchEvent(new DragEvent('drag', event));

  // Let new coordinates render immediately before running enter/leave logic
  requestAnimationFrame(() => {
    handleEnterLeave(event, state);
  });
};

const handlePointerUp = (event, state) => {
  event.preventDefault();
  state.restore();

  if (state.dropTarget) {
    state.dropTarget.dispatchEvent(new DragEvent('drop', event));
  }

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
  const state = {
    target,
    dropTarget: null,
    placeholder,
    offset,
    settings
  };

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
 * Dragging will emit the following DOM events on the draggable element:
 *   - "dragstart"
 *   - "drag" (on every pointer movement)
 *   - "dragend"
 *
 * Additionally, dragging will emit these events on the top "droppable" element
 * which the drag gesture passes over:
 *   - "dragenter"
 *   - "dragleave"
 *   - "drop" (if released over droppable element)
 *
 * By default, a draggable element is any element with the "draggable" property
 * set to "true", and can be customized with a CSS selector in the init options.
 *
 * By default, a droppable element is any element with the "data-droppable"
 * property set to "true", and can also be customized with a CSS selector.
 *
 * A drag trigger element must satisfy three criteria:
 *   - It must be within a draggable element or be a draggable element itself
 *   - It must have the style touch-action: none
 *   - It must match a CSS selector ('[draggable="true"]' by default)
 */
export const initDraggable = (container, options = {}) => {
  const settings = { container, ...DEFAULT_OPTIONS, ...options };

  const onPointerDown = ev => handlePointerDown(ev, settings);
  container.addEventListener('pointerdown', onPointerDown);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown);
  };
};
