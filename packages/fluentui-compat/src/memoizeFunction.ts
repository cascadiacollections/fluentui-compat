/**
 * Improved memoization utilities optimized for runtime performance and memory efficiency.
 * Based on FluentUI utilities with performance enhancements and modern JavaScript features.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Use a more robust WeakMap detection
const hasWeakMap = typeof WeakMap !== 'undefined' && WeakMap;

// Global reset counter for cache invalidation
let _resetCounter = 0;

// Sentinel objects for special value normalization
const _nullObject = Object.freeze({ __null: true });
const _undefinedObject = Object.freeze({ __undefined: true });

// Wrapper objects so primitives can be used as WeakMap keys. One entry per
// distinct primitive, shared by every memoized function.
const _primitiveCache = new Map<any, { val: any }>();

// Inserts keep the map at this size. resetMemoizations() is not required
// for the bound to hold.
const primitiveCacheThreshold = 1000;

interface IMemoizeNode {
  map: WeakMap<any, any> | null;
  value?: any;
  error?: any;
}

/**
 * Reset all memoizations by incrementing the global reset counter.
 * This is more efficient than clearing individual caches.
 * 
 * @public
 */
export function resetMemoizations(): void {
  _resetCounter++;
  // Inserts already cap the map. This only runs if it somehow grows past the cap.
  if (_primitiveCache.size > primitiveCacheThreshold) {
    _primitiveCache.clear();
  }
}

/**
 * Utility for providing a custom WeakMap implementation for testing.
 * 
 * @internal
 */
export function setMemoizeWeakMap(/* _weakMapImpl: any */): void {
  // This is primarily for testing - we'll use the global WeakMap check instead
  // of a mutable reference to avoid potential security issues
}

/**
 * Creates a highly optimized memoizer for single-argument functions where the argument
 * is an object or function. Uses WeakMap for automatic memory management.
 * 
 * This is ideal for functions that transform objects/functions and need automatic cleanup
 * when the source objects are garbage collected.
 * 
 * @param getValue - Function to memoize (must accept single object/function argument)
 * @returns Memoized version of the function with WeakMap-based caching
 * 
 * @example
 * ```typescript
 * const expensiveTransform = createMemoizer((obj: SomeObject) => ({
 *   ...obj,
 *   computed: performExpensiveComputation(obj)
 * }));
 * 
 * // Subsequent calls with same object reference return cached result
 * const result1 = expensiveTransform(myObj);
 * const result2 = expensiveTransform(myObj); // Returns cached result
 * ```
 * 
 * @public
 */
export function createMemoizer<F extends (input: any) => any>(getValue: F): F {
  if (!hasWeakMap) {
    // Graceful degradation - return original function if WeakMap unavailable
    return getValue;
  }

  const cache = new WeakMap<any, any>();

  function memoizedGetValue(input: any): any {
    // Fast path for non-objects - cannot be memoized with WeakMap
    if (!input || (typeof input !== 'function' && typeof input !== 'object')) {
      return getValue(input);
    }

    // Check cache first
    if (cache.has(input)) {
      return cache.get(input);
    }

    // Compute and cache result
    const value = getValue(input);
    cache.set(input, value);

    return value;
  }

  return memoizedGetValue as F;
}

/**
 * Highly optimized memoization function that caches results based on argument identity.
 * Provides configurable cache size limits and automatic memory management.
 * 
 * Key performance optimizations:
 * - Uses WeakMap for automatic garbage collection of object arguments
 * - Efficient primitive value caching with shared dictionary
 * - Configurable cache size limits to prevent memory leaks  
 * - Global reset counter for bulk cache invalidation
 * - Fast argument normalization
 * 
 * @param fn - Function to memoize
 * @param maxCacheSize - Maximum cache entries before reset (0 = unlimited, default 100)
 * @param ignoreNullOrUndefinedResult - When true, a later call recomputes while the cached
 * result is null or undefined. The call that produced that result runs the function once.
 * @returns Memoized version of the function
 * 
 * @example
 * ```typescript
 * const expensiveFunction = memoizeFunction((a: number, b: string) => {
 *   // Expensive computation
 *   return a * b.length + Math.random();
 * });
 * 
 * // Subsequent calls with same arguments return cached result
 * const result1 = expensiveFunction(5, "hello");
 * const result2 = expensiveFunction(5, "hello"); // Cached
 * ```
 * 
 * @public
 */
export function memoizeFunction<T extends (...args: any[]) => RetType, RetType>(
  fn: T,
  maxCacheSize: number = 100,
  ignoreNullOrUndefinedResult: boolean = false,
): T {
  // Graceful degradation for environments without WeakMap
  if (!hasWeakMap) {
    return fn;
  }

  let rootNode: IMemoizeNode | undefined;
  let cacheSize = 0;
  let localResetCounter = _resetCounter;

  return function memoizedFunction(...args: any[]): RetType {
    // Check if cache needs reset
    if (
      rootNode === undefined ||
      localResetCounter !== _resetCounter ||
      (maxCacheSize > 0 && cacheSize > maxCacheSize)
    ) {
      rootNode = _createNode();
      cacheSize = 0;
      localResetCounter = _resetCounter;
    }

    let currentNode: IMemoizeNode = rootNode;

    // Traverse argument tree
    for (let i = 0; i < args.length; i++) {
      const normalizedArg = _normalizeArg(args[i]);

      if (!currentNode.map!.has(normalizedArg)) {
        currentNode.map!.set(normalizedArg, _createNode());
      }

      currentNode = currentNode.map!.get(normalizedArg);
    }

    // Read before computing. A null/undefined result from this call must not
    // fall through into the recompute below, or the function runs twice.
    const hasValue = Object.prototype.hasOwnProperty.call(currentNode, 'value');
    const hasError = Object.prototype.hasOwnProperty.call(currentNode, 'error');

    if (!hasValue && !hasError) {
      try {
        currentNode.value = fn(...args);
      } catch (error) {
        // Cache errors from the initial computation. Later calls rethrow this.
        currentNode.error = error;
      }
      cacheSize++;
    } else if (
      ignoreNullOrUndefinedResult &&
      hasValue &&
      !hasError &&
      (currentNode.value === null || currentNode.value === undefined)
    ) {
      // Previous call cached null/undefined. Try again on this later call.
      // A throw leaves that cached result in place so the next call can retry.
      // Storing the error would make every later call throw it and never retry.
      currentNode.value = fn(...args);
    }

    if (Object.prototype.hasOwnProperty.call(currentNode, 'error')) {
      throw currentNode.error;
    }

    return currentNode.value;
  } as T;
}

/**
 * Normalizes arguments for consistent caching behavior.
 * Uses efficient strategies for different value types.
 */
function _normalizeArg(val: any): any {
  // Handle null and undefined with distinct sentinels
  if (val === null) {
    return _nullObject;
  }
  if (val === undefined) {
    return _undefinedObject;
  }

  // Objects and functions can be used directly as WeakMap keys
  if (typeof val === 'object' || typeof val === 'function') {
    return val;
  }

  // Primitives need a stable object so they can be WeakMap keys.
  const cached = _primitiveCache.get(val);
  if (cached) {
    return cached;
  }

  // Drop the oldest wrapper instead of growing without bound. The trie stores
  // the wrapper object, not the primitive, so a dropped wrapper can only miss.
  // Reusing the object for a new primitive would return the wrong result.
  if (_primitiveCache.size >= primitiveCacheThreshold) {
    const oldest = _primitiveCache.keys().next().value;
    _primitiveCache.delete(oldest);
  }

  const created = { val };
  _primitiveCache.set(val, created);
  return created;
}

/**
 * Creates a new memoization tree node with WeakMap for child caching.
 */
function _createNode(): IMemoizeNode {
  return {
    map: hasWeakMap ? new WeakMap<any, any>() : null,
  };
}
