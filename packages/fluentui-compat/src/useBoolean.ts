import * as React from 'react';
import { useConst } from './useConst';

/** Updater callbacks returned by `useBoolean`. */
export interface IUseBooleanCallbacks {
  /** Set the value to true. Always has the same identity. */
  setTrue: () => void;
  /** Set the value to false. Always has the same identity. */
  setFalse: () => void;
  /** Toggle the value. Always has the same identity. */
  toggle: () => void;
}

/**
 * Hook to store a boolean value and generate callbacks for setting the value to true, false, or toggling it.
 * 
 * This hook is optimized for performance:
 * - The identity of the callbacks will always stay the same across renders
 * - Uses a single internal ref to store all callbacks, minimizing memory allocations  
 * - Avoids unnecessary function closures and object recreations
 * - Provides stable referential identity for the callbacks object
 *
 * @param initialState - Initial boolean value
 * @returns Array with the current value and an object containing the updater callbacks.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const [isVisible, { setTrue: show, setFalse: hide, toggle }] = useBoolean(false);
 *   
 *   return (
 *     <div>
 *       <p>Visibility: {isVisible ? 'visible' : 'hidden'}</p>
 *       <button onClick={show}>Show</button>
 *       <button onClick={hide}>Hide</button>
 *       <button onClick={toggle}>Toggle</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Callbacks can be safely used in dependency arrays
 * function MyComponent() {
 *   const [isEnabled, { setTrue: enable, setFalse: disable }] = useBoolean(false);
 *   
 *   const handleApiCall = useCallback(async () => {
 *     disable(); // Disable during API call
 *     try {
 *       await apiCall();
 *     } finally {
 *       enable(); // Re-enable after API call
 *     }
 *   }, [enable, disable]); // Safe to include in deps - identities never change
 *   
 *   return <button onClick={handleApiCall} disabled={!isEnabled}>Call API</button>;
 * }  
 * ```
 * 
 * @example
 * ```typescript
 * // Multiple boolean states with stable callbacks
 * function FeatureFlags() {
 *   const [darkMode, darkModeActions] = useBoolean(false);
 *   const [notifications, notificationActions] = useBoolean(true);
 *   const [autoSave, autoSaveActions] = useBoolean(true);
 *   
 *   // All callback objects maintain stable identity across renders
 *   return (
 *     <div>
 *       <label>
 *         <input type="checkbox" checked={darkMode} onChange={darkModeActions.toggle} />
 *         Dark Mode
 *       </label>
 *       <label>
 *         <input type="checkbox" checked={notifications} onChange={notificationActions.toggle} />
 *         Notifications
 *       </label>
 *       <label>
 *         <input type="checkbox" checked={autoSave} onChange={autoSaveActions.toggle} />
 *         Auto Save
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useState | React.useState} for basic state management
 * @see {@link useConst} for creating stable references
 * 
 * @public
 */
export function useBoolean(initialState: boolean): [boolean, IUseBooleanCallbacks] {
  const [value, setValue] = React.useState(initialState);

  // Create all callbacks in a single useConst call to minimize memory usage
  // and ensure stable identity for the entire callbacks object
  const callbacks = useConst<IUseBooleanCallbacks>(() => ({
    setTrue: () => setValue(true),
    setFalse: () => setValue(false),
    // Use functional update to avoid stale closure issues
    toggle: () => setValue(currentValue => !currentValue)
  }));

  return [value, callbacks];
}