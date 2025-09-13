import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Anchor, AnchorChain } from './anchors.js';
import {
  fadeIn,
  fadeOut,
  resizeIn,
  resizeOut,
  transformIn,
  transformOut
} from './animations.js';
import { mixClasses, urlsToSet } from './dom.js';
import { Mirror } from './funhouse.js';

// Give the overlay image a couple of frames to render before we show the
// rest of the overlay and obscure the equivalent image in the gallery.
// This should prevent a flash of white on opening the overlay.
const SHOW_DELAY = 32;

/**
 * A modal style overlay with additional information about a single Project.
 */
export function Overlay({ data, start, onDismiss, onShowing }) {
  const [showing, setShowing] = useState(false);
  const backgroundRef = useRef(null);
  const overlayRef = useRef(null);
  const imageRef = useRef(null);

  const srcSet = urlsToSet(data.largeImages);

  const handleDismiss = async () => {
    await Promise.all([
      fadeOut(backgroundRef),
      transformOut(overlayRef, start),
      resizeOut(imageRef, start)
    ]);

    setShowing(false);
    onShowing(false);
    requestAnimationFrame(onDismiss);
  };

  useEffect(() => {
    setTimeout(() => {
      setShowing(true);
      onShowing(true);
      fadeIn(backgroundRef);
      transformIn(overlayRef, start);
      resizeIn(imageRef, start);
    }, SHOW_DELAY);
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
      class: mixClasses('overlay-background', showing ? null : 'hidden'),
      ref: backgroundRef,
      onClick: handleDismiss
    }),

    h('div', {
      class: mixClasses('overlay', showing ? null : 'hidden'),
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

      h('div', { class: mixClasses('overlay-image-wrapper', showing ? null : 'not-hidden') },
        data.id === 'zacisme' ? (
          h(Mirror, {
            class: 'overlay-image',
            source: 'main',
            defaultImage: data.image,
            updateCount: 18,
            ref: imageRef
          })
        ) : (
          h('img', {
            class: 'overlay-image',
            ref: imageRef,
            ...(srcSet ? { srcSet } : { src: data.image })
          })
        )
      )
    )
  ];
}
