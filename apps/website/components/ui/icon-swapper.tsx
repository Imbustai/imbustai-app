'use client';

import {
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from 'react';

const transitions = {
  zoomBounce: {
    exitClass: 'icon-swap-exit',
    enterClass: 'icon-swap-enter',
    exitAnimationName: 'icon-swap-exit',
    enterAnimationName: 'icon-swap-enter',
  },
} as const;

const activeTransition = transitions.zoomBounce;

type Phase = 'idle' | 'exit' | 'enter';

function nodeKind(node: ReactNode): unknown {
  if (isValidElement(node)) return node.type;
  return node;
}

export function IconSwapper({ children }: { children: ReactNode }) {
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<Phase>('enter');
  const [innerKey, setInnerKey] = useState(0);

  const displayedRef = useRef(displayed);
  const phaseRef = useRef<Phase>(phase);
  const animatingRef = useRef(false);
  const swapQueueRef = useRef<ReactNode[]>([]);
  const isInitialLayout = useRef(true);

  displayedRef.current = displayed;
  phaseRef.current = phase;

  const tryStartSwap = useCallback(() => {
    if (animatingRef.current) return;
    const q = swapQueueRef.current;
    const d = displayedRef.current;
    while (q.length > 0 && nodeKind(q[0]) === nodeKind(d)) {
      q.shift();
    }
    if (q.length === 0) return;
    animatingRef.current = true;
    setPhase('exit');
  }, []);

  useLayoutEffect(() => {
    if (isInitialLayout.current) {
      isInitialLayout.current = false;
      const nk = nodeKind(children);
      if (nk === nodeKind(displayedRef.current)) {
        return;
      }
    }

    const nk = nodeKind(children);
    const q = swapQueueRef.current;
    const tail = q[q.length - 1];
    if (tail !== undefined && nodeKind(tail) === nk) {
      return;
    }

    if (
      !animatingRef.current &&
      q.length === 0 &&
      nk === nodeKind(displayedRef.current)
    ) {
      return;
    }

    q.push(children);
    tryStartSwap();
  }, [children, tryStartSwap]);

  const handleAnimEnd = (e: AnimationEvent<HTMLSpanElement>) => {
    if (
      phaseRef.current === 'exit' &&
      e.animationName === activeTransition.exitAnimationName
    ) {
      const target = swapQueueRef.current.shift();
      if (target === undefined) {
        animatingRef.current = false;
        setPhase('idle');
        queueMicrotask(() => tryStartSwap());
        return;
      }
      setDisplayed(target);
      setInnerKey((k) => k + 1);
      setPhase('enter');
      return;
    }
    if (
      phaseRef.current === 'enter' &&
      e.animationName === activeTransition.enterAnimationName
    ) {
      setPhase('idle');
      animatingRef.current = false;
      queueMicrotask(() => tryStartSwap());
    }
  };

  const animClass =
    phase === 'exit'
      ? activeTransition.exitClass
      : phase === 'enter'
        ? activeTransition.enterClass
        : '';

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center align-middle [&>svg]:block"
      aria-hidden
    >
      <span key={innerKey} className={animClass} onAnimationEnd={handleAnimEnd}>
        {displayed}
      </span>
    </span>
  );
}
