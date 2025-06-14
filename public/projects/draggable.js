import { h, Fragment } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

// Percent of an element must be passed before position swap
const SWAP_THRESHOLD = 0.3;

const DEFAULT_DRAG_INFO = {
  dragged: null,
  draggedOver: null,
  cursorOffsetX: -1,
  cursorOffsetY: -1,
  dragX: -1,
  dragY: -1,
  enterX: -1,
  enterY: -1
};

// Duration grows quickly with distance but then levels off
const calcMoveDuration = dist => Math.max(0, 150 * Math.log(1.5 * dist) - 300);

const animateMove = (element, movedX, movedY) => {
  const distance = Math.sqrt(movedX ** 2 + movedY ** 2);
  const duration = calcMoveDuration(distance);

  element.animate(
    [
      {
        transformOrigin: 'top left',
        transform: `translate(${movedX}px, ${movedY}px)`
      },
      { transformOrigin: 'top left', transform: 'none' }
    ],
    { duration, easing: 'ease', fill: 'both' }
  );
};

/**
 * Uses the HTML Drag and Drop API to render an array of props as draggable
 * components which can be rearranged.
 *
 * @param {object} props - DragAndDrop props as well as any div props
 * @param {array} props.propsForDraggables - Array of props to render draggable
 *     elements with (one object per element, order determines initial order)
 * @param {object} [props.draggableComponent] - Component to render draggable
 *     elements as, defaults to div
 */
export function DragAndDrop({
  propsForDraggables,
  draggableComponent = 'div',
  ...divProps
}) {
  const [draggables, setDraggables] = useState([]);
  const dragInfo = useRef(DEFAULT_DRAG_INFO);

  // Use keys to match updated props to rendered elements even if reordered
  useEffect(() => {
    setDraggables(prevDraggables => {
      const updatedPropsInOrder = prevDraggables
        .map(d => propsForDraggables.find(props => d.key === props.key))
        .filter(Boolean);

      const newProps = propsForDraggables.filter(props => !updatedPropsInOrder.includes(props));
      const orderedProps = [...updatedPropsInOrder, ...newProps];

      return orderedProps.map((props, i) => ({ key: `draggable-${i}`, ...props }));
    });
  }, [propsForDraggables, setDraggables]);

  // This is hacky, but if we want to control the animation when the drag ends,
  // there has to be a successful drop, so the whole page must be a "drop zone"
  useEffect(() => {
    const onDragOver = (event) => {
      // "Cancel" the dragenter event to turn the body into a drop zone
      event.preventDefault();

      // Coordinates on drag and dragend events are inconsistent across browsers.
      // Must use dragover on the body to get last drag position consistently.
      dragInfo.current.dragX = event.clientX;
      dragInfo.current.dragY = event.clientY;
    };

    const onDrop = () => {
      const { x, y, width, height } = dragInfo.current.dragged.getBoundingClientRect();
      const movedX = dragInfo.current.dragX - dragInfo.current.cursorOffsetX - x;
      const movedY = dragInfo.current.dragY - dragInfo.current.cursorOffsetY - y;
      animateMove(dragInfo.current.dragged, movedX, movedY);
    };

    document.body.addEventListener('dragover', onDragOver);
    document.body.addEventListener('drop', onDrop);

    return () => {
      document.body.removeEventListener('dragover', onDragOver);
      document.body.removeEventListener('drop', onDrop);
    };
  }, [dragInfo]);

  const onDragStart = useCallback((event) => {
    event.dataTransfer.effectAllowed = 'move';

    dragInfo.current.dragged = event.target.closest('[draggable=true]');
    dragInfo.current.cursorOffsetX = event.offsetX;
    dragInfo.current.cursorOffsetY = event.offsetY;

    // DOM node must be visible when set as drag image, but we can hide it after
    requestAnimationFrame(() => {
      dragInfo.current.dragged.setAttribute('style', 'opacity: 0');
    });
  }, [dragInfo]);

  const onDragEnd = useCallback(() => {
    dragInfo.current.dragged.setAttribute('style', 'opacity: 1');
    Object.assign(dragInfo.current, DEFAULT_DRAG_INFO);
  }, [dragInfo]);

  const onDragEnter = useCallback((event) => {
    const draggedEnterElement = event.target.closest('[draggable=true]');

    // Ignore dragenter events from the currently dragged element
    if (draggedEnterElement === dragInfo.current.dragged) {
      return;
    }

    // Ignore repeat dragenter events from children being passed over
    if (draggedEnterElement === dragInfo.current.draggedOver) {
      return;
    }

    dragInfo.current.draggedOver = draggedEnterElement;
    dragInfo.current.enterX = event.clientX;
    dragInfo.current.enterY = event.clientY;
  }, [dragInfo]);

  const onDragOver = useCallback((event) => {
    const draggedOverElement = event.target.closest('[draggable=true]');

    // Ignore dragover events from elements that did not emit last dragenter
    if (draggedOverElement !== dragInfo.current.draggedOver) {
      return;
    }

    const { width, height } = draggedOverElement.getBoundingClientRect();
    const thresholdX = width * SWAP_THRESHOLD;
    const thresholdY = height * SWAP_THRESHOLD;

    const distanceX = Math.abs(dragInfo.current.enterX - event.clientX);
    const distanceY = Math.abs(dragInfo.current.enterY - event.clientY);

    // Dragged element has moved far enough, swap position with dragged over element
    if (distanceX > thresholdX || distanceY > thresholdY) {
      dragInfo.current.draggedOver = null;

      setDraggables(prevDraggables => {
        const draggedKey = dragInfo.current.dragged.getAttribute('data-drag-and-drop-key');
        const draggedOverKey = draggedOverElement.getAttribute('data-drag-and-drop-key');

        const draggedIndex = prevDraggables.findIndex(d => d.key === draggedKey);
        const draggedOverIndex = prevDraggables.findIndex(d => d.key === draggedOverKey);

        const nextDraggables = [...prevDraggables];
        nextDraggables[draggedIndex] = prevDraggables[draggedOverIndex];
        nextDraggables[draggedOverIndex] = prevDraggables[draggedIndex];

        const draggedLoc = dragInfo.current.dragged.getBoundingClientRect();
        const draggedOverLoc = draggedOverElement.getBoundingClientRect();
        const movedX = draggedOverLoc.x - draggedLoc.x;
        const movedY = draggedOverLoc.y - draggedLoc.y;
        animateMove(draggedOverElement, movedX, movedY);

        return nextDraggables;
      });
    }
  }, [dragInfo, setDraggables]);

  const className = ['drag-and-drop', divProps.class ?? ''].join(' ').trim();

  return h('div', { ...divProps, class: className },
    draggables.map(({ key, ...draggableProps }) => (
      h(draggableComponent, {
        key,
        'data-drag-and-drop-key': key,
        draggable: true,
        onDragStart,
        onDragEnd,
        onDragEnter,
        onDragOver,
        ...draggableProps
      })
    ))
  );
}
