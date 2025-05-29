import React from 'react';
import { FluentIcon } from '@fluentui/react-icons';
import { mergeClasses } from '@fluentui/react-components';

export interface BundledIconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean;
  primaryFill?: string;
  className?: string;
}

const iconFilledClassName = 'fui-Icon--filled';
const iconRegularClassName = 'fui-Icon--regular';

/**
 * Creates an optimized bundled icon component that renders either a filled or regular icon
 * based on the `filled` prop. The component is memoized for optimal render performance.
 * 
 * @example
 * ```typescript
 * import { bundleIcon } from 'fluentui-compat';
 * import { HeartFilled, HeartRegular } from '@fluentui/react-icons';
 * 
 * const HeartIcon = bundleIcon(HeartFilled, HeartRegular);
 * 
 * // Usage in component
 * <HeartIcon filled={isLiked} onClick={handleToggle} />
 * ```
 * 
 * @param FilledIcon - The filled variant of the icon
 * @param RegularIcon - The regular variant of the icon
 * @returns A memoized React component that renders the appropriate icon variant
 */
export const bundleIcon = (FilledIcon: FluentIcon, RegularIcon: FluentIcon): React.ComponentType<BundledIconProps> => {
  const Component = React.memo<BundledIconProps>((props) => {
    const { className, filled, ...rest } = props;
    
    return filled ? 
      <FilledIcon {...rest} className={mergeClasses(iconFilledClassName, className)} /> :
      <RegularIcon {...rest} className={mergeClasses(iconRegularClassName, className)} />;
  });
  
  Component.displayName = "CompoundIcon";
  
  return Component;
};