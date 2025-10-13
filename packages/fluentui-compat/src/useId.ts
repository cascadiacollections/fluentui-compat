import * as React from 'react';

/**
 * Global counter for generating unique IDs.
 * This is shared across all instances to ensure uniqueness even with multiple library copies.
 * @internal
 */
let globalIdCounter = 0;

/**
 * Hook to generate a stable unique ID for the component instance.
 * 
 * This hook provides a consistent way to generate IDs for accessibility attributes
 * and form elements. The generated ID is:
 * - **Stable**: Never changes across renders for the same component instance
 * - **Unique**: Guaranteed unique across all components using this hook
 * - **Predictable**: Uses an optional prefix for easier debugging
 * - **SSR-compatible**: Works correctly with server-side rendering
 * 
 * **Use cases**:
 * - Linking form labels to inputs via `htmlFor` and `id`
 * - ARIA attributes like `aria-labelledby`, `aria-describedby`
 * - Creating unique identifiers for DOM elements
 * - Managing focus and accessibility relationships
 * 
 * **React 18+ Alternative**: For React 18+, consider using the built-in `useId()` hook.
 * This implementation is provided for React 16 and 17 compatibility.
 * 
 * @param prefix - Optional prefix for the generated ID (default: 'id')
 * @returns A stable unique ID string
 * 
 * @example
 * ```typescript
 * // Basic usage with form fields
 * function TextField() {
 *   const inputId = useId('text-field');
 *   
 *   return (
 *     <div>
 *       <label htmlFor={inputId}>Name:</label>
 *       <input id={inputId} type="text" />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // ARIA relationships
 * function Tooltip() {
 *   const tooltipId = useId('tooltip');
 *   const triggerId = useId('trigger');
 *   
 *   return (
 *     <>
 *       <button 
 *         id={triggerId}
 *         aria-describedby={tooltipId}
 *       >
 *         Hover me
 *       </button>
 *       <div id={tooltipId} role="tooltip">
 *         Helpful information
 *       </div>
 *     </>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Multiple IDs in one component
 * function FormField() {
 *   const labelId = useId('label');
 *   const inputId = useId('input');
 *   const errorId = useId('error');
 *   
 *   const hasError = true;
 *   
 *   return (
 *     <div>
 *       <label id={labelId} htmlFor={inputId}>
 *         Email
 *       </label>
 *       <input 
 *         id={inputId}
 *         aria-labelledby={labelId}
 *         aria-describedby={hasError ? errorId : undefined}
 *         aria-invalid={hasError}
 *       />
 *       {hasError && (
 *         <span id={errorId} role="alert">
 *           Invalid email address
 *         </span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useId | React.useId} for the React 18+ built-in version
 * @see {@link https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html | WCAG: Labels or Instructions}
 * @see {@link useConst} for creating other constant values
 * 
 * @public
 */
export function useId(prefix: string = 'id'): string {
  // Use React's built-in useId if available (React 18+)
  // This provides better SSR hydration and avoids counter mismatches
  const hasNativeUseId = 'useId' in React && typeof (React as any).useId === 'function';
  const nativeId = hasNativeUseId ? (React as any).useId() : null;
  
  // Fallback implementation for React 16 and 17
  // Use useRef to store the ID - it's only initialized once
  const idRef = React.useRef<string | null>(null);
  
  if (hasNativeUseId && nativeId) {
    // React's useId returns a string like ':r1:' so we add our prefix
    return `${prefix}${nativeId}`;
  }
  
  if (idRef.current === null) {
    // Generate a new unique ID on first render
    globalIdCounter++;
    idRef.current = `${prefix}__${globalIdCounter}`;
  }
  
  return idRef.current;
}

/**
 * Reset the global ID counter. Useful for testing.
 * 
 * ⚠️ **Warning**: This should only be used in tests. Calling this in production
 * code can lead to duplicate IDs and accessibility issues.
 * 
 * @param counter - The value to reset the counter to (default: 0)
 * 
 * @example
 * ```typescript
 * // In a test file
 * beforeEach(() => {
 *   resetIdCounter();
 * });
 * ```
 * 
 * @public
 */
export function resetIdCounter(counter: number = 0): void {
  globalIdCounter = counter;
}
