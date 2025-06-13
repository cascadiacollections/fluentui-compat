import * as React from 'react';

export type UseSetTimeoutReturnType = {
  setTimeout: (callback: () => void, duration: number) => number;
  clearTimeout: (id: number) => void;
};

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
  const timeoutIds = React.useRef<Set<number>>(new Set());
  
  // Cleanup function
  React.useEffect(() => {
    const currentTimeoutIds = timeoutIds.current;
    return () => {
      // Clear all active timeouts on unmount
      currentTimeoutIds.forEach(id => {
        window.clearTimeout(id);
      });
      currentTimeoutIds.clear();
    };
  }, []);

  // Memoize the return object to prevent recreation on every render
  return React.useMemo(() => ({
    setTimeout: (callback: () => void, duration: number): number => {
      const id = window.setTimeout(() => {
        // Auto-cleanup: remove from tracking when timeout executes
        timeoutIds.current.delete(id);
        callback();
      }, duration) as unknown as number;
      
      timeoutIds.current.add(id);
      return id;
    },
    
    clearTimeout: (id: number): void => {
      if (timeoutIds.current.has(id)) {
        timeoutIds.current.delete(id);
        window.clearTimeout(id);
      }
    },
  }), []);
};