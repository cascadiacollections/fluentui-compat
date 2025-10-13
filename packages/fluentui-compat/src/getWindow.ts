/**
 * Gets the window object associated with a DOM element.
 * Returns undefined if the element is not in a browser environment.
 * 
 * This is a minimal implementation for use with the Async class,
 * providing cross-environment compatibility.
 * 
 * @param element - Optional element to get the window from
 * @returns The window object or undefined if not in a browser environment
 * 
 * @public
 */
export function getWindow(element?: Element | null): Window | undefined {
  // If we have an element, try to get its owner document's default view
  if (element?.ownerDocument?.defaultView) {
    return element.ownerDocument.defaultView;
  }
  
  // Fall back to global window if available
  if (typeof window !== 'undefined') {
    return window;
  }
  
  // Return undefined if not in a browser environment
  return undefined;
}
