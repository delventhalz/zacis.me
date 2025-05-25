import { h, Fragment } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

// How much of an element before swapping with it
const SWAP_THRESHOLD = 0.4;

const DEFAULT_DRAG_INFO = {
  dragged: null,
  draggedOver: null,
  cursorOffsetX: -1,
  cursorOffsetY: -1,
  lastX: -1,
  lastY: -1,
  enterX: -1,
  enterY: -1
};

// Duration grows quickly with distance but then levels off
const calcMoveDuration = dist => Math.max(0, 150 * Math.log(1.5 * dist) - 300);

const animateMove = (element, movedX, movedY) => {
  requestAnimationFrame(() => {
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
  });
};

const hasRunningAnimation = (element) => {
  return element.getAnimations().some(anim => anim.playState === 'running');
};

/**
 * Render an array of props as draggable components which can be rearranged.
 *
 * @param {object} props - DragAndDrop as well as any div props
 * @param {array} props.propsForDraggables - Array of props to render draggable
 *     elements with, one object per element, determines initial order
 * @param {object} props.draggableComponent - Component to render draggable
 *     elements as, defaults to div
 */
export function DragAndDrop({
  propsForDraggables,
  draggableComponent = 'div',
  ...renderProps
}) {
  const [draggables, setDraggables] = useState([]);
  const dragInfo = useRef(DEFAULT_DRAG_INFO);

  useEffect(() => {
    // Use key to match updated props to rendered elements even if reordered
    setDraggables(prevDraggables => {
      const updatedPropsInOrder = prevDraggables
        .map(d => propsForDraggables.find(props => d.key === props.key))
        .filter(Boolean);

      const newProps = propsForDraggables.filter(props => !updatedPropsInOrder.includes(props));
      const orderedProps = [...updatedPropsInOrder, ...newProps];

      // Ensure every passed draggable props always has a unique key
      return orderedProps.map((props, i) => ({ key: `draggable-${i}`, ...props }));
    });
  }, [propsForDraggables]);

  useEffect(() => {
    const cancelDragEvent = (event) => {
      event.preventDefault();
    };

    const onDrop = () => {
      const { x, y, width, height } = dragInfo.current.dragged.getBoundingClientRect();
      const movedX = dragInfo.current.lastX - dragInfo.current.cursorOffsetX - x;
      const movedY = dragInfo.current.lastY - dragInfo.current.cursorOffsetY - y;

      animateMove(dragInfo.current.dragged, movedX, movedY);
    };

    // This is a massive hack, but if we want to control the animation when
    // the drag ends, there has to be a successful drop, and for there to
    // be a drop anywhere on the page, the whole page must be a "drop zone"
    document.body.addEventListener('dragenter', cancelDragEvent);
    document.body.addEventListener('dragover', cancelDragEvent);
    document.body.addEventListener('drop', onDrop);

    return () => {
      document.body.removeEventListener('dragenter', cancelDragEvent);
      document.body.removeEventListener('dragover', cancelDragEvent);
      document.body.removeEventListener('drop', onDrop);
    };
  }, [dragInfo])

  const onDragStart = useCallback((event) => {
    event.dataTransfer.effectAllowed = 'move';

    const draggedElement = event.target.closest('[draggable=true]');
    dragInfo.current.dragged = draggedElement;
    dragInfo.current.cursorOffsetX = event.offsetX;
    dragInfo.current.cursorOffsetY = event.offsetY;

    // The DOM node must be visible when it gets set as the drag image,
    // but we can hide it immediately afterwards
    requestAnimationFrame(() => {
      dragInfo.current.dragged.setAttribute('style', 'opacity: 0');
    });
  }, [dragInfo]);

  const onDrag = useCallback((event) => {
    dragInfo.current.lastX = event.clientX;
    dragInfo.current.lastY = event.clientY;
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

    // A dragenter event can repeat when passing over children
    if (draggedEnterElement === dragInfo.current.draggedOver) {
      return;
    }

    if (hasRunningAnimation(draggedEnterElement)) {
      return;
    }

    dragInfo.current.draggedOver = draggedEnterElement;
    dragInfo.current.enterX = event.clientX;
    dragInfo.current.enterY = event.clientY;
  }, [dragInfo]);

  const onDragOver = useCallback((event) => {
    const draggedOverElement = event.target.closest('[draggable=true]');

    // Ignore dragover events from the currently dragged element
    if (draggedOverElement === dragInfo.current.dragged) {
      return;
    }

    if (hasRunningAnimation(draggedOverElement)) {
      return;
    }

    const { x, y, width, height } = draggedOverElement.getBoundingClientRect();
    const thresholdX = width * SWAP_THRESHOLD;
    const thresholdY = height * SWAP_THRESHOLD;

    const distanceX = Math.abs(dragInfo.current.enterX - event.clientX);
    const distanceY = Math.abs(dragInfo.current.enterY - event.clientY);

    if (distanceX > thresholdX || distanceY > thresholdY) {
      setDraggables(prevDraggables => {
        const draggedKey = dragInfo.current.dragged.getAttribute('data-drag-and-drop-key');
        const draggedOverKey = dragInfo.current.draggedOver.getAttribute('data-drag-and-drop-key');

        const draggedIndex = prevDraggables.findIndex(d => d.key === draggedKey);
        const draggedOverIndex = prevDraggables.findIndex(d => d.key === draggedOverKey);

        const nextDraggables = [...prevDraggables];
        nextDraggables[draggedIndex] = prevDraggables[draggedOverIndex];
        nextDraggables[draggedOverIndex] = prevDraggables[draggedIndex];

        return nextDraggables;
      });

      const draggedLoc = dragInfo.current.dragged.getBoundingClientRect();
      const movedX = x - draggedLoc.x;
      const movedY = y - draggedLoc.y;

      animateMove(draggedOverElement, movedX, movedY);
    }
  }, [setDraggables]);

  return h('div', renderProps,
    draggables.map(({ key, ...draggableProps }) => (
      h(draggableComponent, {
        key,
        'data-drag-and-drop-key': key,
        draggable: true,
        onDrag,
        onDragStart,
        onDragEnd,
        onDragEnter,
        onDragOver,
        ...draggableProps
      })
    ))
  );
}
