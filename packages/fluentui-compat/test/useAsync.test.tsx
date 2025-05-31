import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { useAsync } from '../src/useAsync';

// Mock the Async class from @fluentui/utilities
const mockDispose = jest.fn();
const mockSetTimeout = jest.fn();
const mockSetInterval = jest.fn();

jest.mock('@fluentui/utilities', () => ({
  Async: jest.fn().mockImplementation(() => ({
    dispose: mockDispose,
    setTimeout: mockSetTimeout,
    setInterval: mockSetInterval,
  })),
}));

describe('useAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.warn mock
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should create and return a stable Async instance', () => {
    const { result, rerender } = renderHook(() => useAsync());
    
    const firstInstance = result.current;
    expect(firstInstance).toBeDefined();
    expect(typeof firstInstance.dispose).toBe('function');
    
    // Re-render should return the same instance
    rerender();
    expect(result.current).toBe(firstInstance);
  });

  test('should dispose Async instance on unmount', () => {
    const { unmount } = renderHook(() => useAsync());
    
    expect(mockDispose).not.toHaveBeenCalled();
    
    unmount();
    
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  test('should provide working async methods', () => {
    const { result } = renderHook(() => useAsync());
    const asyncInstance = result.current;
    
    // Test that methods are available
    expect(typeof asyncInstance.setTimeout).toBe('function');
    expect(typeof asyncInstance.setInterval).toBe('function');
    
    // Test that methods can be called
    const callback = jest.fn();
    asyncInstance.setTimeout(callback, 1000);
    
    expect(mockSetTimeout).toHaveBeenCalledWith(callback, 1000);
  });

  test('should warn in development when component unmounts quickly', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const TestComponent = () => {
      useAsync();
      return <div>Test</div>;
    };
    
    const { unmount } = render(<TestComponent />);
    
    // Unmount immediately (should trigger warning)
    unmount();
    
    // Wait a bit for the effect cleanup to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'useAsync: Component unmounted very quickly. Ensure async operations are properly handled.'
    );
    
    process.env.NODE_ENV = originalNodeEnv;
    consoleWarnSpy.mockRestore();
  });

  test('should not warn in production when component unmounts quickly', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const TestComponent = () => {
      useAsync();
      return <div>Test</div>;
    };
    
    const { unmount } = render(<TestComponent />);
    
    // Unmount immediately
    unmount();
    
    // Wait a bit for any potential effect cleanup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalNodeEnv;
    consoleWarnSpy.mockRestore();
  });

  test('should work with multiple instances', () => {
    const { result: result1 } = renderHook(() => useAsync());
    const { result: result2 } = renderHook(() => useAsync());
    
    // Should be different instances
    expect(result1.current).not.toBe(result2.current);
    
    // Both should have working methods
    expect(typeof result1.current.dispose).toBe('function');
    expect(typeof result2.current.dispose).toBe('function');
  });

  test('should handle React DevTools debug value in development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // This test mainly ensures the useDebugValue call doesn't throw
    const { result } = renderHook(() => useAsync());
    
    expect(result.current).toBeDefined();
    
    process.env.NODE_ENV = originalNodeEnv;
  });
});