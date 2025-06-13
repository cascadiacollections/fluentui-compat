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
    
    // In StrictMode, React double-invokes components during development
    // Initial render: 2 invocations, forceUpdate: 2 more invocations = 4 total
    expect(renderCount).toBe(4);
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

  describe('development features', () => {
    const originalEnv = process.env.NODE_ENV;
    
    beforeEach(() => {
      // Mock console.warn to test development warnings
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Set development environment
      process.env.NODE_ENV = 'development';
    });
    
    afterEach(() => {
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
      jest.restoreAllMocks();
    });

    test('should provide debug value in development', () => {
      const { result } = renderHook(() => useForceUpdate());
      
      // Trigger a force update to increment the call count
      act(() => {
        result.current();
      });
      
      // We can't directly test useDebugValue, but we can ensure the hook works
      expect(typeof result.current).toBe('function');
    });

    test('should warn about rapid successive calls', () => {
      const { result } = renderHook(() => useForceUpdate());
      
      // Simulate rapid calls by calling multiple times quickly
      act(() => {
        // Call 7 times rapidly (more than the threshold of 5)
        for (let i = 0; i < 7; i++) {
          result.current();
        }
      });
      
      // Should have warned about rapid calls
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('useForceUpdate: Detected excessive rapid calls'),
        expect.any(Number)
      );
    });

    test('should warn about high usage frequency', () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useForceUpdate());
      
      // Simulate high frequency usage over time
      for (let i = 0; i < 12; i++) {
        act(() => {
          result.current();
        });
        
        // Advance time by 100ms between calls
        act(() => {
          jest.advanceTimersByTime(100);
        });
      }
      
      // Advance time to trigger the frequency check (after 1 second)
      act(() => {
        jest.advanceTimersByTime(1000);
        result.current(); // One more call to trigger the check
      });
      
      // Should have warned about high frequency usage
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('useForceUpdate: High usage frequency detected'),
        expect.any(Number)
      );
      
      jest.useRealTimers();
    });

    test('should warn about short-lived components with many updates', () => {
      const { result, unmount } = renderHook(() => useForceUpdate());
      
      // Call force update multiple times quickly
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current();
        }
      });
      
      // Unmount immediately (simulating short component lifetime)
      unmount();
      
      // Should have warned about quick unmount with many updates
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('useForceUpdate: Component unmounted quickly after'),
        expect.any(Number)
      );
    });

    test('should create performance marks when available', () => {
      // Mock performance.mark
      const mockMark = jest.fn();
      Object.defineProperty(global, 'performance', {
        writable: true,
        value: { mark: mockMark }
      });
      
      const { result } = renderHook(() => useForceUpdate());
      
      act(() => {
        result.current();
      });
      
      // Should have created a performance mark
      expect(mockMark).toHaveBeenCalledWith('useForceUpdate:call');
      
      // Clean up
      delete (global as any).performance;
    });

    test('should not create performance marks when performance is unavailable', () => {
      // Ensure performance is undefined
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      const { result } = renderHook(() => useForceUpdate());
      
      // Should not throw when performance is unavailable
      expect(() => {
        act(() => {
          result.current();
        });
      }).not.toThrow();
      
      // Restore performance
      (global as any).performance = originalPerformance;
    });

    test('should reset rapid call counter after normal intervals', () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useForceUpdate());
      
      // Make some rapid calls (but not enough to trigger warning)
      act(() => {
        result.current();
        result.current();
        result.current();
      });
      
      // Wait for more than 16ms (one frame)
      act(() => {
        jest.advanceTimersByTime(20);
      });
      
      // Make another set of rapid calls
      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current();
        }
      });
      
      // Should still warn because rapid call counter was reset and then exceeded again
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('useForceUpdate: Detected excessive rapid calls'),
        expect.any(Number)
      );
      
      jest.useRealTimers();
    });
  });

  describe('production behavior', () => {
    const originalEnv = process.env.NODE_ENV;
    
    beforeEach(() => {
      // Set production environment
      process.env.NODE_ENV = 'production';
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(() => {
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
      jest.restoreAllMocks();
    });

    test('should not show warnings in production', () => {
      const { result } = renderHook(() => useForceUpdate());
      
      // Make many rapid calls that would trigger warnings in development
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current();
        }
      });
      
      // Should not have any warnings in production
      expect(console.warn).not.toHaveBeenCalled();
    });

    test('should still function correctly in production', () => {
      let renderCount = 0;
      
      const { result } = renderHook(() => {
        renderCount++;
        return useForceUpdate();
      });
      
      expect(renderCount).toBe(1);
      
      act(() => {
        result.current();
      });
      
      expect(renderCount).toBe(2);
    });
  });
});