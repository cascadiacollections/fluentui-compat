/**
 * Utility function to merge CSS class names
 * @param classes - Array of class names to merge
 * @returns Merged class name string
 */
export function mergeClasses(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * CSS class name for filled icons
 */
export const iconFilledClassName = 'fui-Icon--filled';

/**
 * CSS class name for regular icons
 */
export const iconRegularClassName = 'fui-Icon--regular';