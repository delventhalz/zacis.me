import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

const DEFAULT_UPDATE_COUNT = 2;

const waitForAnimationFrame = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
};

const isVisible = (element) => {
  if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
    return false;
  }

  const bounds = element.getBoundingClientRect();
  const top = window.scrollY;
  const bottom = top + window.innerHeight;
  const left = window.scrollX;
  const right = left + window.innerWidth;

  return bounds.top < bottom
    && bounds.bottom > top
    && bounds.left < right
    && bounds.right > left;
}

const updateCanvas = async (source, dest) => {
  if (window.html2canvas) {
    // Creating the canvas ourselves allows us to use willReadFrequently,
    // which will be more efficient during html2canvas's rapid reads
    const scratchpad = document.createElement('canvas');
    scratchpad.getContext('2d', { willReadFrequently: true });
    scratchpad.width = dest.width;
    scratchpad.height = dest.height;

    await window.html2canvas(source, {
      logging: false,
      scale: 1,
      removeContainer: false,
      canvas: scratchpad
    });

    // We aren't using html2canvas directly on our destination canvas
    // because it will flash as we watch the render happen piecemeal
    const ctx = dest.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(scratchpad, 0, 0);
  }
};

// Since visual changes don't render immediately and a canvas update can
// itself trigger visual changes, we are going to update in bursts.
// Use a single shared queue of updates to ensure updates are sequential.
const burstUpdateCanvas = async (source, dest, count, queue = []) => {
  // Only the first call with an empty queue should actually run the updates
  const shouldRunUpdates = queue.length === 0;

  if (queue.length < count) {
    queue.push(...Array(count - queue.length).fill(() => updateCanvas(source, dest)));
  }

  if (shouldRunUpdates) {
    while (queue.length > 0) {
      const updateFn = queue.shift();
      await waitForAnimationFrame();
      await updateFn();
    }
  }
};

/**
 * A very silly component. Uses html2canvas to create a render of some source
 * component (passed as either an element or a query string) and then updates
 * the render live as the source component changes.
 */
export function Mirror({
  source,
  defaultImage,
  updateCount = DEFAULT_UPDATE_COUNT,
  stopUpdate = false,
  onUpdate = () => Promise.resolve(),
  ...canvasProps
}) {
  const updateQueue = useMemo(() => [], []);
  const canvasRef = useRef(null);
  const [_, triggerRerender] = useState(null);

  const sourceElem = typeof source === 'string' ? document.querySelector(source) : source;
  const { width, height } = sourceElem.getBoundingClientRect();

  useEffect(() => {
    // The width and height won't be correct on the first pass
    // because Preact is still building the DOM
    triggerRerender();

    if (defaultImage) {
      fetch(defaultImage)
        .then(resp => resp.blob())
        .then(blob => createImageBitmap(blob))
        .then((bitmap) => {
          const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(bitmap, 0, 0, canvasRef.current.width, canvasRef.current.width);
        });
    }

    // Initial visual typically takes ~100ms to build
    burstUpdateCanvas(sourceElem, canvasRef.current, updateCount, updateQueue);
  }, []);

  useEffect(() => {
    if (stopUpdate) {
      return;
    }

    const update = async () => {
      if (isVisible(canvasRef.current) && await onUpdate() !== false) {
        burstUpdateCanvas(sourceElem, canvasRef.current, updateCount, updateQueue);
      }
    };

    const observer = new MutationObserver(update);
    observer.observe(sourceElem, {
      attributes: true,
      childList: true,
      subtree: true
    });

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);

    };
  }, [sourceElem, updateCount, stopUpdate, onUpdate]);

  return h('canvas', {
    ref: canvasRef,
    width,
    height,
    ...canvasProps
  });
}
