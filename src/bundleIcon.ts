import React from 'react';
import { FluentIcon, BundledIconProps } from './types';
import { mergeClasses, iconFilledClassName, iconRegularClassName } from './utils';

/**
 * Creates an optimized bundled icon component that renders either a filled or regular icon
 * based on the `filled` prop. The component is memoized for optimal render performance.
 * 
 * @param FilledIcon - The filled variant of the icon
 * @param RegularIcon - The regular variant of the icon
 * @returns A memoized React component that renders the appropriate icon variant
 */
export const bundleIcon = (FilledIcon: FluentIcon, RegularIcon: FluentIcon): React.ComponentType<BundledIconProps> => {
  const Component = React.memo<BundledIconProps>((props) => {
    const { className, filled, ...rest } = props;
    
    return filled ? 
      React.createElement(FilledIcon, { ...rest, className: mergeClasses(iconFilledClassName, className) }) :
      React.createElement(RegularIcon, { ...rest, className: mergeClasses(iconRegularClassName, className) });
  });
  
  Component.displayName = "CompoundIcon";
  
  return Component;
};