import * as React from "react";

/**
 * Modified `useCallback` that returns the same function reference every time, but internally calls
 * the most-recently passed callback implementation. Useful for event handlers or callbacks that
 * need access to the latest props/state but must remain referentially stable.
 *
 * In general, prefer `useCallback` unless you've encountered one of the problems above.
 *
 * https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
 *
 * @example
 * ```tsx
 * function MyComponent({ onClick, data }) {
 *   // Handler that needs access to latest data but should remain stable
 *   const handleClick = useEventCallback((event: MouseEvent) => {
 *     onClick(event, data); // Always uses latest data value
 *   });
 *
 *   // Safe to pass to child components or effects without causing re-renders
 *   return <ChildComponent onClick={handleClick} />;
 * }
 * ```
 *
 * @param fn - The callback function that will be used
 * @returns A function which is referentially stable but internally calls the most recently passed callback
 */
export function useEventCallback<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  // Store the latest callback without causing re-renders
  const callbackRef = React.useRef(fn);

  // Update ref during render phase - this is safe and avoids effect overhead
  callbackRef.current = fn;

  // Create stable wrapper function exactly once using useMemo
  // Empty deps array ensures this function identity never changes
  return React.useMemo(
    () =>
      // Arrow function wrapper that calls the current callback
      (...args: TArgs): TReturn => {
        // Development-time safety check: warn if callbackRef is unexpectedly unset
        if (
          typeof process !== "undefined" &&
          process.env &&
          process.env.NODE_ENV !== "production" &&
          !callbackRef.current
        ) {
          throw new Error(
            [
              "useEventCallback: Internal error - callbackRef.current is undefined or null.",
              "This usually indicates a bug in the hook usage or React lifecycle.",
              "If you see this error, please file an issue with a minimal repro.",
              "Callback arguments:",
              JSON.stringify(args),
            ].join(" ")
          );
        }
        return callbackRef.current(...args);
      },
    // Intentionally empty - we want this function to be created only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}
