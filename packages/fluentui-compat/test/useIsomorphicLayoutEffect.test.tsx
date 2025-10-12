import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { useIsomorphicLayoutEffect } from '../src/useIsomorphicLayoutEffect';

describe('useIsomorphicLayoutEffect', () => {
  it('is a function', () => {
    expect(typeof useIsomorphicLayoutEffect).toBe('function');
  });

  it('executes effect callback', () => {
    const effectCallback = jest.fn();
    
    renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback, []);
    });
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
  });

  it('executes cleanup on unmount', () => {
    const cleanup = jest.fn();
    const effectCallback = jest.fn(() => cleanup);
    
    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback, []);
    });
    
    expect(cleanup).not.toHaveBeenCalled();
    
    unmount();
    
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('re-runs effect when dependencies change', () => {
    const effectCallback = jest.fn();
    
    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(effectCallback, [dep]);
      },
      { initialProps: { dep: 1 } }
    );
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
    
    rerender({ dep: 2 });
    expect(effectCallback).toHaveBeenCalledTimes(2);
    
    rerender({ dep: 3 });
    expect(effectCallback).toHaveBeenCalledTimes(3);
  });

  it('does not re-run effect when dependencies stay the same', () => {
    const effectCallback = jest.fn();
    
    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(effectCallback, [dep]);
      },
      { initialProps: { dep: 1 } }
    );
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
    
    rerender({ dep: 1 });
    expect(effectCallback).toHaveBeenCalledTimes(1);
  });

  it('runs cleanup before re-running effect', () => {
    const cleanup = jest.fn();
    const effectCallback = jest.fn(() => cleanup);
    
    const { rerender } = renderHook(
      ({ dep }) => {
        useIsomorphicLayoutEffect(effectCallback, [dep]);
      },
      { initialProps: { dep: 1 } }
    );
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    
    rerender({ dep: 2 });
    
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(effectCallback).toHaveBeenCalledTimes(2);
  });

  it('works with no dependencies (runs on every render)', () => {
    const effectCallback = jest.fn();
    
    const { rerender } = renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback);
    });
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
    
    rerender();
    expect(effectCallback).toHaveBeenCalledTimes(2);
    
    rerender();
    expect(effectCallback).toHaveBeenCalledTimes(3);
  });

  it('works with empty dependency array (runs once)', () => {
    const effectCallback = jest.fn();
    
    const { rerender } = renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback, []);
    });
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
    
    rerender();
    rerender();
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
  });

  it('has the same signature as useEffect/useLayoutEffect', () => {
    // This test ensures type compatibility
    const effectCallback = () => {
      // Effect logic
      return () => {
        // Cleanup logic
      };
    };
    
    // Should accept the same arguments as useEffect/useLayoutEffect
    renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback, []);
      
      // Type check - should work like useEffect
      const deps = [1, 'test', true];
      useIsomorphicLayoutEffect(effectCallback, deps);
    });
  });

  it('allows effect without cleanup', () => {
    const effectCallback = jest.fn(() => {
      // No cleanup
    });
    
    const { unmount } = renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback, []);
    });
    
    expect(effectCallback).toHaveBeenCalledTimes(1);
    
    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });

  it('handles multiple effects in same component', () => {
    const effect1 = jest.fn();
    const effect2 = jest.fn();
    
    renderHook(() => {
      useIsomorphicLayoutEffect(effect1, []);
      useIsomorphicLayoutEffect(effect2, []);
    });
    
    expect(effect1).toHaveBeenCalledTimes(1);
    expect(effect2).toHaveBeenCalledTimes(1);
  });

  // Test that it uses the appropriate hook based on environment
  it('uses useLayoutEffect in browser environment', () => {
    // In browser environment (JSDOM), it should use useLayoutEffect
    // This is implicitly tested by the fact that effects run synchronously
    // but we can't easily verify the exact hook being used
    
    let effectRan = false;
    const effectCallback = () => {
      effectRan = true;
    };
    
    renderHook(() => {
      useIsomorphicLayoutEffect(effectCallback, []);
    });
    
    expect(effectRan).toBe(true);
  });
});
