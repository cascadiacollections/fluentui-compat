import * as React from 'react';

/**
 * Detect if we can use DOM APIs (client-side).
 * This check is performed once at module load time for efficiency.
 * @internal
 */
const canUseDOM = (): boolean => {
  return !!(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
  );
};

/**
 * Hook that uses `useLayoutEffect` on the client and `useEffect` on the server.
 * 
 * React throws a warning when using `useLayoutEffect` during server-side rendering
 * because layout effects don't run on the server. This hook provides a drop-in
 * replacement that:
 * - Uses `useLayoutEffect` in the browser for synchronous DOM updates
 * - Uses `useEffect` on the server to avoid SSR warnings
 * - Maintains the same API as `useLayoutEffect`
 * 
 * **When to use**:
 * - Measuring DOM elements and updating state before paint
 * - Synchronizing with external systems before browser paint
 * - Reading layout information and causing a synchronous re-render
 * - Any case where you need `useLayoutEffect` but also support SSR
 * 
 * **When NOT to use**:
 * - Most effects should use regular `useEffect` instead
 * - Only use this when timing relative to browser paint matters
 * - If you don't need SSR support, use `useLayoutEffect` directly
 * 
 * @example
 * ```typescript
 * // Measure element size after render but before paint
 * function TooltipWithDynamicPosition() {
 *   const [position, setPosition] = useState({ top: 0, left: 0 });
 *   const tooltipRef = useRef<HTMLDivElement>(null);
 *   
 *   useIsomorphicLayoutEffect(() => {
 *     if (tooltipRef.current) {
 *       const rect = tooltipRef.current.getBoundingClientRect();
 *       setPosition({
 *         top: rect.height,
 *         left: rect.width / 2
 *       });
 *     }
 *   }, []);
 *   
 *   return (
 *     <div ref={tooltipRef} style={{ top: position.top, left: position.left }}>
 *       Tooltip
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Sync with external library before paint
 * function ChartComponent({ data }: { data: ChartData }) {
 *   const chartRef = useRef<HTMLCanvasElement>(null);
 *   const chartInstanceRef = useRef<Chart | null>(null);
 *   
 *   useIsomorphicLayoutEffect(() => {
 *     if (chartRef.current) {
 *       // Initialize chart synchronously before paint
 *       chartInstanceRef.current = new Chart(chartRef.current, {
 *         type: 'bar',
 *         data: data
 *       });
 *     }
 *     
 *     return () => {
 *       chartInstanceRef.current?.destroy();
 *     };
 *   }, [data]);
 *   
 *   return <canvas ref={chartRef} />;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Update ref synchronously for event handlers
 * function ScrollComponent() {
 *   const [scrollTop, setScrollTop] = useState(0);
 *   const scrollRef = useRef(0);
 *   
 *   useIsomorphicLayoutEffect(() => {
 *     // Update ref synchronously so event handlers have current value
 *     scrollRef.current = scrollTop;
 *   }, [scrollTop]);
 *   
 *   const handleScroll = useCallback(() => {
 *     // scrollRef.current is guaranteed to be up-to-date
 *     console.log('Current scroll:', scrollRef.current);
 *   }, []);
 *   
 *   return <div onScroll={handleScroll}>Content</div>;
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useLayoutEffect | React.useLayoutEffect} for the client-side version
 * @see {@link https://react.dev/reference/react/useEffect | React.useEffect} for the server-side version
 * @see {@link https://github.com/reduxjs/react-redux/blob/master/src/utils/useIsomorphicLayoutEffect.js | React Redux implementation}
 * @see {@link https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85 | Dan Abramov's explanation}
 * 
 * @public
 */
export const useIsomorphicLayoutEffect: typeof React.useEffect = 
  canUseDOM() ? React.useLayoutEffect : React.useEffect;
