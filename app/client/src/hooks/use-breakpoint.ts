/**
 * useBreakpoint Hook
 *
 * Reactive viewport detection for responsive layouts.
 * Breakpoints: mobile (<768px), tablet (768-1023px), desktop (>=1024px).
 */
import { useState, useEffect } from 'react';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const MOBILE_MAX = 767;
const TABLET_MIN = 768;
const TABLET_MAX = 1023;
const DESKTOP_MIN = 1024;

function getState(): BreakpointState {
  const width = typeof window !== 'undefined' ? window.innerWidth : DESKTOP_MIN;
  return {
    isMobile: width <= MOBILE_MAX,
    isTablet: width >= TABLET_MIN && width <= TABLET_MAX,
    isDesktop: width >= DESKTOP_MIN,
    width,
  };
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(getState);

  useEffect(() => {
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => setState(getState()));
      }, 100); // 100ms debounce
    };

    const mql = window.matchMedia(`(max-width: ${TABLET_MAX}px)`);
    mql.addEventListener('change', handleChange);
    window.addEventListener('resize', handleChange);

    return () => {
      mql.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleChange);
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return state;
}
