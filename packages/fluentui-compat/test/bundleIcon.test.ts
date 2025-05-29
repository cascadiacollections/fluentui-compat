import React from 'react';
import { FluentIcon } from '@fluentui/react-icons';
import { bundleIcon } from '../src';

// Mock FluentIcon components for testing
const MockFilledIcon: FluentIcon = (props) => 
  React.createElement('svg', { ...props, 'data-testid': 'filled-icon' });

const MockRegularIcon: FluentIcon = (props) => 
  React.createElement('svg', { ...props, 'data-testid': 'regular-icon' });

// Create a bundled icon
const TestIcon = bundleIcon(MockFilledIcon, MockRegularIcon);

// Basic test to verify the function works
describe('bundleIcon', () => {
  test('should create a component with correct displayName', () => {
    expect(TestIcon.displayName).toBe('CompoundIcon');
  });

  test('should be a function component', () => {
    expect(typeof TestIcon).toBe('function');
  });
});

// Export for potential manual testing
export { TestIcon, MockFilledIcon, MockRegularIcon };