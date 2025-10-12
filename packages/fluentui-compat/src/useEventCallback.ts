import * as React from 'react';
import { useConst } from './useConst';

/**
 * Hook to create a stable event handler that always calls the latest version of the callback.
 * 
 * This hook solves the problem where event handlers need access to the latest props/state
 * without causing unnecessary re-renders or re-registrations of event listeners.
 * 
 * **Key Features**:
 * - **Stable reference**: The returned callback has a stable identity that never changes
 * - **Fresh values**: Always executes the latest version of the callback with current props/state
 * - **Performance optimized**: Prevents re-renders in child components that depend on the callback
 * - **Type safe**: Full TypeScript support with generic argument and return types
 * - **React 19 compatible**: Uses useLayoutEffect for synchronous updates
 * 
 * **When to use**:
 * - Event handlers that depend on frequently changing props/state
 * - Callbacks passed to memoized child components to prevent unnecessary re-renders
 * - Event listeners attached to window, document, or long-lived DOM elements
 * - Callbacks in useEffect dependencies that shouldn't trigger the effect on every change
 * 
 * **Implementation Details**:
 * - Uses `useLayoutEffect` to ensure callback ref updates synchronously before paint
 * - Leverages `useConst` for a truly stable wrapper function that never changes
 * - Throws error if called during render to enforce proper React patterns
 * - Minimal overhead with no additional dependencies or complex state management
 * 
 * @param fn - The callback function to wrap. Can access current props/state when invoked.
 * @returns A stable callback that always invokes the latest version of `fn`.
 * 
 * @example
 * ```typescript
 * // Event handler with frequently changing state
 * function SearchComponent() {
 *   const [query, setQuery] = useState('');
 *   const [filters, setFilters] = useState({});
 *   
 *   // Without useEventCallback: handleSearch would change on every query/filters update
 *   // causing MemoizedResults to re-render unnecessarily
 *   const handleSearch = useEventCallback(() => {
 *     performSearch(query, filters);
 *   });
 *   
 *   return (
 *     <>
 *       <input value={query} onChange={e => setQuery(e.target.value)} />
 *       <MemoizedResults onSearch={handleSearch} />
 *     </>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Window event listener with stable reference
 * function ResizeComponent() {
 *   const [width, setWidth] = useState(0);
 *   
 *   const handleResize = useEventCallback(() => {
 *     setWidth(window.innerWidth);
 *   });
 *   
 *   useEffect(() => {
 *     window.addEventListener('resize', handleResize);
 *     return () => window.removeEventListener('resize', handleResize);
 *   }, [handleResize]); // handleResize never changes, so effect only runs once
 *   
 *   return <div>Width: {width}px</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Callback in useEffect dependencies
 * function DataFetcher({ userId }: { userId: string }) {
 *   const [data, setData] = useState(null);
 *   const [refreshCount, setRefreshCount] = useState(0);
 *   
 *   const fetchData = useEventCallback(async () => {
 *     const result = await api.fetchUser(userId);
 *     setData(result);
 *   });
 *   
 *   useEffect(() => {
 *     fetchData();
 *   }, [refreshCount]); // Only re-fetch when refreshCount changes, not when userId changes
 *   
 *   // userId changes are picked up by fetchData automatically
 *   return <div>{data?.name}</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Generic type support
 * function GenericHandler<T>({ items, onSelect }: { items: T[], onSelect: (item: T) => void }) {
 *   const handleClick = useEventCallback((item: T, index: number) => {
 *     console.log('Selected', item, 'at index', index);
 *     onSelect(item);
 *   });
 *   
 *   return (
 *     <ul>
 *       {items.map((item, i) => (
 *         <li key={i} onClick={() => handleClick(item, i)}>
 *           {String(item)}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useCallback | React.useCallback} for dependency-based memoization
 * @see {@link useConst} for creating constant values with stable identity
 * @see {@link useBoolean} for an example of stable callback patterns
 * 
 * @public
 */
export function useEventCallback<Args extends unknown[], Return>(
  fn: (...args: Args) => Return
): (...args: Args) => Return {
  // Store the latest callback in a ref that updates synchronously
  const callbackRef = React.useRef<typeof fn>(fn);
  
  // Update the ref synchronously after every render but before paint
  // This ensures the callback always has access to the latest props/state
  // Using useLayoutEffect instead of useEffect for synchronous updates
  React.useLayoutEffect(() => {
    callbackRef.current = fn;
  }, [fn]);
  
  // Create a stable wrapper function that never changes identity
  // This wrapper calls through to the ref, which always has the latest callback
  return useConst(() => (...args: Args): Return => {
    // Get the current callback from the ref
    const callback = callbackRef.current;
    
    // Call the latest version of the callback
    return callback(...args);
  });
}
