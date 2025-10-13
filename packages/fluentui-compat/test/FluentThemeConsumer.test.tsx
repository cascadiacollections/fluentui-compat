import React from 'react';
import { render, screen } from '@testing-library/react';
import { FluentThemeConsumer } from '../src/FluentThemeConsumer';
import { ThemeContext_unstable as ThemeContext } from '@fluentui/react-shared-contexts';
import { webLightTheme, webDarkTheme } from '@fluentui/react-components';

// Test component that uses theme context
const ThemeConsumerTestComponent: React.FC = () => {
  const theme = React.useContext(ThemeContext);
  return (
    <div data-testid="theme-consumer">
      {theme ? `Theme has ${Object.keys(theme).length} keys` : 'No theme'}
    </div>
  );
};

describe('FluentThemeConsumer', () => {
  test('should render children without theme overrides', () => {
    render(
      <FluentThemeConsumer>
        <div data-testid="child">Test Content</div>
      </FluentThemeConsumer>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test Content');
  });

  test('should apply className', () => {
    render(
      <FluentThemeConsumer className="custom-class">
        <div data-testid="child">Test Content</div>
      </FluentThemeConsumer>
    );
    
    // The className should be applied to the wrapper div
    const parent = screen.getByTestId('child').parentElement;
    expect(parent).toHaveClass('custom-class');
  });

  test('should provide theme context when overrides are specified', () => {
    const themeOverrides = { colorBrandBackground: '#ff0000' };
    
    render(
      <FluentThemeConsumer themeOverrides={themeOverrides}>
        <ThemeConsumerTestComponent />
      </FluentThemeConsumer>
    );
    
    expect(screen.getByTestId('theme-consumer')).toHaveTextContent('Theme has 1 keys');
  });

  test('should merge with parent theme context', () => {
    const parentTheme = webLightTheme;
    const themeOverrides = { colorBrandBackground: '#ff0000' };
    
    render(
      <ThemeContext.Provider value={parentTheme}>
        <FluentThemeConsumer themeOverrides={themeOverrides}>
          <ThemeConsumerTestComponent />
        </FluentThemeConsumer>
      </ThemeContext.Provider>
    );
    
    // Should have more keys due to merging with parent theme
    const themeText = screen.getByTestId('theme-consumer').textContent;
    expect(themeText).toMatch(/Theme has \d+ keys/);
    
    // Should have more than just 1 key (the override)
    const keyCount = parseInt(themeText!.match(/\d+/)![0]);
    expect(keyCount).toBeGreaterThan(1);
  });

  test('should add data-theme-override attribute when overrides are provided', () => {
    const themeOverrides = { colorBrandBackground: '#ff0000' };
    
    render(
      <FluentThemeConsumer themeOverrides={themeOverrides}>
        <div data-testid="child">Test Content</div>
      </FluentThemeConsumer>
    );
    
    const parent = screen.getByTestId('child').parentElement;
    expect(parent).toHaveAttribute('data-theme-override');
  });

  test('should not add data-theme-override attribute when no overrides', () => {
    render(
      <FluentThemeConsumer>
        <div data-testid="child">Test Content</div>
      </FluentThemeConsumer>
    );
    
    const parent = screen.getByTestId('child').parentElement;
    expect(parent).not.toHaveAttribute('data-theme-override');
  });

  test('should work with complex theme overrides', () => {
    const themeOverrides = {
      colorBrandBackground: '#ff0000',
      colorBrandForeground1: '#ffffff',
      fontSizeBase300: '14px'
    };
    
    render(
      <FluentThemeConsumer themeOverrides={themeOverrides}>
        <ThemeConsumerTestComponent />
      </FluentThemeConsumer>
    );
    
    expect(screen.getByTestId('theme-consumer')).toHaveTextContent('Theme has 3 keys');
  });

  test('should memoize merged theme to prevent unnecessary re-renders', () => {
    const ThemeRenderCountComponent = React.memo(() => {
      const theme = React.useContext(ThemeContext);
      const renderCount = React.useRef(0);
      renderCount.current++;
      
      return (
        <div data-testid="render-count">
          Renders: {renderCount.current}, Theme keys: {theme ? Object.keys(theme).length : 0}
        </div>
      );
    });

    const TestWrapper: React.FC<{ triggerUpdate: number }> = ({ triggerUpdate }) => {
      // Keep themeOverrides stable to test memoization
      const themeOverrides = React.useMemo(() => ({ colorBrandBackground: '#ff0000' }), []);
      
      return (
        <FluentThemeConsumer themeOverrides={themeOverrides}>
          <ThemeRenderCountComponent />
          <div data-testid="trigger">{triggerUpdate}</div>
        </FluentThemeConsumer>
      );
    };

    const { rerender } = render(<TestWrapper triggerUpdate={1} />);
    
    expect(screen.getByTestId('render-count')).toHaveTextContent('Renders: 1');
    
    // Trigger parent re-render with same theme overrides
    rerender(<TestWrapper triggerUpdate={2} />);
    
    // The memoized theme consumer should not cause the inner component to re-render
    // because themeOverrides are memoized and FluentThemeConsumer is memoized
    expect(screen.getByTestId('render-count')).toHaveTextContent('Renders: 1');
  });
});
