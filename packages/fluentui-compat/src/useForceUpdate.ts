import * as React from 'react';

/**
 * Hook to force update a function component by triggering a re-render.
 * 
 * **⚠️ Performance Warning**: This hook will intentionally cause re-renders and should be used 
 * sparingly with clear intent. Overuse may introduce performance issues and long-running tasks.
 * Consider using React's built-in state management patterns (useState, useReducer) or 
 * memoization strategies (useMemo, useCallback) before resorting to force updates.
 * 
 * This implementation uses `useReducer` for optimal performance:
 * - **Memory efficient**: No additional closures or function allocations
 * - **Stable reference**: The returned function identity never changes
 * - **Minimal overhead**: Uses React's optimized reducer dispatch mechanism
 * - **No dependencies**: Eliminates the need for additional custom hooks
 * 
 * @returns A function that when called will force the component to re-render.
 *          The returned function has a stable identity across renders.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const forceUpdate = useForceUpdate();
 *   
 *   const handleRefresh = useCallback(() => {
 *     // Only use when you have a legitimate need to force re-render
 *     // after external state changes that React can't detect
 *     forceUpdate();
 *   }, [forceUpdate]);
 *   
 *   return <button onClick={handleRefresh}>Refresh</button>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // ❌ Avoid overuse - this can cause performance problems
 * function BadExample() {
 *   const forceUpdate = useForceUpdate();
 *   
 *   useEffect(() => {
 *     // Don't force updates in effects without clear justification
 *     forceUpdate(); // This creates unnecessary render cycles
 *   });
 * }
 * 
 * // ✅ Better - use appropriate React patterns
 * function GoodExample() {
 *   const [data, setData] = useState(null);
 *   
 *   useEffect(() => {
 *     // Update state instead of forcing renders
 *     fetchData().then(setData);
 *   }, []);
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useReducer | React.useReducer} for the underlying mechanism
 * @see {@link https://react.dev/learn/you-might-not-need-an-effect | You Might Not Need an Effect} for alternatives
 * 
 * @public
 */
export function useForceUpdate(): () => void {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  return forceUpdate;
}