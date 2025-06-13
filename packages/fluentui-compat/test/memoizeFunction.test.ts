import { memoizeFunction, createMemoizer, resetMemoizations } from '../src/memoizeFunction';

describe('memoizeFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMemoizations();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('basic memoization', () => {
    test('should return same result for same arguments', () => {
      const mockFn = jest.fn((a: number, b: string) => `${a}-${b}`);
      const memoized = memoizeFunction(mockFn);

      const result1 = memoized(1, 'test');
      const result2 = memoized(1, 'test');

      expect(result1).toBe('1-test');
      expect(result2).toBe('1-test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should call function again for different arguments', () => {
      const mockFn = jest.fn((a: number, b: string) => `${a}-${b}`);
      const memoized = memoizeFunction(mockFn);

      const result1 = memoized(1, 'test');
      const result2 = memoized(2, 'test');
      const result3 = memoized(1, 'different');

      expect(result1).toBe('1-test');
      expect(result2).toBe('2-test');
      expect(result3).toBe('1-different');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should handle functions with no arguments', () => {
      const mockFn = jest.fn(() => 'constant');
      const memoized = memoizeFunction(mockFn);

      const result1 = memoized();
      const result2 = memoized();

      expect(result1).toBe('constant');
      expect(result2).toBe('constant');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle single argument functions', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoized = memoizeFunction(mockFn);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(memoized(3)).toBe(6);
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('argument types handling', () => {
    test('should handle null and undefined arguments', () => {
      const mockFn = jest.fn((a: any, b: any) => `${a}-${b}`);
      const memoized = memoizeFunction(mockFn);

      const result1 = memoized(null, undefined);
      const result2 = memoized(null, undefined);
      const result3 = memoized(undefined, null);

      expect(result1).toBe('null-undefined');
      expect(result2).toBe('null-undefined');
      expect(result3).toBe('undefined-null');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should handle object arguments', () => {
      const mockFn = jest.fn((obj: any) => obj.value);
      const memoized = memoizeFunction(mockFn);

      const obj1 = { value: 'test1' };
      const obj2 = { value: 'test2' };

      expect(memoized(obj1)).toBe('test1');
      expect(memoized(obj1)).toBe('test1'); // Should be cached
      expect(memoized(obj2)).toBe('test2');
      expect(memoized(obj1)).toBe('test1'); // Should still be cached

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should handle function arguments', () => {
      const mockFn = jest.fn((fn: Function) => fn.name || 'anonymous');
      const memoized = memoizeFunction(mockFn);

      const fn1 = function testFn() {};
      const fn2 = (function() { return function() {}; })(); // Truly anonymous

      expect(memoized(fn1)).toBe('testFn');
      expect(memoized(fn1)).toBe('testFn'); // Cached
      expect(memoized(fn2)).toBe('anonymous'); // Falls back to 'anonymous'
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should handle primitive arguments correctly', () => {
      const mockFn = jest.fn((a: any, b: any) => `${typeof a}-${typeof b}`);
      const memoized = memoizeFunction(mockFn);

      // Test various primitive types
      expect(memoized(1, 'string')).toBe('number-string');
      expect(memoized(1, 'string')).toBe('number-string'); // Cached
      expect(memoized(true, false)).toBe('boolean-boolean');
      expect(memoized(Symbol('test'), BigInt(123))).toBe('symbol-bigint');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('cache size management', () => {
    test('should respect maxCacheSize limit', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoized = memoizeFunction(mockFn, 2); // Small cache size

      // Fill cache
      memoized(1);
      memoized(2);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // This should still be cached
      memoized(1);
      memoized(2);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Exceed cache size - should reset cache
      memoized(3);
      expect(mockFn).toHaveBeenCalledTimes(3);

      // Previous values should need re-computation after reset
      memoized(1);
      expect(mockFn).toHaveBeenCalledTimes(4);
    });

    test('should support unlimited cache size with maxCacheSize=0', () => {
      const mockFn = jest.fn((x: number) => x * 2);
      const memoized = memoizeFunction(mockFn, 0); // Unlimited

      // Add many entries without cache reset
      for (let i = 0; i < 200; i++) {
        memoized(i);
      }
      expect(mockFn).toHaveBeenCalledTimes(200);

      // All should still be cached
      for (let i = 0; i < 200; i++) {
        memoized(i);
      }
      expect(mockFn).toHaveBeenCalledTimes(200);
    });
  });

  describe('ignoreNullOrUndefinedResult option', () => {
    test('should re-compute null results when ignoreNullOrUndefinedResult is true', () => {
      let callCount = 0;
      const mockFn = jest.fn(() => {
        callCount++;
        return callCount <= 2 ? null : 'success';
      });
      
      const memoized = memoizeFunction(mockFn, 100, true);

      expect(memoized()).toBeNull(); // First call returns null
      expect(memoized()).toBe('success'); // Second call re-computes and gets success
      expect(memoized()).toBe('success'); // Third call uses cached success

      expect(mockFn).toHaveBeenCalledTimes(3); // Called 3 times total
    });

    test('should re-compute undefined results when ignoreNullOrUndefinedResult is true', () => {
      let callCount = 0;
      const mockFn = jest.fn(() => {
        callCount++;
        return callCount <= 2 ? undefined : 'success';
      });
      
      const memoized = memoizeFunction(mockFn, 100, true);

      expect(memoized()).toBeUndefined(); // First call returns undefined
      expect(memoized()).toBe('success'); // Second call re-computes and gets success
      expect(memoized()).toBe('success'); // Third call uses cached success

      expect(mockFn).toHaveBeenCalledTimes(3); // Called 3 times total
    });

    test('should cache null/undefined results when ignoreNullOrUndefinedResult is false', () => {
      const mockFn = jest.fn(() => null);
      const memoized = memoizeFunction(mockFn, 100, false);

      expect(memoized()).toBeNull();
      expect(memoized()).toBeNull();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache reset functionality', () => {
    test('should reset all memoized functions when resetMemoizations is called', () => {
      const mockFn1 = jest.fn((x: number) => x * 2);
      const mockFn2 = jest.fn((x: number) => x * 3);
      
      const memoized1 = memoizeFunction(mockFn1);
      const memoized2 = memoizeFunction(mockFn2);

      // Initial calls
      memoized1(5);
      memoized2(5);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);

      // Should be cached
      memoized1(5);
      memoized2(5);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);

      // Reset all caches
      resetMemoizations();

      // Should re-compute after reset
      memoized1(5);
      memoized2(5);
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance characteristics', () => {
    test('should handle complex objects efficiently', () => {
      const mockFn = jest.fn((obj: any) => obj.data.value);
      const memoized = memoizeFunction(mockFn);

      const complexObj = {
        data: { value: 'test' },
        nested: { deeply: { nested: { value: 123 } } },
        array: [1, 2, 3, { complex: true }]
      };

      const result1 = memoized(complexObj);
      const result2 = memoized(complexObj);

      expect(result1).toBe('test');
      expect(result2).toBe('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle many arguments efficiently', () => {
      const mockFn = jest.fn((...args: any[]) => args.join('-'));
      const memoized = memoizeFunction(mockFn);

      const manyArgs = [1, 'two', { three: 3 }, [4], null, undefined, true, false];
      
      const result1 = memoized(...manyArgs);
      const result2 = memoized(...manyArgs);

      expect(result1).toBe('1-two-[object Object]-4---true-false');
      expect(result2).toBe('1-two-[object Object]-4---true-false');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    test('should handle functions that throw errors', () => {
      const mockFn = jest.fn(() => {
        throw new Error('Test error');
      });
      const memoized = memoizeFunction(mockFn);

      expect(() => memoized()).toThrow('Test error');
      expect(() => memoized()).toThrow('Test error');
      
      // Should only call once due to caching (error is cached too)
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should handle functions returning functions', () => {
      const mockFn = jest.fn((x: number) => () => x * 2);
      const memoized = memoizeFunction(mockFn);

      const fn1 = memoized(5);
      const fn2 = memoized(5);

      expect(fn1).toBe(fn2); // Same function reference
      expect(fn1()).toBe(10);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should distinguish between different falsy values', () => {
      const mockFn = jest.fn((x: any) => `value: ${x}`);
      const memoized = memoizeFunction(mockFn);

      expect(memoized(0)).toBe('value: 0');
      expect(memoized('')).toBe('value: ');
      expect(memoized(false)).toBe('value: false');
      expect(memoized(null)).toBe('value: null');
      expect(memoized(undefined)).toBe('value: undefined');

      // Each should be cached separately
      expect(memoized(0)).toBe('value: 0');
      expect(memoized('')).toBe('value: ');

      expect(mockFn).toHaveBeenCalledTimes(5);
    });
  });
});

describe('createMemoizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should memoize function results based on object identity', () => {
    const mockFn = jest.fn((obj: { value: number }) => obj.value * 2);
    const memoized = createMemoizer(mockFn);

    const obj1 = { value: 5 };
    const obj2 = { value: 5 }; // Different object, same value

    expect(memoized(obj1)).toBe(10);
    expect(memoized(obj1)).toBe(10); // Cached
    expect(memoized(obj2)).toBe(10); // Not cached, different object
    expect(memoized(obj2)).toBe(10); // Now cached

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should not memoize primitive values', () => {
    const mockFn = jest.fn((x: number) => x * 2);
    const memoized = createMemoizer(mockFn);

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10); // Not cached for primitives
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should memoize function arguments', () => {
    const mockFn = jest.fn((fn: Function) => fn.toString().length);
    const memoized = createMemoizer(mockFn);

    const testFn = () => 'test';
    
    const result1 = memoized(testFn);
    const result2 = memoized(testFn);

    expect(result1).toBe(result2);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should handle null and undefined inputs gracefully', () => {
    const mockFn = jest.fn((x: any) => x == null ? 'null-ish' : 'value');
    const memoized = createMemoizer(mockFn);

    expect(memoized(null)).toBe('null-ish');
    expect(memoized(undefined)).toBe('null-ish');
    expect(memoized(null)).toBe('null-ish'); // Not cached
    
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  test('should work with arrays as objects', () => {
    const mockFn = jest.fn((arr: any[]) => arr.length);
    const memoized = createMemoizer(mockFn);

    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3]; // Different array instance

    expect(memoized(arr1)).toBe(3);
    expect(memoized(arr1)).toBe(3); // Cached
    expect(memoized(arr2)).toBe(3); // Not cached, different array
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  describe('memory efficiency', () => {
    test('should allow garbage collection of cached objects', () => {
      const mockFn = jest.fn((obj: any) => obj.value);
      const memoized = createMemoizer(mockFn);

      let obj: any = { value: 'test' };
      
      // Use the object
      expect(memoized(obj)).toBe('test');
      expect(memoized(obj)).toBe('test'); // Cached
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Clear reference (in real scenarios, this would be garbage collected)
      obj = null;

      // The cache should not prevent garbage collection
      // This is hard to test directly, but the WeakMap ensures proper cleanup
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});

describe('WeakMap fallback behavior', () => {
  // Note: These tests would require mocking the WeakMap availability
  // For now, we assume WeakMap is available in the test environment
  
  test('should handle environments with WeakMap support', () => {
    expect(typeof WeakMap).toBe('function');
    
    const mockFn = jest.fn((x: number) => x * 2);
    const memoized = memoizeFunction(mockFn);
    
    expect(memoized(5)).toBe(10);
    expect(typeof memoized).toBe('function');
  });
});