import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useBoolean } from '../src/useBoolean';

describe('useBoolean', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with the provided initial value', () => {
    const { result: trueResult } = renderHook(() => useBoolean(true));
    expect(trueResult.current[0]).toBe(true);

    const { result: falseResult } = renderHook(() => useBoolean(false));
    expect(falseResult.current[0]).toBe(false);
  });

  test('should return callbacks object with correct structure', () => {
    const { result } = renderHook(() => useBoolean(false));
    const [, callbacks] = result.current;

    expect(callbacks).toHaveProperty('setTrue');
    expect(callbacks).toHaveProperty('setFalse');
    expect(callbacks).toHaveProperty('toggle');
    expect(typeof callbacks.setTrue).toBe('function');
    expect(typeof callbacks.setFalse).toBe('function');
    expect(typeof callbacks.toggle).toBe('function');
  });

  test('setTrue should set value to true', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current[1].setTrue();
    });

    expect(result.current[0]).toBe(true);
  });

  test('setFalse should set value to false', () => {
    const { result } = renderHook(() => useBoolean(true));

    act(() => {
      result.current[1].setFalse();
    });

    expect(result.current[0]).toBe(false);
  });

  test('toggle should flip the boolean value', () => {
    const { result } = renderHook(() => useBoolean(false));

    // Toggle from false to true
    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(true);

    // Toggle from true to false
    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(false);
  });

  test('callbacks should maintain stable identity across renders', () => {
    const { result, rerender } = renderHook(() => useBoolean(false));

    const firstCallbacks = result.current[1];
    const firstSetTrue = firstCallbacks.setTrue;
    const firstSetFalse = firstCallbacks.setFalse;
    const firstToggle = firstCallbacks.toggle;

    // Re-render should maintain the same callback references
    rerender();

    const secondCallbacks = result.current[1];
    expect(secondCallbacks).toBe(firstCallbacks);
    expect(secondCallbacks.setTrue).toBe(firstSetTrue);
    expect(secondCallbacks.setFalse).toBe(firstSetFalse);
    expect(secondCallbacks.toggle).toBe(firstToggle);
  });

  test('callbacks should work correctly after multiple state changes', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      result.current[1].setTrue();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].setFalse();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(true);
  });

  test('multiple hook instances should work independently', () => {
    const { result: result1 } = renderHook(() => useBoolean(true));
    const { result: result2 } = renderHook(() => useBoolean(false));

    // Initial values should be different
    expect(result1.current[0]).toBe(true);
    expect(result2.current[0]).toBe(false);

    // Callbacks should be different instances
    expect(result1.current[1]).not.toBe(result2.current[1]);

    // Changes to one should not affect the other
    act(() => {
      result1.current[1].setFalse();
    });

    expect(result1.current[0]).toBe(false);
    expect(result2.current[0]).toBe(false); // unchanged

    act(() => {
      result2.current[1].setTrue();
    });

    expect(result1.current[0]).toBe(false); // unchanged
    expect(result2.current[0]).toBe(true);
  });

  test('should handle rapid state changes correctly', () => {
    const { result } = renderHook(() => useBoolean(false));

    act(() => {
      // Rapid succession of state changes
      result.current[1].setTrue();
      result.current[1].setFalse();
      result.current[1].toggle();
      result.current[1].toggle();
      result.current[1].setTrue();
    });

    expect(result.current[0]).toBe(true);
  });

  test('toggle should work correctly with functional updates', () => {
    const { result } = renderHook(() => useBoolean(false));

    // This tests that toggle properly uses functional updates
    // and doesn't have stale closure issues
    act(() => {
      result.current[1].toggle();
      result.current[1].toggle();
    });

    expect(result.current[0]).toBe(false); // Should be back to original
  });

  test('should work with different initial values', () => {
    const testCases = [true, false];

    testCases.forEach(initialValue => {
      const { result } = renderHook(() => useBoolean(initialValue));
      
      expect(result.current[0]).toBe(initialValue);
      
      act(() => {
        result.current[1].setTrue();
      });
      expect(result.current[0]).toBe(true);
      
      act(() => {
        result.current[1].setFalse();
      });
      expect(result.current[0]).toBe(false);
      
      act(() => {
        result.current[1].toggle();
      });
      expect(result.current[0]).toBe(true);
    });
  });

  test('callbacks should be safe to use in dependency arrays', () => {
    const { result, rerender } = renderHook(() => useBoolean(false));
    
    const callbacks = result.current[1];
    
    // Create mock functions that depend on the callbacks
    const mockEffectWithSetTrue = jest.fn();
    const mockEffectWithSetFalse = jest.fn();
    const mockEffectWithToggle = jest.fn();
    
    // Simulate useEffect dependencies
    renderHook(() => {
      React.useEffect(() => {
        mockEffectWithSetTrue();
      }, [callbacks.setTrue]);
      
      React.useEffect(() => {
        mockEffectWithSetFalse();
      }, [callbacks.setFalse]);
      
      React.useEffect(() => {
        mockEffectWithToggle();
      }, [callbacks.toggle]);
    });
    
    expect(mockEffectWithSetTrue).toHaveBeenCalledTimes(1);
    expect(mockEffectWithSetFalse).toHaveBeenCalledTimes(1);
    expect(mockEffectWithToggle).toHaveBeenCalledTimes(1);
    
    // Re-render the original hook - callbacks should remain stable
    rerender();
    
    // Effects should not run again since dependencies are stable
    expect(mockEffectWithSetTrue).toHaveBeenCalledTimes(1);
    expect(mockEffectWithSetFalse).toHaveBeenCalledTimes(1);
    expect(mockEffectWithToggle).toHaveBeenCalledTimes(1);
  });

  test('should maintain performance by avoiding unnecessary object creation', () => {
    const { result, rerender } = renderHook(() => useBoolean(false));
    
    const firstRenderCallbacks = result.current[1];
    
    // Force multiple re-renders
    for (let i = 0; i < 10; i++) {
      rerender();
      expect(result.current[1]).toBe(firstRenderCallbacks);
    }
    
    // Even after state changes, callbacks should remain stable
    act(() => {
      result.current[1].toggle();
    });
    
    expect(result.current[1]).toBe(firstRenderCallbacks);
    
    rerender();
    expect(result.current[1]).toBe(firstRenderCallbacks);
  });

  test('should work in a realistic component scenario', () => {
    // Test simulating a real usage pattern
    const TestComponent = () => {
      const [isVisible, { setTrue: show, setFalse: hide, toggle }] = useBoolean(false);
      const [isEnabled, { setTrue: enable, setFalse: disable }] = useBoolean(true);
      
      return {
        isVisible,
        isEnabled,
        show,
        hide,
        toggle,
        enable,
        disable
      };
    };
    
    const { result } = renderHook(() => TestComponent());
    
    expect(result.current.isVisible).toBe(false);
    expect(result.current.isEnabled).toBe(true);
    
    act(() => {
      result.current.show();
    });
    expect(result.current.isVisible).toBe(true);
    
    act(() => {
      result.current.disable();
    });
    expect(result.current.isEnabled).toBe(false);
    
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isVisible).toBe(false);
  });
});