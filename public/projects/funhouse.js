import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

const DEFAULT_UPDATE_COUNT = 4;
const REPLACE_MEMOS = new Set();
const UPDATE_QUEUES = new Map();

const waitForAnimationFrame = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
};

const updateCanvas = async (source, dest) => {
  if (window.html2canvas) {
    // Creating the canvas ourselves allows us to use willReadFrequently,
    // which will be more efficient (and quiet a Chrome warning)
    const scratchpad = document.createElement('canvas');
    scratchpad.getContext('2d', { willReadFrequently: true });
    scratchpad.width = dest.width;
    scratchpad.height = dest.height;

    await window.html2canvas(source, {
      logging: false,
      scale: 1,
      canvas: scratchpad
    });

    // We aren't using html2canvas directly on our destination canvas
    // because then it will flash as we  watch the render happen piecemeal
    const ctx = dest.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(scratchpad, 0, 0);
  }
};

// Since visual changes don't always render immediately and a canvas update can
// itself trigger visual changes, we are going to update in bursts
const burstUpdateCanvas = async (source, dest, count) => {
  if (!UPDATE_QUEUES.has(dest)) {
    UPDATE_QUEUES.set(dest, []);
  };

  const queue = UPDATE_QUEUES.get(dest);

  if (queue.length == 0) {
    queue.push(...Array(count).fill(() => updateCanvas(source, dest)));
    while(queue.length > 0) {
      const updateFn = queue.shift();
      await waitForAnimationFrame();
      await updateFn();
    }
  } else if (queue.length < count) {
    queue.push(...Array(count - queue.length).fill(() => updateCanvas(source, dest)));
  }
};

// My v1 approach was to use the DOM to replace an image element with the canvas.
// Not totally prepared to give up on this approach yet.
export function replaceWithMirror(
  sourceQuery,
  destinationQuery,
  updateCount = DEFAULT_UPDATE_COUNT
) {
  // Ensure we never have multiple canvas replacements for the same destination
  if (REPLACE_MEMOS.has(destinationQuery)) {
    return;
  }

  const source = document.querySelector(sourceQuery);
  const destination = document.querySelector(destinationQuery);

  if (!source || !destination) {
    requestAnimationFrame(() => mirror(sourceQuery, destinationQuery));
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.classList.add(...destination.classList);

  const { width, height, left, top } = source.getBoundingClientRect();
  canvas.width = width;
  canvas.height = height;
  destination.replaceWith(canvas);

  // Initial visual, typically takes ~100ms to build
  burstUpdateCanvas(source, canvas, updateCount);

  // Update any time source changes
  const observer = new MutationObserver(() => {
    burstUpdateCanvas(source, canvas, updateCount);
  });

  observer.observe(source, { attributes: true, childList: true, subtree: true });
  REPLACE_MEMOS.add(destinationQuery);

  return () => {
    observer.disconnect();
    REPLACE_MEMOS.remove(destinationQuery);
  };
}

// Same functionality as replaceWithMirror but in a Preact component
export function Mirror({
  source,
  defaultImage,
  updateCount = DEFAULT_UPDATE_COUNT,
  ...canvasProps
}) {
  const canvasRef = useRef(null);
  const [_, triggerRerender] = useState(null);

  const sourceElem = typeof source === 'string' ? document.querySelector(source) : source;
  const { width, height } = sourceElem.getBoundingClientRect();

  useEffect(() => {
    // The width and height won't be correct on the first pass
    // because Preact is still building the DOM
    triggerRerender();

    // Used by defaultImage, but also immediately sets willReadFrequently on
    // the getContext method, which is memoized
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });

    if (defaultImage) {
      fetch(defaultImage)
        .then(resp => resp.blob())
        .then(blob => createImageBitmap(blob))
        .then(bitmap => {
          ctx.drawImage(bitmap, 0, 0, canvasRef.current.width, canvasRef.current.height)
        });
    }

    // Initial visual typically takes ~100ms to build
    burstUpdateCanvas(sourceElem, canvasRef.current, updateCount);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      burstUpdateCanvas(sourceElem, canvasRef.current, updateCount);
    });

    observer.observe(sourceElem, {
      attributes: true,
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [sourceElem]);

  return h('canvas', {
    ref: canvasRef,
    width,
    height,
    ...canvasProps
  });
}
