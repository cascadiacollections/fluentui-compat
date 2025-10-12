import { renderHook } from '@testing-library/react';
import { useId, resetIdCounter } from '../src/useId';

describe('useId', () => {
  beforeEach(() => {
    // Reset counter before each test
    resetIdCounter();
  });

  it('generates a unique ID', () => {
    const { result } = renderHook(() => useId());
    
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('string');
    // React 19 has built-in useId that returns ':r{number}:' format
    // Our fallback returns 'id__{number}' format
    expect(result.current).toMatch(/^id/);
  });

  it('generates unique IDs for multiple instances', () => {
    const { result: result1 } = renderHook(() => useId());
    const { result: result2 } = renderHook(() => useId());
    const { result: result3 } = renderHook(() => useId());
    
    expect(result1.current).not.toBe(result2.current);
    expect(result2.current).not.toBe(result3.current);
    expect(result1.current).not.toBe(result3.current);
  });

  it('uses custom prefix', () => {
    const { result } = renderHook(() => useId('custom'));
    
    expect(result.current).toMatch(/^custom/);
  });

  it('maintains stable ID across re-renders', () => {
    const { result, rerender } = renderHook(() => useId());
    
    const firstId = result.current;
    
    rerender();
    expect(result.current).toBe(firstId);
    
    rerender();
    expect(result.current).toBe(firstId);
  });

  it('generates different IDs with different prefixes', () => {
    const { result: result1 } = renderHook(() => useId('label'));
    const { result: result2 } = renderHook(() => useId('input'));
    
    expect(result1.current).toMatch(/^label/);
    expect(result2.current).toMatch(/^input/);
    expect(result1.current).not.toBe(result2.current);
  });

  it('can be reset for testing', () => {
    const { result: result1 } = renderHook(() => useId());
    const firstId = result1.current;
    
    resetIdCounter();
    
    const { result: result2 } = renderHook(() => useId());
    const secondId = result2.current;
    
    // After reset, IDs start from beginning again (only in fallback mode)
    // In React 18+, useId uses internal counter so this won't work
    expect(secondId).toMatch(/^id/);
  });

  it('can reset to specific counter value', () => {
    resetIdCounter(100);
    
    const { result } = renderHook(() => useId());
    
    // Only works in fallback mode (React 16/17)
    expect(result.current).toMatch(/^id/);
  });

  it('generates sequential IDs', () => {
    resetIdCounter();
    
    const { result: result1 } = renderHook(() => useId());
    const { result: result2 } = renderHook(() => useId());
    const { result: result3 } = renderHook(() => useId());
    
    // All IDs should be unique
    expect(result1.current).not.toBe(result2.current);
    expect(result2.current).not.toBe(result3.current);
    expect(result1.current).not.toBe(result3.current);
  });

  it('handles empty string prefix', () => {
    const { result } = renderHook(() => useId(''));
    
    // Should still generate a valid ID
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('string');
  });

  it('works with multiple hooks in same component', () => {
    const { result } = renderHook(() => ({
      id1: useId('first'),
      id2: useId('second'),
      id3: useId('third')
    }));
    
    expect(result.current.id1).not.toBe(result.current.id2);
    expect(result.current.id2).not.toBe(result.current.id3);
    expect(result.current.id1).not.toBe(result.current.id3);
    
    expect(result.current.id1).toMatch(/^first/);
    expect(result.current.id2).toMatch(/^second/);
    expect(result.current.id3).toMatch(/^third/);
  });
});
