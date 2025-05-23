import { h, Fragment } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

const DEFAULT_DRAG_INFO = {
  dragged: null,
  draggedOver: null,
  draggedX: -1,
  draggedY: -1,
  enterX: -1,
  enterY: -1
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

  const onDragStart = useCallback((event) => {
    event.dataTransfer.effectAllowed = 'move';

    const draggedElement = event.target.closest('[draggable=true]');
    dragInfo.current.dragged = draggedElement;

    const { x, y } = draggedElement.getBoundingClientRect();
    dragInfo.current.draggedX = x;
    dragInfo.current.draggedY = y;

    // The DOM node must be visible when it gets set as the drag image,
    // but we can hide it immediately afterwards
    requestAnimationFrame(() => {
      draggedElement.setAttribute('style', 'opacity: 0');
    });
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
    const midpointX = width / 2;
    const midpointY = height / 2;

    const distanceX = Math.abs(dragInfo.current.enterX - event.clientX);
    const distanceY = Math.abs(dragInfo.current.enterY - event.clientY);

    if (distanceX > midpointX || distanceY > midpointY) {
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

      const movedX = x - dragInfo.current.draggedX;
      const movedY = y - dragInfo.current.draggedY;

      requestAnimationFrame(() => {
        draggedOverElement.animate(
          [
            {
              transformOrigin: 'top left',
              transform: `translate(${movedX}px, ${movedY}px)`
            },
            { transformOrigin: 'top left', transform: 'none' }
          ],
          { duration: 500, easing: 'ease', fill: 'both' }
        );
      });
    }
  }, [setDraggables]);

  const onDragEnd = useCallback((event) => {
    const draggedElement = event.target.closest('[draggable=true]');
    draggedElement.setAttribute('style', 'opacity: 1');

    Object.assign(dragInfo.current, DEFAULT_DRAG_INFO);
  }, [dragInfo]);

  // Must cancel wrapping dragenter and dragover events to create a drop zone
  const cancelDragEvent = useCallback((event) => {
    event.preventDefault();
  }, []);

  return h('div',
    {
      onDragEnter: cancelDragEvent,
      onDragOver: cancelDragEvent,
      ...renderProps
    },
    draggables.map(({ key, ...draggableProps }) => (
      h(draggableComponent, {
        key,
        'data-drag-and-drop-key': key,
        draggable: true,
        onDragStart,
        onDragEnter,
        onDragOver,
        onDragEnd,
        ...draggableProps
      })
    ))
  );
}
