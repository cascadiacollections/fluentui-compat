import * as React from 'react';

/**
 * Unique symbol used to identify uninitialized state.
 * Using a symbol ensures no possible collision with user values.
 * @internal
 */
const UNINITIALIZED = Symbol('useConst.uninitialized');

/**
 * Type predicate to safely identify initializer functions.
 * This approach eliminates the need for type assertions in the main logic.
 * @internal
 */
function isInitializerFunction<T>(
  value: T | (() => T)
): value is () => T {
  return typeof value === 'function';
}

/**
 * Hook to initialize and return a constant value with stable identity.
 * 
 * Unlike `React.useMemo`, this hook guarantees:
 * - The initializer function is called exactly once
 * - The returned value identity never changes
 * - No re-computation on dependency changes
 * 
 * This is equivalent to setting a private member in a class constructor.
 * 
 * @template T - The type of the constant value
 * @param initialValue - The initial value or a function that returns the initial value.
 *                      Only the value/function passed on the first render is used.
 * @returns The constant value. The identity of this value will always be the same.
 * 
 * @example
 * ```typescript
 * // Initialize with a value
 * const constantValue = useConst(42);
 * 
 * // Initialize with a function (called only once)
 * const expensiveObject = useConst(() => ({
 *   data: performExpensiveComputation(),
 *   timestamp: Date.now()
 * }));
 * 
 * // Works correctly with falsy values
 * const undefinedValue = useConst(() => undefined);
 * const nullValue = useConst(null);
 * const falseValue = useConst(false);
 * ```
 * 
 * @example
 * ```typescript
 * // Common use cases
 * function MyComponent() {
 *   // Create stable RegExp instance
 *   const emailRegex = useConst(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
 *   
 *   // Create stable configuration object
 *   const config = useConst(() => ({
 *     apiUrl: process.env.REACT_APP_API_URL,
 *     timeout: 5000
 *   }));
 *   
 *   // Create stable event handler
 *   const handleClick = useConst(() => () => {
 *     console.log('Button clicked');
 *   });
 *   
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useMemo | React.useMemo} for dependency-based memoization
 * @see {@link https://react.dev/reference/react/useCallback | React.useCallback} for memoizing callbacks
 * 
 * @public
 * @since 1.0.0
 */
export function useConst<T>(initialValue: T | (() => T)): T {
  // Use a ref to store the value with a union type that includes our sentinel
  const ref = React.useRef<T | typeof UNINITIALIZED>(UNINITIALIZED);
  
  // Only initialize if we haven't set a value yet
  if (ref.current === UNINITIALIZED) {
    if (isInitializerFunction(initialValue)) {
      // TypeScript now knows initialValue is definitely () => T
      ref.current = initialValue(); // ✅ No casting needed!
    } else {
      // TypeScript now knows initialValue is definitely T
      ref.current = initialValue; // ✅ No casting needed!
    }
  }
  
  // This is the only remaining cast, and it's safe because we guarantee initialization
  return ref.current as T;
}