import { h, Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

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

  const dragInfo = useRef({
    dragged: '',
    draggedOver: '',
    draggedX: -1,
    draggedY: -1,
    enterX: -1,
    enterY: -1
  });

  useEffect(() => {
    setDraggables(prevDraggables => {
      const updatedPropsInOrder = prevDraggables
        .map(d => propsForDraggables.find(props => d.key === props.key))
        .filter(Boolean);

      const newProps = propsForDraggables.filter(props => !updatedPropsInOrder.includes(props));
      const orderedProps = [...updatedPropsInOrder, ...newProps];

      return orderedProps.map((props, i) => ({ key: `draggable-${i}`, ...props }));
    });
  }, [propsForDraggables]);

  const getOnDragStart = (key) => (event) => {
    event.dataTransfer.effectAllowed = 'move';
    dragInfo.current.dragged = key;

    const draggedElement = event.target.closest('[draggable=true]');
    const { x, y } = draggedElement.getBoundingClientRect();
    dragInfo.current.draggedX = x;
    dragInfo.current.draggedY = y;
  };

  const getOnDragEnter = (key) => (event) => {
    // Ignore dragenter events from the currently dragged element
    if (key === dragInfo.current.dragged) {
      return;
    }

    // A dragenter event can repeat when passing over children
    if (dragInfo.current.draggedOver === key) {
      return;
    }

    dragInfo.current.draggedOver = key;
    dragInfo.current.enterX = event.clientX;
    dragInfo.current.enterY = event.clientY;
  };

  const getOnDragOver = (key) => (event) => {
    // Ignore dragover events from the currently dragged element
    if (key === dragInfo.current.dragged) {
      return;
    }

    const draggedOverElement = event.target.closest('[draggable=true]');
    const { x, y, width, height } = draggedOverElement.getBoundingClientRect();
    const midpointX = width / 2;
    const midpointY = height / 2;

    const distanceX = Math.abs(dragInfo.current.enterX - event.clientX);
    const distanceY = Math.abs(dragInfo.current.enterY - event.clientY);

    if (distanceX > midpointX || distanceY > midpointY) {
      setDraggables(prevDraggables => {
        const draggedIndex = prevDraggables.findIndex(d => d.key === dragInfo.current.dragged);
        const draggedOverIndex = prevDraggables.findIndex(d => d.key === dragInfo.current.draggedOver);

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
  };

  // Must cancel wrapping dragenter and dragover events to create a drop zone
  const cancelDragEvent = (event) => {
    event.preventDefault();
  }

  return h('div',
    {
      onDragEnter: cancelDragEvent,
      onDragOver: cancelDragEvent,
      ...renderProps
    },
    draggables.map(({ key, ...draggableProps }) => (
      h(draggableComponent, {
        key,
        draggable: true,
        onDragStart: getOnDragStart(key),
        onDragEnter: getOnDragEnter(key),
        onDragOver: getOnDragOver(key),
        ...draggableProps
      })
    ))
  );
}
