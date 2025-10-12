import React from 'react';
import { 
  ThemeContext_unstable as ThemeContext
} from '@fluentui/react-shared-contexts';
import type { ThemeContextValue_unstable } from '@fluentui/react-shared-contexts';

export interface FluentThemeConsumerProps {
  /** Override specific theme tokens without creating a full provider */
  themeOverrides?: Partial<ThemeContextValue_unstable>;
  /** Class name to apply theme-specific styles */
  className?: string;
  /** Children to render with the theme context */
  children: React.ReactNode;
}

/**
 * Lightweight alternative to FluentProvider for simple theme overrides.
 * Use this instead of nesting FluentProvider when you only need theme changes.
 * 
 * This component provides a minimal way to override theme tokens without the
 * overhead of a full FluentProvider, making it ideal for performance-critical
 * scenarios where only theme changes are needed.
 * 
 * @example
 * ```tsx
 * import { FluentThemeConsumer } from 'fluentui-compat';
 * 
 * // Instead of: <FluentProvider theme={darkTheme}><Sidebar /></FluentProvider>
 * // Use: 
 * <FluentThemeConsumer themeOverrides={darkTheme}>
 *   <Sidebar />
 * </FluentThemeConsumer>
 * ```
 */
export const FluentThemeConsumer = React.memo<FluentThemeConsumerProps>(({
  themeOverrides,
  className,
  children
}) => {
  const parentTheme = React.useContext(ThemeContext);
  
  // Shallow merge with parent theme
  const mergedTheme = React.useMemo(
    () => themeOverrides ? { ...parentTheme, ...themeOverrides } : parentTheme,
    [parentTheme, themeOverrides]
  );
  
  // Conditionally render based on whether we have overrides
  return themeOverrides ? (
    <div className={className} data-theme-override>
      <ThemeContext.Provider value={mergedTheme}>
        {children}
      </ThemeContext.Provider>
    </div>
  ) : (
    <div className={className}>{children}</div>
  );
});

FluentThemeConsumer.displayName = 'FluentThemeConsumer';