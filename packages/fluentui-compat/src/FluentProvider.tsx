import * as React from 'react';
import { 
  useFluent_unstable as useFluent,
  ThemeContext_unstable as ThemeContext 
} from '@fluentui/react-shared-contexts';
import { 
  FluentProvider as OriginalFluentProvider
} from '@fluentui/react-components';
import type { FluentProviderProps } from '@fluentui/react-components';

// Helper to compare theme objects
function areThemesEqual(theme1: any, theme2: any): boolean {
  // Quick reference check
  if (theme1 === theme2) return true;
  if (!theme1 || !theme2) return false;
  
  // For now, if they're different objects, assume they're different themes
  // This is a conservative approach that avoids false positives
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
  const { forceRender = false, ...restProps } = props;
  const parentContext = useFluent();
  const parentTheme = React.useContext(ThemeContext);
  
  // Check if this provider would be redundant
  const wouldBeRedundant = React.useMemo(() => {
    if (forceRender) return false;
    if (!props.theme) return true;
    
    // If we don't have a parent theme, this provider is not redundant
    if (!parentTheme) return false;
    
    // If themes are the same, this provider adds no value
    if (areThemesEqual(parentTheme, props.theme)) {
      // Also check other props for redundancy
      const {
        dir = parentContext.dir,
        targetDocument = parentContext.targetDocument,
        overrides_unstable = {},
        customStyleHooks_unstable
      } = props;
      
      return (
        dir === parentContext.dir &&
        targetDocument === parentContext.targetDocument &&
        Object.keys(overrides_unstable).length === 0 &&
        !customStyleHooks_unstable
      );
    }
    
    return false;
  }, [props, parentContext, parentTheme, forceRender]);
  
  // In development, warn about redundant providers
  if (process.env.NODE_ENV !== 'production' && wouldBeRedundant && !forceRender) {
    console.warn(
      'SmartFluentProvider: This provider appears redundant. ' +
      'It provides the same theme and context as its parent. ' +
      'Consider removing it to improve performance.'
    );
  }
  
  // If redundant, just render children without wrapping
  if (wouldBeRedundant && process.env.NODE_ENV === 'production') {
    return <div ref={ref}>{props.children}</div>;
  }
  
  // Continue with normal provider logic using the original FluentProvider
  return <OriginalFluentProvider ref={ref} {...restProps} />;
});

SmartFluentProvider.displayName = 'SmartFluentProvider';

// Also export the original FluentProvider for cases where the smart behavior isn't wanted
export { OriginalFluentProvider as FluentProvider };