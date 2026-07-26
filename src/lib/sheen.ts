/**
 * The highlight that follows the pointer across a glass surface.
 *
 * Values are written straight onto the node as CSS custom properties rather than
 * held in React state — this fires on every mouse move, and re-rendering a
 * subtree for a decoration would be wasteful. glass.css reads --sheen-x,
 * --sheen-y and --sheen-strength.
 */

import { useCallback, useRef } from 'react';

export interface PointerSheen {
  ref: React.MutableRefObject<HTMLElement | null>;
  onMouseMove: (event: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function usePointerSheen(enabled = true): PointerSheen {
  const ref = useRef<HTMLElement | null>(null);

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const node = ref.current;
      if (!enabled || !node) return;

      const box = node.getBoundingClientRect();
      node.style.setProperty('--sheen-x', `${((event.clientX - box.left) / box.width) * 100}%`);
      node.style.setProperty('--sheen-y', `${((event.clientY - box.top) / box.height) * 100}%`);
      node.style.setProperty('--sheen-strength', '1');
    },
    [enabled],
  );

  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--sheen-strength', '0');
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
