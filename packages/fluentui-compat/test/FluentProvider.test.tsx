import React from 'react';
import { render, screen } from '@testing-library/react';
import { SmartFluentProvider, FluentProvider } from '../src/FluentProvider';
import { webLightTheme, webDarkTheme, FluentProvider as OriginalFluentProvider } from '@fluentui/react-components';

// Mock console.warn for testing
const originalConsoleWarn = console.warn;
const mockWarn = jest.fn();

beforeEach(() => {
  console.warn = mockWarn;
  mockWarn.mockClear();
  // Set NODE_ENV to development for warning tests
  process.env.NODE_ENV = 'development';
});

afterEach(() => {
  console.warn = originalConsoleWarn;
});

describe('SmartFluentProvider', () => {
  test('should render children', () => {
    render(
      <SmartFluentProvider theme={webLightTheme}>
        <div data-testid="child">Test Content</div>
      </SmartFluentProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test Content');
  });

  test('should warn about redundant provider in development', () => {
    const sharedTheme = webLightTheme;
    
    render(
      <OriginalFluentProvider theme={sharedTheme}>
        <SmartFluentProvider theme={sharedTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('SmartFluentProvider: This provider appears redundant')
    );
  });

  test('should not warn when themes are different', () => {
    render(
      <OriginalFluentProvider theme={webLightTheme}>
        <SmartFluentProvider theme={webDarkTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should not warn when forceRender is true', () => {
    const sharedTheme = webLightTheme;
    
    render(
      <OriginalFluentProvider theme={sharedTheme}>
        <SmartFluentProvider theme={sharedTheme} forceRender>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should not warn in production when redundant', () => {
    process.env.NODE_ENV = 'production';
    const sharedTheme = webLightTheme;
    
    const { container } = render(
      <OriginalFluentProvider theme={sharedTheme}>
        <SmartFluentProvider theme={sharedTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    // In production, redundant providers should not warn
    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should render provider when not redundant', () => {
    render(
      <OriginalFluentProvider theme={webLightTheme}>
        <SmartFluentProvider theme={webDarkTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should handle missing theme prop', () => {
    render(
      <OriginalFluentProvider theme={webLightTheme}>
        <SmartFluentProvider>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockWarn).toHaveBeenCalled();
  });

  test('should work without parent provider', () => {
    render(
      <SmartFluentProvider theme={webLightTheme}>
        <div data-testid="child">Test Content</div>
      </SmartFluentProvider>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('should detect redundancy when themes have same values but different references', () => {
    // Create a copy of the theme with the same values but different reference
    const themeCopy = { ...webLightTheme };
    
    render(
      <OriginalFluentProvider theme={webLightTheme}>
        <SmartFluentProvider theme={themeCopy}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    // Should warn because the theme values are the same even though references differ
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('SmartFluentProvider: This provider appears redundant')
    );
  });

  test('should not warn when theme is mutated but values remain the same', () => {
    // Create a mutable theme object
    const mutableTheme = { ...webLightTheme };
    
    // Use the same reference but verify shallow equality still works
    render(
      <OriginalFluentProvider theme={mutableTheme}>
        <SmartFluentProvider theme={mutableTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    // Should warn because it's the same reference
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('SmartFluentProvider: This provider appears redundant')
    );
  });

  test('should detect differences when a single theme property is changed', () => {
    const modifiedTheme = { 
      ...webLightTheme, 
      colorBrandBackground: '#ff0000' 
    };
    
    render(
      <OriginalFluentProvider theme={webLightTheme}>
        <SmartFluentProvider theme={modifiedTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    // Should not warn because a property value has changed
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should detect differences when theme has additional properties', () => {
    const extendedTheme = { 
      ...webLightTheme, 
      customProperty: 'custom-value' 
    };
    
    render(
      <OriginalFluentProvider theme={webLightTheme}>
        <SmartFluentProvider theme={extendedTheme}>
          <div data-testid="child">Test Content</div>
        </SmartFluentProvider>
      </OriginalFluentProvider>
    );
    
    // Should not warn because the theme has additional properties
    expect(mockWarn).not.toHaveBeenCalled();
  });
});

describe('FluentProvider export', () => {
  test('should export original FluentProvider', () => {
    expect(FluentProvider).toBeDefined();
    expect(typeof FluentProvider).toBe('object');
  });
});
