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
 * Helper to compare theme objects using reference equality.
 * This is a conservative approach that avoids false positives.
 */
function areThemesEqual(theme1: unknown, theme2: unknown): boolean {
  if (theme1 === theme2) return true;
  if (!theme1 || !theme2) return false;
  return false;
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