import * as React from 'react';
import { useEventCallback } from './useEventCallback';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

/**
 * Hook to attach event listeners to window or document with automatic cleanup.
 * 
 * This hook provides a declarative way to manage event listeners that:
 * - **Automatically cleans up**: Removes listeners on unmount or when dependencies change
 * - **Type safe**: Full TypeScript support for event types
 * - **Performance optimized**: Uses stable callbacks to prevent re-registration
 * - **SSR safe**: Handles server-side rendering gracefully
 * - **Flexible target**: Supports window, document, or any event target
 * 
 * **Common use cases**:
 * - Window resize, scroll events
 * - Document click/keydown for global interactions
 * - Custom events on event targets
 * - Keyboard shortcuts
 * - Outside click detection
 * 
 * @param target - The event target (window, document, or EventTarget), or null to skip
 * @param eventName - The name of the event to listen for
 * @param handler - The event handler callback
 * @param options - Optional event listener options (capture, passive, once)
 * 
 * @example
 * ```typescript
 * // Window resize listener
 * function ResponsiveComponent() {
 *   const [width, setWidth] = useState(window.innerWidth);
 *   
 *   useOnEvent(window, 'resize', () => {
 *     setWidth(window.innerWidth);
 *   });
 *   
 *   return <div>Window width: {width}px</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Keyboard shortcuts
 * function KeyboardShortcuts() {
 *   const [lastKey, setLastKey] = useState('');
 *   
 *   useOnEvent(document, 'keydown', (event: KeyboardEvent) => {
 *     if (event.ctrlKey && event.key === 's') {
 *       event.preventDefault();
 *       console.log('Save shortcut triggered');
 *     }
 *     setLastKey(event.key);
 *   });
 *   
 *   return <div>Last key pressed: {lastKey}</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Outside click detection
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const dropdownRef = useRef<HTMLDivElement>(null);
 *   
 *   useOnEvent(document, 'mousedown', (event: MouseEvent) => {
 *     if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 *       setIsOpen(false);
 *     }
 *   });
 *   
 *   return (
 *     <div ref={dropdownRef}>
 *       <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *       {isOpen && <div>Dropdown content</div>}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // With event options (passive for scroll performance)
 * function ScrollTracker() {
 *   const [scrollY, setScrollY] = useState(0);
 *   
 *   useOnEvent(
 *     window, 
 *     'scroll', 
 *     () => {
 *       setScrollY(window.scrollY);
 *     },
 *     { passive: true } // Improves scroll performance
 *   );
 *   
 *   return <div>Scroll position: {scrollY}px</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Conditional event listening
 * function ConditionalListener({ shouldListen }: { shouldListen: boolean }) {
 *   const [clicks, setClicks] = useState(0);
 *   
 *   // Pass null to skip event listener registration
 *   useOnEvent(
 *     shouldListen ? document : null,
 *     'click',
 *     () => setClicks(c => c + 1)
 *   );
 *   
 *   return <div>Document clicks: {clicks}</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Custom events
 * function CustomEventListener() {
 *   const [data, setData] = useState<any>(null);
 *   
 *   useOnEvent(window, 'my-custom-event', (event: Event) => {
 *     setData((event as CustomEvent).detail);
 *   });
 *   
 *   return <div>Custom event data: {JSON.stringify(data)}</div>;
 * }
 * ```
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener | addEventListener on MDN}
 * @see {@link useEventCallback} for the stable callback implementation
 * @see {@link useIsomorphicLayoutEffect} for SSR-safe effects
 * 
 * @public
 */
export function useOnEvent<K extends keyof WindowEventMap>(
  target: Window | null | undefined,
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void;

export function useOnEvent<K extends keyof DocumentEventMap>(
  target: Document | null | undefined,
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void;

export function useOnEvent<K extends keyof HTMLElementEventMap>(
  target: HTMLElement | null | undefined,
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void;

export function useOnEvent(
  target: EventTarget | null | undefined,
  eventName: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
): void;

export function useOnEvent(
  target: EventTarget | null | undefined,
  eventName: string,
  handler: (event: any) => void,
  options?: boolean | AddEventListenerOptions
): void {
  // Create a stable event handler that always calls the latest version
  const stableHandler = useEventCallback(handler);
  
  // Use layout effect for synchronous attachment
  useIsomorphicLayoutEffect(() => {
    // Skip if no target or in SSR
    if (!target || typeof window === 'undefined') {
      return undefined;
    }
    
    // Add the event listener
    target.addEventListener(eventName, stableHandler, options);
    
    // Cleanup function - remove listener on unmount or dependency change
    return () => {
      target.removeEventListener(eventName, stableHandler, options);
    };
  }, [target, eventName, stableHandler, options]);
}
