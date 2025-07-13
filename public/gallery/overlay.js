import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Anchor, AnchorChain } from './anchors.js';
import {
  fadeIn,
  fadeOut,
  resizeIn,
  resizeOut,
  transformIn,
  transformOut
} from './animations.js';
import { urlsToSet } from './dom.js';
import { Mirror } from './funhouse.js';

/**
 * A modal style overlay with additional information about a single Project.
 */
export function Overlay({ data, start, onDismiss }) {
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
    onDismiss();
  };

  useEffect(() => {
    // Undo flicker workaround from below before animating in
    backgroundRef.current.style.removeProperty('opacity');
    overlayRef.current.style.removeProperty('opacity');
    fadeIn(backgroundRef);
    transformIn(overlayRef, start);
    resizeIn(imageRef, start);
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
      class: 'overlay-background',
      ref: backgroundRef,
      style: backgroundRef.current ? null : { opacity: 0 }, // Prevent flicker
      onClick: handleDismiss
    }),

    h('div',
      {
        class: 'overlay',
        ref: overlayRef,
        style: overlayRef.current ? null : { opacity: 0 } // Prevent flicker
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

        h('button',
          {
            class: 'close text-button',
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
