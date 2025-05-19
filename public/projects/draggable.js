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

    const { x, y } = event.target.getBoundingClientRect();
    dragInfo.current.draggedX = x;
    dragInfo.current.draggedY = y;
  };

  const getOnDragEnter = (key) => (event) => {
    // Ignore dragenter events from the currently dragged element
    if (key === dragInfo.current.dragged) {
      return;
    }

    dragInfo.current.draggedOver = key;
    dragInfo.current.enterX = event.offsetX;
    dragInfo.current.enterY = event.offsetY;
  };

  const getOnDragOver = (key) => (event) => {
    // Ignore dragover events from the currently dragged element
    if (key === dragInfo.current.dragged) {
      return;
    }

    const distanceX = Math.abs(dragInfo.current.enterX - event.offsetX);
    const distanceY = Math.abs(dragInfo.current.enterY - event.offsetY);
    const midpointX = event.target.offsetWidth / 2;
    const midpointY = event.target.offsetHeight / 2;

    if (distanceX > midpointX || distanceY > midpointY) {
      setDraggables(prevDraggables => {
        const draggedIndex = prevDraggables.findIndex(d => d.key === dragInfo.current.dragged);
        const draggedOverIndex = prevDraggables.findIndex(d => d.key === dragInfo.current.draggedOver);

        const nextDraggables = [...prevDraggables];
        nextDraggables[draggedIndex] = prevDraggables[draggedOverIndex];
        nextDraggables[draggedOverIndex] = prevDraggables[draggedIndex];

        return nextDraggables;
      });

      const moveStart = event.target.getBoundingClientRect();
      const moveX = moveStart.x - dragInfo.current.draggedX;
      const moveY = moveStart.y - dragInfo.current.draggedY;

      requestAnimationFrame(() => {
        event.target.animate(
          [
            {
              transformOrigin: 'top left',
              transform: `translate(${moveX}px, ${moveY}px)`
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
