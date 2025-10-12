import * as React from 'react';

/**
 * Hook to merge multiple refs into a single ref callback.
 * 
 * When working with React refs, you often need to handle multiple refs on the same element:
 * - Your own ref for component logic
 * - A forwarded ref from a parent component  
 * - Refs from third-party libraries
 * 
 * This hook merges all refs into a single callback ref that updates all of them.
 * 
 * **Features**:
 * - **Flexible input**: Accepts any combination of callback refs, ref objects, and null/undefined
 * - **Type safe**: Full TypeScript support with proper type inference
 * - **Performance optimized**: Memoizes the callback to prevent unnecessary re-renders
 * - **Cleanup safe**: Properly cleans up all refs when the element unmounts
 * - **SSR compatible**: Works correctly with server-side rendering
 * 
 * @param refs - Array of refs to merge (callback refs, ref objects, or null/undefined)
 * @returns A single callback ref that updates all provided refs
 * 
 * @example
 * ```typescript
 * // Forward ref while keeping internal ref
 * const FancyInput = React.forwardRef<HTMLInputElement, Props>((props, forwardedRef) => {
 *   const internalRef = useRef<HTMLInputElement>(null);
 *   const mergedRef = useMergedRefs(internalRef, forwardedRef);
 *   
 *   useEffect(() => {
 *     // Can use internalRef for component logic
 *     if (internalRef.current) {
 *       internalRef.current.focus();
 *     }
 *   }, []);
 *   
 *   return <input ref={mergedRef} {...props} />;
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Combine multiple refs from different sources
 * function EditableDiv({ 
 *   contentRef, 
 *   containerRef, 
 *   externalRef 
 * }: {
 *   contentRef?: React.Ref<HTMLDivElement>;
 *   containerRef?: React.Ref<HTMLDivElement>;
 *   externalRef?: React.Ref<HTMLDivElement>;
 * }) {
 *   const internalRef = useRef<HTMLDivElement>(null);
 *   const mergedRef = useMergedRefs(
 *     internalRef, 
 *     contentRef, 
 *     containerRef, 
 *     externalRef
 *   );
 *   
 *   return <div ref={mergedRef} contentEditable />;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // With third-party libraries
 * function ResizablePanel({ onResize }: { onResize: (size: number) => void }) {
 *   const panelRef = useRef<HTMLDivElement>(null);
 *   const resizeObserverRef = useRef<ResizeObserver | null>(null);
 *   
 *   // Library might provide a ref
 *   const [thirdPartyRef, setThirdPartyRef] = useState<HTMLDivElement | null>(null);
 *   
 *   const mergedRef = useMergedRefs(panelRef, setThirdPartyRef);
 *   
 *   useEffect(() => {
 *     if (panelRef.current) {
 *       resizeObserverRef.current = new ResizeObserver(entries => {
 *         onResize(entries[0].contentRect.height);
 *       });
 *       resizeObserverRef.current.observe(panelRef.current);
 *     }
 *     
 *     return () => resizeObserverRef.current?.disconnect();
 *   }, [onResize]);
 *   
 *   return <div ref={mergedRef}>Resizable content</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Conditional refs
 * function ConditionalRefExample({ 
 *   shouldUseExternalRef,
 *   externalRef 
 * }: {
 *   shouldUseExternalRef: boolean;
 *   externalRef?: React.Ref<HTMLDivElement>;
 * }) {
 *   const internalRef = useRef<HTMLDivElement>(null);
 *   
 *   // Can pass undefined/null refs - they'll be ignored
 *   const mergedRef = useMergedRefs(
 *     internalRef,
 *     shouldUseExternalRef ? externalRef : null
 *   );
 *   
 *   return <div ref={mergedRef}>Content</div>;
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/forwardRef | React.forwardRef} for forwarding refs
 * @see {@link https://react.dev/reference/react/useRef | React.useRef} for creating refs
 * 
 * @public
 */
export function useMergedRefs<T = any>(
  ...refs: Array<React.Ref<T> | undefined | null>
): React.RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(
    (instance: T | null) => {
      // Update all provided refs with the new instance
      refs.forEach(ref => {
        if (ref === null || ref === undefined) {
          // Skip null/undefined refs
          return;
        }
        
        if (typeof ref === 'function') {
          // Callback ref - call it with the instance
          ref(instance);
        } else {
          // RefObject - update the current property
          // Cast to mutable ref to allow assignment
          (ref as React.MutableRefObject<T | null>).current = instance;
        }
      });
    },
    refs
  );
}
