import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Anchor, AnchorChain } from './anchors.js';
import {
  fadeIn,
  fadeOut,
  resize,
  resizeFrom,
  transform,
  transformFrom
} from './animations.js';
import {
  mixClasses,
  urlsToSet,
  untilNextFrame,
  untilImageLoads
} from './dom.js';
import { Mirror } from './funhouse.js';

/**
 * A modal style overlay with additional information about a single Project.
 */
export function Overlay({ data, start, onDismiss, onShowing }) {
  const [imageShowing, setImageShowing] = useState(false);
  const [overlayShowing, setOverlayShowing] = useState(false);
  const backgroundRef = useRef(null);
  const overlayRef = useRef(null);
  const imageRef = useRef(null);

  // Overlay is centered over scrolled content but funhouse mirror reflects the
  // whole page contents. Shift it down to show the overlay in the viewport.
  const [funhouseShift] = useState(() => {
    const widthsScrolled = window.scrollY / window.innerWidth;
    return Math.min(0, -widthsScrolled * 300);
  });

  const srcSet = urlsToSet(data.largeImages);

  const handleDismiss = async () => {
    await Promise.all([
      fadeOut(backgroundRef, { fill: 'forwards' }),
      transform(overlayRef, start),
      transform(imageRef, start)
    ]);

    // Notify the wrapping component we are about to hide
    onShowing(false);

    // Actually hide/dismiss after any wrapping component updates have rendered
    await untilNextFrame();
    setImageShowing(false);
    setOverlayShowing(false);
    onDismiss();
  };

  useEffect(() => {
    requestAnimationFrame(async () => {
      // After the hidden image is rendered and has dimensions,
      // transform it to match the start dimensions then show
      await transform(imageRef, start, { duration: 0 });
      setImageShowing(true);

      // Once the visible image has rendered, show rest of overlay and animate
      await untilNextFrame();
      await untilImageLoads(imageRef);
      setOverlayShowing(true);
      fadeIn(backgroundRef);
      transformFrom(overlayRef, start);
      transformFrom(imageRef, start);

      // Finally, notify the wrapping component that everything is showing
      await untilNextFrame();
      onShowing(true);
    });
  }, []);

  useEffect(() => {
    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  }, []);

  return [
    h('div', {
      class: mixClasses('overlay-background', overlayShowing ? null : 'hidden'),
      ref: backgroundRef,
      onClick: handleDismiss
    }),

    h('div', {
      class: mixClasses('overlay', overlayShowing ? null : 'hidden'),
      ref: overlayRef
    },
      h('section', { class: 'content' },
        h('div', { class: 'content-header' },
          h('h3', null, data.title),

          data.url && (
            h('p', { class: 'url-line' },
              h(Anchor, data)
            )
          ),

          data.clients.length > 0 && (
            h('p', { class: 'for-line' },
              'for ',
              h(AnchorChain, { data: data.clients })
            )
          )
        ),

        h('div', { class: 'content-body' },
          h('p', { class: 'summary' }, data.summary),
        ),

        h('div', { class: 'content-footer' },
          data.id !== 'treasury' && (
            h('p', { class: 'built-line' },
              'built with ',
              h(AnchorChain, { data: data.tools.map(name => ({ name })) })
            )
          )
        ),

        h('button', {
          class: 'close text-button',
          onClick: handleDismiss,
          ariaLabel: 'Close'
        },
          '[X]'
        )
      ),
    ),

    data.id === 'zacisme' ? (
      h('div', { class: mixClasses('overlay-image', imageShowing ? null : 'hidden') },
        h(Mirror, {
          class: 'funhouse-mirror',
          style: { marginTop: `${funhouseShift}px` },
          source: 'main',
          defaultImage: data.image,
          updateCount: 18,
          ref: imageRef
        })
      )
    ) : (
      h('img', {
        class: mixClasses('overlay-image', imageShowing ? null : 'hidden'),
        ref: imageRef,
        ...(srcSet ? { srcSet } : { src: data.image })
      })
    )
  ];
}
