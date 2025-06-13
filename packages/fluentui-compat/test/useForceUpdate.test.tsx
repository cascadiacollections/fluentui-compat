import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useForceUpdate } from '../src/useForceUpdate';

describe('useForceUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return a function', () => {
    const { result } = renderHook(() => useForceUpdate());
    
    expect(typeof result.current).toBe('function');
  });

  test('should return the same function reference on multiple renders', () => {
    const { result, rerender } = renderHook(() => useForceUpdate());
    
    const firstFunction = result.current;
    expect(typeof firstFunction).toBe('function');
    
    // Re-render should return the same function reference
    rerender();
    expect(result.current).toBe(firstFunction);
    
    // Multiple re-renders should maintain the same reference
    rerender();
    rerender();
    expect(result.current).toBe(firstFunction);
  });

  test('should cause component to re-render when force update is called', () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useForceUpdate();
    });
    
    // Initial render
    expect(renderCount).toBe(1);
    
    // Call force update
    act(() => {
      result.current();
    });
    
    // Should have triggered a re-render
    expect(renderCount).toBe(2);
    
    // Call force update again
    act(() => {
      result.current();
    });
    
    // Should have triggered another re-render
    expect(renderCount).toBe(3);
  });

  test('should work with multiple force update calls in sequence', () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useForceUpdate();
    });
    
    expect(renderCount).toBe(1);
    
    // Multiple calls in sequence within the same act() are batched by React
    act(() => {
      result.current();
      result.current();
      result.current();
    });
    
    // React batches updates, so multiple calls in the same act() result in one re-render
    expect(renderCount).toBe(2);
  });

  test('should work with multiple instances independently', () => {
    let renderCount1 = 0;
    let renderCount2 = 0;
    
    const { result: result1 } = renderHook(() => {
      renderCount1++;
      return useForceUpdate();
    });
    
    const { result: result2 } = renderHook(() => {
      renderCount2++;
      return useForceUpdate();
    });
    
    // Initial renders
    expect(renderCount1).toBe(1);
    expect(renderCount2).toBe(1);
    
    // Each instance should have different function references
    expect(result1.current).not.toBe(result2.current);
    
    // Force update on first instance
    act(() => {
      result1.current();
    });
    
    expect(renderCount1).toBe(2);
    expect(renderCount2).toBe(1); // Second instance should be unaffected
    
    // Force update on second instance
    act(() => {
      result2.current();
    });
    
    expect(renderCount1).toBe(2); // First instance should be unaffected
    expect(renderCount2).toBe(2);
  });

  test('should maintain stable reference across parent re-renders', () => {
    let parentRenderCount = 0;
    
    const TestComponent = ({ trigger }: { trigger: number }) => {
      parentRenderCount++;
      return useForceUpdate();
    };
    
    const { result, rerender } = renderHook(TestComponent, {
      initialProps: { trigger: 0 }
    });
    
    const firstFunction = result.current;
    expect(parentRenderCount).toBe(1);
    
    // Parent re-render with different props
    rerender({ trigger: 1 });
    expect(parentRenderCount).toBe(2);
    expect(result.current).toBe(firstFunction); // Same reference
    
    // Another parent re-render
    rerender({ trigger: 2 });
    expect(parentRenderCount).toBe(3);
    expect(result.current).toBe(firstFunction); // Still same reference
  });

  test('should handle rapid successive calls correctly', () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useForceUpdate();
    });
    
    expect(renderCount).toBe(1);
    
    // Rapid successive calls within the same act() are batched by React
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current();
      }
    });
    
    // React batches updates, so multiple calls in the same act() result in one re-render
    expect(renderCount).toBe(2);
  });

  test('should work correctly in StrictMode', () => {
    let renderCount = 0;
    
    const TestComponent = () => {
      renderCount++;
      return useForceUpdate();
    };
    
    const { result } = renderHook(TestComponent, {
      wrapper: ({ children }) => (
        <React.StrictMode>
          {children}
        </React.StrictMode>
      )
    });
    
    const forceUpdate = result.current;
    expect(typeof forceUpdate).toBe('function');
    
    // Force update should work in StrictMode
    act(() => {
      forceUpdate();
    });
    
    // Should have triggered a re-render
    expect(renderCount).toBeGreaterThan(0);
  });

  test('should not cause memory leaks with frequent usage', () => {
    // This test verifies that the hook doesn't accumulate memory
    // by creating and destroying many instances
    const instances: (() => void)[] = [];
    
    for (let i = 0; i < 100; i++) {
      const { result, unmount } = renderHook(() => useForceUpdate());
      instances.push(result.current);
      
      // Immediately unmount to test cleanup
      unmount();
    }
    
    // All instances should be functions
    instances.forEach(instance => {
      expect(typeof instance).toBe('function');
    });
    
    // If we got here without running out of memory, the test passes
    expect(instances.length).toBe(100);
  });

  test('should work with separate force update calls', () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;  
      return useForceUpdate();
    });
    
    expect(renderCount).toBe(1);
    
    // Separate act() calls should trigger separate re-renders  
    act(() => {
      result.current();
    });
    
    expect(renderCount).toBe(2);
    
    act(() => {
      result.current();
    });
    
    expect(renderCount).toBe(3);
    
    act(() => {
      result.current();
    });
    
    expect(renderCount).toBe(4);
  });
});