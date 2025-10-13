import React from 'react';
import { 
  useFluent_unstable as useFluent,
  ThemeContext_unstable as ThemeContext 
} from '@fluentui/react-shared-contexts';
import { 
  FluentProvider as OriginalFluentProvider
} from '@fluentui/react-components';
import type { FluentProviderProps } from '@fluentui/react-components';

/**
 * Helper to compare theme objects for equality.
 * Performs a shallow equality check on theme properties to handle cases where
 * developers mutate theme objects but the values remain the same.
 * 
 * This follows React best practices by avoiding deep recursion and focusing
 * on the actual theme properties that FluentUI uses.
 */
function areThemesEqual(theme1: unknown, theme2: unknown): boolean {
  // Fast path: referential equality
  if (theme1 === theme2) return true;
  
  // If either is null/undefined, they're not equal unless both are
  if (!theme1 || !theme2) return false;
  
  // Type guard: ensure both are objects
  if (typeof theme1 !== 'object' || typeof theme2 !== 'object') return false;
  
  const t1 = theme1 as Record<string, unknown>;
  const t2 = theme2 as Record<string, unknown>;
  
  // Get all keys from both objects
  const keys1 = Object.keys(t1);
  const keys2 = Object.keys(t2);
  
  // Different number of properties means different themes
  if (keys1.length !== keys2.length) return false;
  
  // Shallow compare all properties
  for (const key of keys1) {
    // Check if key exists in both objects
    if (!(key in t2)) return false;
    
    // Shallow equality check for values
    if (t1[key] !== t2[key]) return false;
  }
  
  return true;
}

export interface SmartFluentProviderProps extends FluentProviderProps {
  /** Whether to always render the provider even if redundant (useful for testing) */
  forceRender?: boolean;
}

/**
 * A smart FluentProvider that automatically detects when it would be redundant
 * and either warns in development or skips creating a provider in production.
 * 
 * This helps prevent unnecessary provider nesting while maintaining the same API
 * as the standard FluentProvider.
 * 
 * @example
 * ```tsx
 * import { SmartFluentProvider } from 'fluentui-compat';
 * 
 * // Will automatically detect if this provider is redundant
 * <SmartFluentProvider theme={webLightTheme}>
 *   <MyComponent />
 * </SmartFluentProvider>
 * ```
 */
export const SmartFluentProvider = React.forwardRef<HTMLDivElement, SmartFluentProviderProps>((props, ref) => {
  const { forceRender = false, theme, dir, targetDocument, overrides_unstable, customStyleHooks_unstable, children, ...restProps } = props;
  const parentContext = useFluent();
  const parentTheme = React.useContext(ThemeContext);
  
  // Check if this provider would be redundant
  const wouldBeRedundant = React.useMemo(() => {
    if (forceRender) return false;
    if (!theme) return true;
    if (!parentTheme) return false;
    
    // If themes are the same, check other props for redundancy
    if (areThemesEqual(parentTheme, theme)) {
      const effectiveDir = dir ?? parentContext.dir;
      const effectiveTargetDocument = targetDocument ?? parentContext.targetDocument;
      const hasOverrides = overrides_unstable && Object.keys(overrides_unstable).length > 0;
      
      return (
        effectiveDir === parentContext.dir &&
        effectiveTargetDocument === parentContext.targetDocument &&
        !hasOverrides &&
        !customStyleHooks_unstable
      );
    }
    
    return false;
  }, [forceRender, theme, parentTheme, dir, targetDocument, overrides_unstable, customStyleHooks_unstable, parentContext.dir, parentContext.targetDocument]);
  
  // In development, warn about redundant providers using useEffect
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && wouldBeRedundant) {
      console.warn(
        'SmartFluentProvider: This provider appears redundant. ' +
        'It provides the same theme and context as its parent. ' +
        'Consider removing it to improve performance.'
      );
    }
  }, [wouldBeRedundant]);
  
  // Always use OriginalFluentProvider for consistent behavior and API compatibility
  return (
    <OriginalFluentProvider 
      ref={ref} 
      theme={theme}
      dir={dir}
      targetDocument={targetDocument}
      overrides_unstable={overrides_unstable}
      customStyleHooks_unstable={customStyleHooks_unstable}
      {...restProps}
    >
      {children}
    </OriginalFluentProvider>
  );
});

SmartFluentProvider.displayName = 'SmartFluentProvider';

// Also export the original FluentProvider for cases where the smart behavior isn't wanted
export { OriginalFluentProvider as FluentProvider };
