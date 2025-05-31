import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useConst } from '../src/useConst';

describe('useConst', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return the same value on multiple renders', () => {
    const { result, rerender } = renderHook(() => useConst(42));
    
    const firstValue = result.current;
    expect(firstValue).toBe(42);
    
    // Re-render should return the same value
    rerender();
    expect(result.current).toBe(42);
    expect(result.current).toBe(firstValue);
  });

  test('should call initializer function only once', () => {
    const initializer = jest.fn(() => 'test-value');
    const { result, rerender } = renderHook(() => useConst(initializer));
    
    expect(initializer).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('test-value');
    
    // Re-render should not call initializer again
    rerender();
    expect(initializer).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('test-value');
  });

  test('should return stable object identity', () => {
    const { result, rerender } = renderHook(() => 
      useConst(() => ({ value: 'test', timestamp: Date.now() }))
    );
    
    const firstObject = result.current;
    expect(firstObject).toEqual({ value: 'test', timestamp: expect.any(Number) });
    
    // Re-render should return the exact same object reference
    rerender();
    expect(result.current).toBe(firstObject);
    expect(result.current === firstObject).toBe(true);
  });

  test('should work with falsy values', () => {
    // Test with null
    const { result: nullResult } = renderHook(() => useConst(null));
    expect(nullResult.current).toBe(null);
    
    // Test with undefined
    const { result: undefinedResult } = renderHook(() => useConst(undefined));
    expect(undefinedResult.current).toBe(undefined);
    
    // Test with false
    const { result: falseResult } = renderHook(() => useConst(false));
    expect(falseResult.current).toBe(false);
    
    // Test with 0
    const { result: zeroResult } = renderHook(() => useConst(0));
    expect(zeroResult.current).toBe(0);
    
    // Test with empty string
    const { result: emptyStringResult } = renderHook(() => useConst(''));
    expect(emptyStringResult.current).toBe('');
  });

  test('should work with falsy values from functions', () => {
    // Test with function returning null
    const { result: nullResult } = renderHook(() => useConst(() => null));
    expect(nullResult.current).toBe(null);
    
    // Test with function returning undefined
    const { result: undefinedResult } = renderHook(() => useConst(() => undefined));
    expect(undefinedResult.current).toBe(undefined);
    
    // Test with function returning false
    const { result: falseResult } = renderHook(() => useConst(() => false));
    expect(falseResult.current).toBe(false);
    
    // Test with function returning empty string
    const { result: emptyStringResult } = renderHook(() => useConst(() => ''));
    expect(emptyStringResult.current).toBe('');
    
    // Test with function returning zero
    const { result: zeroResult } = renderHook(() => useConst(() => 0));
    expect(zeroResult.current).toBe(0);
  });

  test('should distinguish between function values and function initializers', () => {
    const testFunction = () => 'I am a function value';
    
    // When storing a function as a value, wrap it in an initializer
    const { result } = renderHook(() => useConst(() => testFunction));
    
    // Should return the function itself, not call it
    expect(result.current).toBe(testFunction);
    expect(typeof result.current).toBe('function');
    expect(result.current()).toBe('I am a function value');
  });

  test('should work with complex objects and arrays', () => {
    const complexObject = {
      nested: { value: 'test' },
      array: [1, 2, 3],
      fn: () => 'method'
    };
    
    const { result, rerender } = renderHook(() => useConst(() => complexObject));
    
    const firstResult = result.current;
    expect(firstResult).toBe(complexObject);
    expect(firstResult.nested.value).toBe('test');
    expect(firstResult.array).toEqual([1, 2, 3]);
    expect(firstResult.fn()).toBe('method');
    
    // Re-render should return same reference
    rerender();
    expect(result.current).toBe(firstResult);
  });

  test('should work with class instances', () => {
    class TestClass {
      value: string;
      constructor(value: string) {
        this.value = value;
      }
      getValue() {
        return this.value;
      }
    }
    
    const { result, rerender } = renderHook(() => 
      useConst(() => new TestClass('test-instance'))
    );
    
    const firstInstance = result.current;
    expect(firstInstance).toBeInstanceOf(TestClass);
    expect(firstInstance.value).toBe('test-instance');
    expect(firstInstance.getValue()).toBe('test-instance');
    
    // Re-render should return same instance
    rerender();
    expect(result.current).toBe(firstInstance);
  });

  test('should ignore parameter changes on subsequent renders', () => {
    let initialValue = 'first';
    const { result, rerender } = renderHook(({ value }) => useConst(value), {
      initialProps: { value: initialValue }
    });
    
    expect(result.current).toBe('first');
    
    // Change the parameter and re-render
    initialValue = 'second';
    rerender({ value: initialValue });
    
    // Should still return the original value
    expect(result.current).toBe('first');
  });

  test('should ignore initializer function changes on subsequent renders', () => {
    let initializer = () => 'first';
    const { result, rerender } = renderHook(({ fn }) => useConst(fn), {
      initialProps: { fn: initializer }
    });
    
    expect(result.current).toBe('first');
    
    // Change the initializer function and re-render
    initializer = () => 'second';
    rerender({ fn: initializer });
    
    // Should still return the original value
    expect(result.current).toBe('first');
  });

  test('should work with primitive types', () => {
    // Test string
    const { result: stringResult } = renderHook(() => useConst('test-string'));
    expect(stringResult.current).toBe('test-string');
    
    // Test number
    const { result: numberResult } = renderHook(() => useConst(123));
    expect(numberResult.current).toBe(123);
    
    // Test boolean
    const { result: boolResult } = renderHook(() => useConst(true));
    expect(boolResult.current).toBe(true);
    
    // Test symbol
    const testSymbol = Symbol('test');
    const { result: symbolResult } = renderHook(() => useConst(testSymbol));
    expect(symbolResult.current).toBe(testSymbol);
  });

  test('should work with RegExp instances', () => {
    const { result, rerender } = renderHook(() => 
      useConst(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    );
    
    const firstRegex = result.current;
    expect(firstRegex).toBeInstanceOf(RegExp);
    expect(firstRegex.test('test@example.com')).toBe(true);
    expect(firstRegex.test('invalid-email')).toBe(false);
    
    // Re-render should return same instance
    rerender();
    expect(result.current).toBe(firstRegex);
  });

  test('should work with Date instances', () => {
    const { result, rerender } = renderHook(() => 
      useConst(() => new Date('2023-01-01'))
    );
    
    const firstDate = result.current;
    expect(firstDate).toBeInstanceOf(Date);
    expect(firstDate.getFullYear()).toBe(2023);
    
    // Re-render should return same instance
    rerender();
    expect(result.current).toBe(firstDate);
  });

  test('should work in multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useConst('value1'));
    const { result: result2 } = renderHook(() => useConst('value2'));
    
    // Should have different values
    expect(result1.current).toBe('value1');
    expect(result2.current).toBe('value2');
    expect(result1.current).not.toBe(result2.current);
  });

  test('should work with expensive computations', () => {
    const expensiveComputation = jest.fn(() => {
      // Simulate expensive computation
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += i;
      }
      return result;
    });
    
    const { result, rerender } = renderHook(() => useConst(expensiveComputation));
    
    expect(expensiveComputation).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(499500); // Sum of 0 to 999
    
    // Re-render should not trigger expensive computation again
    rerender();
    expect(expensiveComputation).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(499500);
  });

  test('should handle functions that return functions', () => {
    const outerFunction = jest.fn(() => {
      return jest.fn(() => 'inner-result');
    });
    
    const { result, rerender } = renderHook(() => useConst(outerFunction));
    
    expect(outerFunction).toHaveBeenCalledTimes(1);
    expect(typeof result.current).toBe('function');
    
    const innerFunction = result.current;
    expect(innerFunction()).toBe('inner-result');
    
    // Re-render should return same function reference
    rerender();
    expect(outerFunction).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(innerFunction);
  });
});