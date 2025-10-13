import * as React from 'react';

/**
 * Sentinel value to indicate no previous value exists yet.
 * Using a symbol ensures no collision with actual values.
 * @internal
 */
const NO_PREVIOUS_VALUE = Symbol('usePrevious.noPreviousValue');

/**
 * Hook to track and return the previous value of a prop or state.
 * 
 * This hook captures and returns the value from the previous render, which is useful for:
 * - **Comparison logic**: Detecting when a value has changed
 * - **Animation triggers**: Starting animations when values change
 * - **Effect optimization**: Avoiding unnecessary effects when values haven't changed
 * - **Debugging**: Tracking value changes over time
 * 
 * **Implementation Details**:
 * - Uses `useEffect` to update the previous value after render
 * - On first render, returns `undefined` since there's no previous value
 * - Works with any type including primitives, objects, and functions
 * - Does not deep-compare objects - only tracks reference changes
 * 
 * @param value - The current value to track
 * @returns The value from the previous render, or `undefined` on first render
 * 
 * @example
 * ```typescript
 * // Detect when a prop changes
 * function UserProfile({ userId }: { userId: string }) {
 *   const previousUserId = usePrevious(userId);
 *   
 *   useEffect(() => {
 *     if (previousUserId !== undefined && previousUserId !== userId) {
 *       console.log('User changed from', previousUserId, 'to', userId);
 *       // Fetch new user data
 *     }
 *   }, [userId, previousUserId]);
 *   
 *   return <div>User: {userId}</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Track count changes for animations
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const previousCount = usePrevious(count);
 *   
 *   const isIncreasing = previousCount !== undefined && count > previousCount;
 *   const isDecreasing = previousCount !== undefined && count < previousCount;
 *   
 *   return (
 *     <div>
 *       <h2 className={isIncreasing ? 'animate-up' : isDecreasing ? 'animate-down' : ''}>
 *         {count}
 *       </h2>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *       <button onClick={() => setCount(c => c - 1)}>Decrement</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Optimize effects by comparing previous and current values
 * function DataFetcher({ filters }: { filters: FilterObject }) {
 *   const previousFilters = usePrevious(filters);
 *   const [data, setData] = useState(null);
 *   
 *   useEffect(() => {
 *     // Only fetch if filters actually changed (by reference)
 *     if (previousFilters !== filters) {
 *       fetchData(filters).then(setData);
 *     }
 *   }, [filters, previousFilters]);
 *   
 *   return <DataDisplay data={data} />;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Handle both first render and value changes
 * function SearchResults({ query }: { query: string }) {
 *   const previousQuery = usePrevious(query);
 *   
 *   if (previousQuery === undefined) {
 *     return <div>Enter a search query</div>;
 *   }
 *   
 *   if (previousQuery !== query) {
 *     return <div>Searching for "{query}"...</div>;
 *   }
 *   
 *   return <div>Results for "{query}"</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Track object reference changes
 * function ComponentWithConfig({ config }: { config: Config }) {
 *   const previousConfig = usePrevious(config);
 *   
 *   useEffect(() => {
 *     // This will only run when config reference changes
 *     if (previousConfig !== config) {
 *       console.log('Config reference changed');
 *       // Re-initialize based on new config
 *     }
 *   }, [config, previousConfig]);
 *   
 *   return <div>Component</div>;
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useEffect | React.useEffect} for side effects
 * @see {@link https://react.dev/reference/react/useRef | React.useRef} for persisting values
 * @see {@link useEventCallback} for callbacks that always use current values
 * 
 * @public
 */
export function usePrevious<T>(value: T): T | undefined {
  // Store both current and previous values in a ref
  const ref = React.useRef<T | typeof NO_PREVIOUS_VALUE>(NO_PREVIOUS_VALUE);
  
  // Get the previous value before updating
  const previous = ref.current === NO_PREVIOUS_VALUE ? undefined : ref.current;
  
  // Update ref after render completes
  React.useEffect(() => {
    ref.current = value;
  });
  
  // Return the previous value
  return previous;
}
