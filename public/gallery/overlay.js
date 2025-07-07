import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Anchor, AnchorChain } from './anchors.js';
import { Mirror } from './funhouse.js';

const ANIM_DURATION = 400;

const animate = (element, frames, options = {}) => {
  // Handle refs to preact components
  const ref = element.animate ? element : element.base;
  ref.animate(frames, {
    duration: ANIM_DURATION,
    easing: 'ease-in-out',
    ...options
  });
};

const animateFadeIn = (element) => {
  animate(element, [{ opacity: 0 }, {}]);
};

const animateFadeOut = (element) => {
  animate(element, [{}, { opacity: 0 }], { fill: 'forwards' });
};

const animateMoveIn = (element, start) => {
  const end = element.getBoundingClientRect();
  const movedX = start.x - end.x;
  const movedY = start.y - end.y;

  animate(element, [
    {
      transformOrigin: 'top left',
      transform: `translate(${movedX}px, ${movedY}px)`,
    },
    {},
  ]);
};

const animateMoveOut = (element, end) => {
  const start = element.getBoundingClientRect();
  const movedX = end.x - start.x;
  const movedY = end.y - start.y;

  animate(
    element,
    [
      {},
      {
        transformOrigin: 'top left',
        transform: `translate(${movedX}px, ${movedY}px)`,
      },
    ],
    { fill: 'forwards' }
  );
};

const animateResizeIn = (element, start) => {
  animate(element, [
    {
      width: `${start.width}px`,
      height: `${start.height}px`
    },
    {}
  ]);
};

const animateResizeOut = (element, end) => {
  animate(
    element,
    [
      {},
      {
        width: `${end.width}px`,
        height: `${end.height}px`
      }
    ],
    { fill: 'forwards' }
  );
};

export function Overlay({ data, start, onDismiss }) {
  const backgroundRef = useRef(null);
  const overlayRef = useRef(null);
  const imageRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (backgroundRef.current && overlayRef.current && imageRef.current) {
      backgroundRef.current.style.opacity = 1;
      overlayRef.current.style.opacity = 1;
      animateFadeIn(backgroundRef.current);
      animateFadeIn(closeRef.current);
      animateMoveIn(overlayRef.current, start);
      animateResizeIn(overlayRef.current, start);
      animateResizeIn(imageRef.current, start);
    }
  }, [backgroundRef.current, overlayRef.current, imageRef.current]);

  const handleDismiss = () => {
    animateFadeOut(backgroundRef.current);
    animateFadeOut(closeRef.current);
    animateMoveOut(overlayRef.current, start);
    animateResizeOut(overlayRef.current, start);
    animateResizeOut(imageRef.current, start);
    setTimeout(onDismiss, ANIM_DURATION);
  };

  return [
    h('div', {
      class: 'overlay-background',
      ref: backgroundRef,
      style: { opacity: backgroundRef.current ? 1 : 0 }, // Prevent flicker
      onClick: handleDismiss
    }),

    h('div',
      {
        class: 'overlay',
        ref: overlayRef,
        style: { opacity: overlayRef.current ? 1 : 0 } // Prevent flicker
      },

      h('div', { class: 'content' },
        h('h2', null, data.title),

        data.url && (
          h('p', { class: 'url-line' },
            h(Anchor, data)
          )
        ),

        h('p', { class: 'built-line' },
          'built with ',
          h(AnchorChain, { data: data.tools.map(name => ({ name })) })
        ),

        data.clients.length > 0 && (
          h('p', { class: 'for-line' },
            'for ',
            h(AnchorChain, { data: data.clients })
          )
        ),

        h('p', { class: 'summary' }, data.summary),

        h('button',
          {
            class: 'close text-button',
            ref: closeRef,
            onClick: handleDismiss,
            ariaLabel: 'Close'
          },
          '[X]'
        )
      ),

      h('div', { class: 'overlay-image-wrapper' },
        data.id === 'zacisme' ? (
          h(Mirror, {
            class: 'overlay-image',
            source: 'main',
            defaultImage: `images/${data.image}`,
            updateCount: 18,
            ref: imageRef
          })
        ) : (
          h('img', {
            class: 'overlay-image',
            src: `images/${data.image}`,
            alt: data.title,
            ref: imageRef
          })
        )
      )
    )
  ];
}
