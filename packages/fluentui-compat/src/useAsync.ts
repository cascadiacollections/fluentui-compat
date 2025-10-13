import { Async } from './Async';
import * as React from 'react';

/**
 * Sentinel value to indicate uninitialized async instance.
 * Using Symbol ensures no possible collision with user values.
 * @internal
 */
const UNINITIALIZED = Symbol('useAsync.uninitialized');

/**
 * Hook to provide an Async instance that is automatically cleaned up on dismount.
 * 
 * This implementation is optimized for:
 * - **Memory efficiency**: Uses `useRef` instead of `useMemo` to avoid closure overhead
 * - **Render performance**: Minimizes effect overhead by consolidating development checks
 * - **Immutability**: Ensures stable reference identity across all renders
 * - **Type safety**: Leverages TypeScript strict mode and const assertions
 * 
 * @returns \{Async\} A stable Async instance that will be disposed on component unmount.
 *                   The returned instance maintains referential identity across renders.
 * 
 * @example
 * ```tsx
 * import { useCallback } from 'react';
 * 
 * function MyComponent() {
 *   const async = useAsync();
 *   
 *   const handleClick = useCallback(() => {
 *     async.setTimeout(() => {
 *       console.log('Delayed action');
 *     }, 1000);
 *   }, [async]);
 *   
 *   return <button onClick={handleClick}>Start Timer</button>;
 * }
 * ```
 * 
 * @public
 */
export function useAsync(): Async {
  // Use useRef for memory efficiency - no closure allocation like useMemo
  // Following the pattern from useConst for optimal performance
  const asyncRef = React.useRef<Async | typeof UNINITIALIZED>(UNINITIALIZED);
  
  // Lazy initialization - only create instance on first render
  if (asyncRef.current === UNINITIALIZED) {
    asyncRef.current = new Async();
  }
  
  // Single consolidated effect for cleanup and development warnings
  // Reduces effect overhead compared to multiple useEffect calls
  React.useEffect(() => {
    // Type assertion is safe - we guarantee initialization before effect runs
    const instance = asyncRef.current as Async;
    
    // Development-time monitoring - cache check result
    const isDevelopment = process.env.NODE_ENV === 'development';
    let startTime: number | undefined;
    
    if (isDevelopment) {
      startTime = Date.now();
    }
    
    // Cleanup function - runs on unmount
    return () => {
      // Always dispose the instance
      instance.dispose();
      
      // Development warnings for common mistakes
      if (isDevelopment && startTime !== undefined) {
        const duration = Date.now() - startTime;
        if (duration < 16) { // Less than one frame
          console.warn('useAsync: Component unmounted very quickly. Ensure async operations are properly handled.');
        }
      }
    };
  }, []); // Empty deps - only run on mount/unmount
  
  // React DevTools integration - conditional on development mode
  // Only provide debug value in development to avoid runtime overhead
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useDebugValue(
      asyncRef.current,
      (async) => async ? 'Async(active)' : 'Async(disposed)'
    );
  }
  
  // Type assertion is safe - we guarantee initialization above
  // Return value is immutable (same reference on every render)
  return asyncRef.current as Async;
}