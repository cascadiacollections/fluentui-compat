import { Async } from '@fluentui/utilities';
import * as React from 'react';

/**
 * Hook to provide an Async instance that is automatically cleaned up on dismount.
 * 
 * @returns \{Async\} A stable Async instance that will be disposed on component unmount
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const async = useAsync();
 *   
 *   const handleClick = () => {
 *     async.setTimeout(() => {
 *       console.log('Delayed action');
 *     }, 1000);
 *   };
 *   
 *   return <button onClick={handleClick}>Start Timer</button>;
 * }
 * ```
 */
export function useAsync(): Async {
  // Use useMemo for explicit single creation and stable reference
  const asyncInstance = React.useMemo(() => new Async(), []);
  
  React.useEffect(() => {
    // Cleanup function
    return () => {
      asyncInstance.dispose();
    };
  }, [asyncInstance]);
  
  // Add development-time warnings for common mistakes - hook called unconditionally
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = Date.now();
      return () => {
        const duration = Date.now() - startTime;
        if (duration < 16) { // Less than one frame
          console.warn('useAsync: Component unmounted very quickly. Ensure async operations are properly handled.');
        }
      };
    }
    return undefined;
  }, []);
  
  // Add React DevTools integration - hook called unconditionally
  React.useDebugValue(
    process.env.NODE_ENV === 'development' 
      ? asyncInstance 
      : null, 
    (async) => async ? `Async(${async ? 'active' : 'disposed'})` : ''
  );
  
  return asyncInstance;
}