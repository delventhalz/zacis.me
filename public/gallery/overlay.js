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
import { Mirror } from './funhouse.js';

const ANIM_DURATION = 400;

/**
 * A modal style overlay with additional information about a single Project.
 */
export function Overlay({ data, start, onDismiss }) {
  const backgroundRef = useRef(null);
  const overlayRef = useRef(null);
  const imageRef = useRef(null);

  const handleDismiss = () => {
    fadeOut(backgroundRef, { duration: ANIM_DURATION });
    transformOut(overlayRef, start, { duration: ANIM_DURATION });
    resizeOut(imageRef, start, { duration: ANIM_DURATION });
    setTimeout(onDismiss, ANIM_DURATION);
  };

  useEffect(() => {
    // Undo flicker workaround from below before animating in
    backgroundRef.current.style.removeProperty('opacity');
    overlayRef.current.style.removeProperty('opacity');
    fadeIn(backgroundRef, { duration: ANIM_DURATION });
    transformIn(overlayRef, start, { duration: ANIM_DURATION });
    resizeIn(imageRef, start, { duration: ANIM_DURATION });
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
            alt: data.title,
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
