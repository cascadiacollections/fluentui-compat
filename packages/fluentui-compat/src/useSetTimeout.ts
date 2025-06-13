import * as React from 'react';

/** The timeout ID type that works across different environments */
export type TimeoutId = ReturnType<typeof setTimeout>;

export type UseSetTimeoutReturnType = {
  setTimeout: (callback: () => void, duration: number) => TimeoutId;
  clearTimeout: (id: TimeoutId) => void;
};

// Development-time constants for performance monitoring
const DEV_MAX_ACTIVE_TIMEOUTS = 50;
const DEV_LONG_TIMEOUT_THRESHOLD = 60000; // 1 minute

/** Check if we're in development mode (evaluated at runtime) */
const isDevelopment = () => process.env.NODE_ENV !== 'production';

/**
 * Hook to provide performance optimized timeout management with automatic cleanup.
 * 
 * This hook provides a wrapper around `setTimeout` and `clearTimeout` that:
 * - Automatically cleans up all active timeouts when the component unmounts
 * - Uses Set for O(1) add/remove operations instead of Record for better performance
 * - Auto-removes timeouts from tracking when they execute naturally
 * - Returns a memoized object to prevent unnecessary re-renders
 * 
 * @returns An object containing setTimeout and clearTimeout functions with automatic cleanup
 * 
 * @example
 * ```tsx
 * import { useSetTimeout } from '@cascadiacollections/fluentui-compat';
 * import { useCallback } from 'react';
 * 
 * function MyComponent() {
 *   const { setTimeout, clearTimeout } = useSetTimeout();
 *   
 *   const handleClick = useCallback(() => {
 *     const timeoutId = setTimeout(() => {
 *       console.log('Delayed action executed');
 *     }, 1000);
 *     
 *     // Optionally clear the timeout early
 *     // clearTimeout(timeoutId);
 *   }, [setTimeout, clearTimeout]);
 *   
 *   return <button onClick={handleClick}>Start Timer</button>;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Multiple timeouts with cleanup
 * function TimerComponent() {
 *   const { setTimeout } = useSetTimeout();
 *   
 *   React.useEffect(() => {
 *     // Set multiple timeouts
 *     setTimeout(() => console.log('First'), 1000);
 *     setTimeout(() => console.log('Second'), 2000);
 *     setTimeout(() => console.log('Third'), 3000);
 *     
 *     // All timeouts will be automatically cleaned up on unmount
 *   }, [setTimeout]);
 *   
 *   return <div>Timer Component</div>;
 * }
 * ```
 * 
 * @public
 */
export const useSetTimeout = (): UseSetTimeoutReturnType => {
  // Use Set for O(1) operations instead of Record
  const timeoutIds = React.useRef<Set<TimeoutId>>(new Set());
  
  // Cleanup function
  React.useEffect(() => {
    const currentTimeoutIds = timeoutIds.current;
    return () => {
      // Clear all active timeouts on unmount
      currentTimeoutIds.forEach(id => {
        clearTimeout(id);
      });
      currentTimeoutIds.clear();
    };
  }, []);

  // Memoize the return object to prevent recreation on every render
  return React.useMemo(() => ({
    setTimeout: (callback: () => void, duration: number): TimeoutId => {
      // Development-time diagnostics
      if (isDevelopment()) {
        // Warn about very long timeouts that might indicate mistakes
        if (duration > DEV_LONG_TIMEOUT_THRESHOLD) {
          console.warn(
            `useSetTimeout: Setting a very long timeout (${duration}ms). ` +
            'Consider if this is intentional or if you meant a shorter duration.'
          );
        }
        
        // Warn about excessive number of active timeouts
        if (timeoutIds.current.size >= DEV_MAX_ACTIVE_TIMEOUTS) {
          console.warn(
            `useSetTimeout: Component has ${timeoutIds.current.size} active timeouts. ` +
            'This might indicate a memory leak or performance issue. ' +
            'Consider clearing unused timeouts or reviewing your timeout usage patterns.'
          );
        }
        
        // Warn about negative durations
        if (duration < 0) {
          console.warn(
            `useSetTimeout: Negative timeout duration (${duration}ms) will be treated as 0. ` +
            'This might not be the intended behavior.'
          );
        }
      }
      
      const id = setTimeout(() => {
        // Auto-cleanup: remove from tracking when timeout executes
        timeoutIds.current.delete(id);
        callback();
      }, duration);
      
      timeoutIds.current.add(id);
      return id;
    },
    
    clearTimeout: (id: TimeoutId): void => {
      if (timeoutIds.current.has(id)) {
        timeoutIds.current.delete(id);
        clearTimeout(id);
      }
    },
  }), []);
};