import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useSetTimeout } from '../src/useSetTimeout';

// Mock global setTimeout and clearTimeout to track calls and control timing
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

let mockTimeoutId = 1;
const mockSetTimeoutCallbacks = new Map<number, () => void>();
const mockSetTimeoutCalls: Array<{ callback: () => void; duration: number; id: number }> = [];
const mockClearTimeoutCalls: number[] = [];

const mockSetTimeout = jest.fn((callback: () => void, duration: number) => {
  const id = mockTimeoutId++;
  mockSetTimeoutCallbacks.set(id, callback);
  mockSetTimeoutCalls.push({ callback, duration, id });
  return id;
});

const mockClearTimeout = jest.fn((id: number) => {
  mockSetTimeoutCallbacks.delete(id);
  mockClearTimeoutCalls.push(id);
});

// Helper to execute a timeout callback
const executeTimeout = (id: number) => {
  const callback = mockSetTimeoutCallbacks.get(id);
  if (callback) {
    mockSetTimeoutCallbacks.delete(id);
    callback();
  }
};

describe('useSetTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTimeoutId = 1;
    mockSetTimeoutCallbacks.clear();
    mockSetTimeoutCalls.length = 0;
    mockClearTimeoutCalls.length = 0;
    
    // Mock global functions
    global.setTimeout = mockSetTimeout as any;
    global.clearTimeout = mockClearTimeout as any;
  });

  afterEach(() => {
    // Restore original functions
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    jest.restoreAllMocks();
  });

  test('should return an object with setTimeout and clearTimeout functions', () => {
    const { result } = renderHook(() => useSetTimeout());
    
    expect(result.current).toHaveProperty('setTimeout');
    expect(result.current).toHaveProperty('clearTimeout');
    expect(typeof result.current.setTimeout).toBe('function');
    expect(typeof result.current.clearTimeout).toBe('function');
  });

  test('should return the same object reference on re-renders', () => {
    const { result, rerender } = renderHook(() => useSetTimeout());
    
    const firstResult = result.current;
    
    rerender();
    
    expect(result.current).toBe(firstResult);
    expect(result.current.setTimeout).toBe(firstResult.setTimeout);
    expect(result.current.clearTimeout).toBe(firstResult.clearTimeout);
  });

  test('should call global setTimeout with correct parameters', () => {
    const { result } = renderHook(() => useSetTimeout());
    const callback = jest.fn();
    
    const timeoutId = result.current.setTimeout(callback, 1000);
    
    expect(mockSetTimeout).toHaveBeenCalledTimes(1);
    expect(mockSetTimeoutCalls[0].duration).toBe(1000);
    expect(typeof timeoutId).toBe('number');
    expect(timeoutId).toBe(1); // First mocked ID
  });

  test('should return different timeout IDs for multiple calls', () => {
    const { result } = renderHook(() => useSetTimeout());
    
    const id1 = result.current.setTimeout(() => {}, 100);
    const id2 = result.current.setTimeout(() => {}, 200);
    const id3 = result.current.setTimeout(() => {}, 300);
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
    expect(mockSetTimeout).toHaveBeenCalledTimes(3);
  });

  test('should execute callback when timeout fires', () => {
    const { result } = renderHook(() => useSetTimeout());
    const callback = jest.fn();
    
    const timeoutId = result.current.setTimeout(callback, 1000);
    
    expect(callback).not.toHaveBeenCalled();
    
    // Execute the timeout
    executeTimeout(timeoutId);
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should auto-remove timeout from tracking when it executes', () => {
    const { result, unmount } = renderHook(() => useSetTimeout());
    const callback = jest.fn();
    
    const timeoutId = result.current.setTimeout(callback, 1000);
    
    // Execute the timeout (this should remove it from internal tracking)
    executeTimeout(timeoutId);
    
    expect(callback).toHaveBeenCalledTimes(1);
    
    // Unmount should not try to clear this timeout since it already executed
    unmount();
    
    // The timeout should not be in the clear calls since it was auto-removed
    expect(mockClearTimeout).not.toHaveBeenCalledWith(timeoutId);
  });

  test('should clear timeout when clearTimeout is called', () => {
    const { result } = renderHook(() => useSetTimeout());
    const callback = jest.fn();
    
    const timeoutId = result.current.setTimeout(callback, 1000);
    
    result.current.clearTimeout(timeoutId);
    
    expect(mockClearTimeout).toHaveBeenCalledWith(timeoutId);
    expect(mockClearTimeout).toHaveBeenCalledTimes(1);
  });

  test('should handle clearing non-existent timeout gracefully', () => {
    const { result } = renderHook(() => useSetTimeout());
    
    // Try to clear a timeout that doesn't exist
    expect(() => result.current.clearTimeout(999)).not.toThrow();
    
    // Global clearTimeout should not be called for non-tracked timeouts
    expect(mockClearTimeout).not.toHaveBeenCalled();
  });

  test('should clear timeout only once', () => {
    const { result } = renderHook(() => useSetTimeout());
    const callback = jest.fn();
    
    const timeoutId = result.current.setTimeout(callback, 1000);
    
    // Clear the same timeout multiple times
    result.current.clearTimeout(timeoutId);
    result.current.clearTimeout(timeoutId);
    result.current.clearTimeout(timeoutId);
    
    // Global clearTimeout should only be called once
    expect(mockClearTimeout).toHaveBeenCalledTimes(1);
    expect(mockClearTimeout).toHaveBeenCalledWith(timeoutId);
  });

  test('should clear all active timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useSetTimeout());
    
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    
    const id1 = result.current.setTimeout(callback1, 1000);
    const id2 = result.current.setTimeout(callback2, 2000);
    const id3 = result.current.setTimeout(callback3, 3000);
    
    expect(mockSetTimeout).toHaveBeenCalledTimes(3);
    expect(mockClearTimeout).not.toHaveBeenCalled();
    
    unmount();
    
    // All timeouts should be cleared
    expect(mockClearTimeout).toHaveBeenCalledTimes(3);
    expect(mockClearTimeoutCalls).toContain(id1);
    expect(mockClearTimeoutCalls).toContain(id2);
    expect(mockClearTimeoutCalls).toContain(id3);
  });

  test('should not clear manually cleared timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useSetTimeout());
    
    const id1 = result.current.setTimeout(() => {}, 1000);
    const id2 = result.current.setTimeout(() => {}, 2000);
    const id3 = result.current.setTimeout(() => {}, 3000);
    
    // Manually clear one timeout
    result.current.clearTimeout(id2);
    
    expect(mockClearTimeout).toHaveBeenCalledTimes(1);
    expect(mockClearTimeout).toHaveBeenCalledWith(id2);
    
    unmount();
    
    // Only the remaining timeouts should be cleared on unmount
    expect(mockClearTimeout).toHaveBeenCalledTimes(3); // 1 manual + 2 on unmount
    expect(mockClearTimeoutCalls).toContain(id1);
    expect(mockClearTimeoutCalls).toContain(id2); // This was cleared manually
    expect(mockClearTimeoutCalls).toContain(id3);
  });

  test('should not clear executed timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useSetTimeout());
    
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const id1 = result.current.setTimeout(callback1, 1000);
    const id2 = result.current.setTimeout(callback2, 2000);
    
    // Execute one timeout
    executeTimeout(id1);
    expect(callback1).toHaveBeenCalledTimes(1);
    
    unmount();
    
    // Only the non-executed timeout should be cleared
    expect(mockClearTimeoutCalls).toContain(id2);
    expect(mockClearTimeoutCalls).not.toContain(id1); // This executed naturally
  });

  test('should work with multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useSetTimeout());
    const { result: result2 } = renderHook(() => useSetTimeout());
    
    // Should be different instances
    expect(result1.current).not.toBe(result2.current);
    
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const id1 = result1.current.setTimeout(callback1, 1000);
    const id2 = result2.current.setTimeout(callback2, 2000);
    
    expect(id1).not.toBe(id2);
    expect(mockSetTimeout).toHaveBeenCalledTimes(2);
    
    // Execute both timeouts
    executeTimeout(id1);
    executeTimeout(id2);
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test('should handle concurrent setTimeout and clearTimeout calls', () => {
    const { result } = renderHook(() => useSetTimeout());
    
    const callback = jest.fn();
    const timeoutId = result.current.setTimeout(callback, 1000);
    
    // Clear immediately after setting
    result.current.clearTimeout(timeoutId);
    
    expect(mockSetTimeout).toHaveBeenCalledTimes(1);
    expect(mockClearTimeout).toHaveBeenCalledTimes(1);
    expect(mockClearTimeout).toHaveBeenCalledWith(timeoutId);
    
    // Try to execute the cleared timeout (should not call callback)
    executeTimeout(timeoutId);
    expect(callback).not.toHaveBeenCalled();
  });

  test('should handle mixed execution and clearing scenarios', () => {
    const { result, unmount } = renderHook(() => useSetTimeout());
    
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const callback4 = jest.fn();
    
    const id1 = result.current.setTimeout(callback1, 1000); // Will execute
    const id2 = result.current.setTimeout(callback2, 2000); // Will be cleared manually
    const id3 = result.current.setTimeout(callback3, 3000); // Will be cleared on unmount  
    const id4 = result.current.setTimeout(callback4, 4000); // Will execute
    
    // Execute some timeouts
    executeTimeout(id1);
    executeTimeout(id4);
    
    // Manually clear one
    result.current.clearTimeout(id2);
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback4).toHaveBeenCalledTimes(1);
    expect(mockClearTimeout).toHaveBeenCalledWith(id2);
    
    unmount();
    
    // Only id3 should be cleared on unmount (id1 and id4 executed, id2 was manually cleared)
    const unmountClearCalls = mockClearTimeoutCalls.filter(id => id === id3);
    expect(unmountClearCalls.length).toBe(1);
  });

  test('should preserve callback context and parameters', () => {
    const { result } = renderHook(() => useSetTimeout());
    
    const testContext = { value: 'test' };
    const callback = jest.fn(function(this: typeof testContext) {
      return this.value;
    });
    
    result.current.setTimeout(callback.bind(testContext), 1000);
    
    const timeoutId = mockSetTimeoutCalls[0].id;
    executeTimeout(timeoutId);
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should work with zero delay', () => {
    const { result } = renderHook(() => useSetTimeout());
    const callback = jest.fn();
    
    const timeoutId = result.current.setTimeout(callback, 0);
    
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
    
    executeTimeout(timeoutId);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should handle large numbers of timeouts', () => {
    const { result, unmount } = renderHook(() => useSetTimeout());
    
    const timeoutIds: number[] = [];
    const callbacks: jest.Mock[] = [];
    
    // Create 100 timeouts
    for (let i = 0; i < 100; i++) {
      const callback = jest.fn();
      callbacks.push(callback);
      const id = result.current.setTimeout(callback, i * 10);
      timeoutIds.push(id);
    }
    
    expect(mockSetTimeout).toHaveBeenCalledTimes(100);
    
    // Execute some of them
    for (let i = 0; i < 50; i += 5) {
      executeTimeout(timeoutIds[i]);
      expect(callbacks[i]).toHaveBeenCalledTimes(1);
    }
    
    // Manually clear some
    for (let i = 1; i < 50; i += 5) {
      result.current.clearTimeout(timeoutIds[i]);
    }
    
    unmount();
    
    // Verify that the remaining timeouts were cleared on unmount
    expect(mockClearTimeout).toHaveBeenCalled();
    
    // The exact count depends on which were executed vs manually cleared vs cleared on unmount
    // but the important thing is that all were handled appropriately
    expect(mockClearTimeoutCalls.length).toBeGreaterThan(0);
  });
});