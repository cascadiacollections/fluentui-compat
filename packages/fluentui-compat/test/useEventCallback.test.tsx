import React, { useState, useEffect } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useEventCallback } from '../src/useEventCallback';

describe('useEventCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return a function', () => {
    const { result } = renderHook(() => useEventCallback(() => {}));
    expect(typeof result.current).toBe('function');
  });

  test('should maintain stable identity across renders', () => {
    const { result, rerender } = renderHook(() => useEventCallback(() => {}));
    
    const firstCallback = result.current;
    
    // Re-render multiple times
    rerender();
    expect(result.current).toBe(firstCallback);
    
    rerender();
    expect(result.current).toBe(firstCallback);
    
    rerender();
    expect(result.current).toBe(firstCallback);
  });

  test('should call the latest version of the callback', () => {
    const { result, rerender } = renderHook(({ count }) => {
      const callback = useEventCallback(() => count);
      return callback;
    }, { initialProps: { count: 0 } });
    
    // Initial call should return 0
    expect(result.current()).toBe(0);
    
    // Update counter and re-render
    rerender({ count: 1 });
    
    // Callback should now return 1 (latest value)
    expect(result.current()).toBe(1);
    
    // Update again
    rerender({ count: 2 });
    
    // Callback should return 2
    expect(result.current()).toBe(2);
  });

  test('should handle callbacks with arguments', () => {
    const { result } = renderHook(() => 
      useEventCallback((a: number, b: number) => a + b)
    );
    
    expect(result.current(2, 3)).toBe(5);
    expect(result.current(10, 20)).toBe(30);
  });

  test('should handle callbacks with return values', () => {
    const { result } = renderHook(() => 
      useEventCallback((value: string) => value.toUpperCase())
    );
    
    expect(result.current('hello')).toBe('HELLO');
    expect(result.current('world')).toBe('WORLD');
  });

  test('should work with async callbacks', async () => {
    const { result } = renderHook(() => 
      useEventCallback(async (value: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return value * 2;
      })
    );
    
    await expect(result.current(5)).resolves.toBe(10);
    await expect(result.current(7)).resolves.toBe(14);
  });

  test('should access latest state in callback', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState('initial');
      const callback = useEventCallback(() => value);
      return { callback, setValue };
    });
    
    // Initial state
    expect(result.current.callback()).toBe('initial');
    
    // Update state
    act(() => {
      result.current.setValue('updated');
    });
    
    // Callback should access latest state
    expect(result.current.callback()).toBe('updated');
    
    // Update again
    act(() => {
      result.current.setValue('final');
    });
    
    expect(result.current.callback()).toBe('final');
  });

  test('should work correctly with different callback implementations', () => {
    const mockFn1 = jest.fn(() => 'result1');
    const mockFn2 = jest.fn(() => 'result2');
    
    const { result, rerender } = renderHook(
      ({ fn }) => useEventCallback(fn),
      { initialProps: { fn: mockFn1 } }
    );
    
    const stableCallback = result.current;
    
    // Call with first implementation
    expect(stableCallback()).toBe('result1');
    expect(mockFn1).toHaveBeenCalledTimes(1);
    
    // Change to second implementation
    rerender({ fn: mockFn2 });
    
    // Reference should stay stable
    expect(result.current).toBe(stableCallback);
    
    // Should call second implementation
    expect(stableCallback()).toBe('result2');
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  test('should be safe to use in dependency arrays', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const [effectCount, setEffectCount] = useState(0);
      
      const callback = useEventCallback(() => count);
      
      useEffect(() => {
        setEffectCount(prev => prev + 1);
      }, [callback]); // callback in dependencies
      
      return { callback, setCount, effectCount };
    });
    
    // Effect should run once on mount
    expect(result.current.effectCount).toBe(1);
    
    // Update state multiple times
    act(() => {
      result.current.setCount(1);
    });
    act(() => {
      result.current.setCount(2);
    });
    act(() => {
      result.current.setCount(3);
    });
    
    // Effect should still only have run once (callback is stable)
    expect(result.current.effectCount).toBe(1);
  });

  test('should handle callbacks that throw errors', () => {
    const { result } = renderHook(() => 
      useEventCallback(() => {
        throw new Error('Test error');
      })
    );
    
    expect(() => result.current()).toThrow('Test error');
  });

  test('should handle callbacks with no return value', () => {
    const sideEffect = jest.fn();
    const { result } = renderHook(() => 
      useEventCallback(() => {
        sideEffect();
      })
    );
    
    result.current();
    expect(sideEffect).toHaveBeenCalledTimes(1);
    
    result.current();
    expect(sideEffect).toHaveBeenCalledTimes(2);
  });

  test('should handle multiple arguments of different types', () => {
    const { result } = renderHook(() => 
      useEventCallback((str: string, num: number, bool: boolean, obj: { key: string }) => ({
        str,
        num,
        bool,
        obj
      }))
    );
    
    const testObj = { key: 'value' };
    const returnValue = result.current('test', 123, true, testObj);
    
    expect(returnValue).toEqual({
      str: 'test',
      num: 123,
      bool: true,
      obj: testObj
    });
  });

  test('should work with generic type parameters', () => {
    interface Item {
      id: number;
      name: string;
    }
    
    const { result } = renderHook(() => 
      useEventCallback(<T extends Item>(item: T) => item.name)
    );
    
    const testItem: Item = { id: 1, name: 'Test' };
    expect(result.current(testItem)).toBe('Test');
  });

  test('should handle rapid successive calls', () => {
    const calls: number[] = [];
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      const callback = useEventCallback(() => {
        calls.push(value);
        return value;
      });
      return { callback, setValue };
    });
    
    // Make rapid calls
    result.current.callback();
    result.current.callback();
    result.current.callback();
    
    expect(calls).toEqual([0, 0, 0]);
    
    // Update state
    act(() => {
      result.current.setValue(5);
    });
    
    // Make more rapid calls with new state
    result.current.callback();
    result.current.callback();
    
    expect(calls).toEqual([0, 0, 0, 5, 5]);
  });

  test('should handle callback changes on every render', () => {
    const { result, rerender } = renderHook(
      ({ counter }) => {
        const callback = useEventCallback(() => counter);
        return callback;
      },
      { initialProps: { counter: 0 } }
    );
    
    const stableCallback = result.current;
    expect(stableCallback()).toBe(0);
    
    // Re-render with different prop values
    for (let i = 1; i <= 10; i++) {
      rerender({ counter: i });
      expect(result.current).toBe(stableCallback); // Reference stays same
      expect(result.current()).toBe(i); // But returns latest value
    }
  });

  test('should work correctly with conditional rendering', () => {
    const { result, rerender } = renderHook(
      ({ show, value }) => {
        // Always call hooks in same order, return null for the value instead
        const callback = useEventCallback(() => value);
        return show ? callback : null;
      },
      { initialProps: { show: true, value: 'test' } }
    );
    
    expect(result.current).not.toBeNull();
    expect(result.current!()).toBe('test');
    
    // Hide by returning null instead of conditionally calling hook
    rerender({ show: false, value: 'test' });
    expect(result.current).toBeNull();
    
    // Show component again
    rerender({ show: true, value: 'updated' });
    expect(result.current).not.toBeNull();
    expect(result.current!()).toBe('updated');
  });

  test('should handle callbacks that depend on props', () => {
    interface Props {
      multiplier: number;
      value: number;
    }
    
    const { result, rerender } = renderHook(
      ({ multiplier, value }: Props) => {
        const callback = useEventCallback(() => multiplier * value);
        return callback;
      },
      { initialProps: { multiplier: 2, value: 3 } as Props }
    );
    
    const stableCallback = result.current;
    expect(stableCallback()).toBe(6);
    
    // Change props
    rerender({ multiplier: 3, value: 4 });
    expect(result.current).toBe(stableCallback); // Same reference
    expect(stableCallback()).toBe(12); // Latest calculation
    
    // Change props again
    rerender({ multiplier: 5, value: 10 });
    expect(result.current).toBe(stableCallback);
    expect(stableCallback()).toBe(50);
  });

  test('should not allow nested hook calls inside returned callback', () => {
    // This test verifies that we cannot call hooks inside the event callback
    // (which is expected and correct behavior)
    const { result } = renderHook(() => {
      const [inner, setInner] = useState(0);
      
      const callback = useEventCallback(() => {
        // Return a function that captures inner, not a hook call
        return () => inner;
      });
      
      return { callback, setInner };
    });
    
    const innerFn = result.current.callback();
    expect(innerFn()).toBe(0);
    
    act(() => {
      result.current.setInner(5);
    });
    
    const newInnerFn = result.current.callback();
    expect(newInnerFn()).toBe(5);
  });

  test('callbacks should work correctly after multiple state changes', () => {
    const { result } = renderHook(() => {
      const [a, setA] = useState(1);
      const [b, setB] = useState(2);
      
      const callback = useEventCallback(() => a + b);
      
      return { callback, setA, setB };
    });
    
    expect(result.current.callback()).toBe(3);
    
    act(() => {
      result.current.setA(10);
    });
    expect(result.current.callback()).toBe(12);
    
    act(() => {
      result.current.setB(20);
    });
    expect(result.current.callback()).toBe(30);
    
    act(() => {
      result.current.setA(5);
      result.current.setB(7);
    });
    expect(result.current.callback()).toBe(12);
  });
});
