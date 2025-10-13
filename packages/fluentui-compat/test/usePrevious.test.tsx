import { renderHook } from '@testing-library/react';
import { usePrevious } from '../src/usePrevious';

describe('usePrevious', () => {
  it('returns undefined on first render', () => {
    const { result } = renderHook(() => usePrevious(0));
    
    expect(result.current).toBeUndefined();
  });

  it('returns previous value after re-render', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 0 } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: 1 });
    expect(result.current).toBe(0);
    
    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });

  it('works with string values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'first' } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: 'second' });
    expect(result.current).toBe('first');
    
    rerender({ value: 'third' });
    expect(result.current).toBe('second');
  });

  it('works with object references', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const obj3 = { id: 3 };
    
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: obj1 } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);
    
    rerender({ value: obj3 });
    expect(result.current).toBe(obj2);
  });

  it('works with boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: false } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: true });
    expect(result.current).toBe(false);
    
    rerender({ value: false });
    expect(result.current).toBe(true);
  });

  it('works with null values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: null as string | null } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: 'value' });
    expect(result.current).toBe(null);
    
    rerender({ value: null });
    expect(result.current).toBe('value');
  });

  it('works with undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: undefined as string | undefined } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: 'value' });
    expect(result.current).toBe(undefined);
    
    rerender({ value: undefined });
    expect(result.current).toBe('value');
  });

  it('handles rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 0 } }
    );
    
    for (let i = 1; i <= 10; i++) {
      rerender({ value: i });
      expect(result.current).toBe(i - 1);
    }
  });

  it('maintains separate state for multiple hooks', () => {
    const { result, rerender } = renderHook(
      ({ val1, val2 }) => ({
        prev1: usePrevious(val1),
        prev2: usePrevious(val2)
      }),
      { initialProps: { val1: 'a', val2: 1 } }
    );
    
    expect(result.current.prev1).toBeUndefined();
    expect(result.current.prev2).toBeUndefined();
    
    rerender({ val1: 'b', val2: 2 });
    expect(result.current.prev1).toBe('a');
    expect(result.current.prev2).toBe(1);
    
    rerender({ val1: 'c', val2: 3 });
    expect(result.current.prev1).toBe('b');
    expect(result.current.prev2).toBe(2);
  });

  it('works with array values', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];
    
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: arr1 } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: arr2 });
    expect(result.current).toBe(arr1);
  });

  it('works with function values', () => {
    const fn1 = () => 'first';
    const fn2 = () => 'second';
    
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: fn1 } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: fn2 });
    expect(result.current).toBe(fn1);
  });

  it('handles same value across re-renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'constant' } }
    );
    
    expect(result.current).toBeUndefined();
    
    rerender({ value: 'constant' });
    expect(result.current).toBe('constant');
    
    rerender({ value: 'constant' });
    expect(result.current).toBe('constant');
  });
});
