import * as React from 'react';

/**
 * Development-time tracking for useForceUpdate usage patterns
 * @internal
 */
interface ForceUpdateMetrics {
  callCount: number;
  lastCallTime: number;
  componentMountTime: number;
  rapidCallsCount: number;
}

/**
 * Hook to force update a function component by triggering a re-render.
 * 
 * **⚠️ Performance Warning**: This hook will intentionally cause re-renders and should be used 
 * sparingly with clear intent. Overuse may introduce performance issues and long-running tasks.
 * Consider using React's built-in state management patterns (useState, useReducer) or 
 * memoization strategies (useMemo, useCallback) before resorting to force updates.
 * 
 * **🔧 Development Tools**: In development builds, this hook provides enhanced debugging features:
 * - **Performance monitoring**: Tracks call frequency and warns about excessive usage
 * - **Rapid call detection**: Alerts when multiple calls occur within a single frame (16ms)
 * - **DevTools integration**: Displays call count in React DevTools for debugging
 * - **Profiler marks**: Creates performance markers for React Profiler analysis
 * - **Cleanup warnings**: Detects components with short lifetimes but many force updates
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
 * @example
 * ```typescript
 * // 🔧 Development debugging with React DevTools
 * function DebuggingExample() {
 *   const forceUpdate = useForceUpdate();
 *   
 *   // In development, you'll see:
 *   // - Console warnings for excessive usage
 *   // - Call count in React DevTools
 *   // - Performance marks in browser profiler
 *   
 *   return <button onClick={forceUpdate}>Debug Render</button>;
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useReducer | React.useReducer} for the underlying mechanism
 * @see {@link https://react.dev/learn/you-might-not-need-an-effect | You Might Not Need an Effect} for alternatives
 * @see {@link https://react.dev/reference/react/useDebugValue | React.useDebugValue} for DevTools integration
 * 
 * @public
 */
export function useForceUpdate(): () => void {
  const [, dispatch] = React.useReducer((x: number) => x + 1, 0);
  
  // Development-time metrics tracking
  const metricsRef = React.useRef<ForceUpdateMetrics | null>(null);
  
  // Initialize metrics on first render in development
  if (process.env.NODE_ENV === 'development' && !metricsRef.current) {
    metricsRef.current = {
      callCount: 0,
      lastCallTime: 0,
      componentMountTime: Date.now(),
      rapidCallsCount: 0,
    };
  }
  
  // Create stable force update function with development monitoring
  const forceUpdate = React.useCallback(() => {
    if (process.env.NODE_ENV === 'development' && metricsRef.current) {
      const now = Date.now();
      const metrics = metricsRef.current;
      
      metrics.callCount++;
      
      // Detect rapid successive calls (within 16ms - one frame)
      if (now - metrics.lastCallTime < 16) {
        metrics.rapidCallsCount++;
        
        // Warn about potential performance issues from rapid calls
        if (metrics.rapidCallsCount > 5) {
          console.warn(
            'useForceUpdate: Detected excessive rapid calls (%d within short timeframe). ' +
            'This may indicate a performance anti-pattern causing long-running tasks. ' +
            'Consider debouncing updates or using proper state management instead.',
            metrics.rapidCallsCount
          );
          metrics.rapidCallsCount = 0; // Reset to avoid spam
        }
      } else {
        metrics.rapidCallsCount = 0; // Reset rapid call counter
      }
      
      // Warn about high usage frequency
      const timeSinceMount = now - metrics.componentMountTime;
      if (metrics.callCount > 10 && timeSinceMount > 1000) {
        const callRate = metrics.callCount / (timeSinceMount / 1000);
        if (callRate > 2) { // More than 2 calls per second on average
          console.warn(
            'useForceUpdate: High usage frequency detected (%.1f calls/second). ' +
            'Frequent force updates can cause performance degradation and should be used sparingly. ' +
            'Consider using useState, useReducer, or proper data flow patterns instead.',
            callRate
          );
        }
      }
      
      metrics.lastCallTime = now;
      
      // Add React DevTools profiler mark for performance analysis
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('useForceUpdate:call');
      }
    }
    
    dispatch();
  }, [dispatch]);
  
  // Development-time cleanup warning
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      return () => {
        if (metricsRef.current) {
          const { callCount, componentMountTime } = metricsRef.current;
          const lifetime = Date.now() - componentMountTime;
          
          // Warn about components with very short lifetimes but many force updates
          if (lifetime < 100 && callCount > 3) {
            console.warn(
              'useForceUpdate: Component unmounted quickly after %d force updates. ' +
              'This pattern may indicate unnecessary re-renders affecting performance.',
              callCount
            );
          }
        }
      };
    }
    return undefined;
  }, []);
  
  // React DevTools integration for debugging
  React.useDebugValue(
    process.env.NODE_ENV === 'development' && metricsRef.current
      ? `ForceUpdate(calls: ${metricsRef.current.callCount})`
      : null
  );
  
  return forceUpdate;
}