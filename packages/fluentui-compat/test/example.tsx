import React from 'react';
import { bundleIcon, FluentIcon } from '../src';

// Example usage of bundleIcon
// Note: In real usage, these would be actual FluentUI icon components

// Mock filled heart icon
const HeartFilled: FluentIcon = (props) => (
  React.createElement('svg', {
    ...props,
    viewBox: '0 0 20 20',
    children: React.createElement('path', {
      d: 'M10 17.5l-1.5-1.35C3.4 11.36 0 8.28 0 5.5 0 3.42 1.42 2 3.5 2c1.74 0 3.41.81 4.5 2.09C9.09 2.81 10.76 2 12.5 2 14.58 2 16 3.42 16 5.5c0 2.78-3.4 5.86-8.5 10.65L10 17.5z'
    })
  })
);

// Mock regular heart icon
const HeartRegular: FluentIcon = (props) => (
  React.createElement('svg', {
    ...props,
    viewBox: '0 0 20 20',
    children: React.createElement('path', {
      d: 'M12.5 2C10.76 2 9.09 2.81 8 4.09 6.91 2.81 5.24 2 3.5 2 1.42 2 0 3.42 0 5.5c0 2.78 3.4 5.86 8.5 10.65L10 17.5l1.5-1.35C16.6 11.36 20 8.28 20 5.5 20 3.42 18.58 2 16.5 2z'
    })
  })
);

// Create the bundled icon
export const HeartIcon = bundleIcon(HeartFilled, HeartRegular);

// Example component using the bundled icon
export const ExampleComponent: React.FC = () => {
  const [filled, setFilled] = React.useState(false);

  return React.createElement('div', {
    style: { padding: '20px' }
  }, [
    React.createElement('h3', { key: 'title' }, 'BundleIcon Example'),
    React.createElement('button', {
      key: 'button',
      onClick: () => setFilled(!filled),
      style: { marginRight: '10px' }
    }, `Toggle to ${filled ? 'Regular' : 'Filled'}`),
    React.createElement(HeartIcon, {
      key: 'icon',
      filled,
      style: { width: '24px', height: '24px', fill: filled ? 'red' : 'gray' }
    })
  ]);
};