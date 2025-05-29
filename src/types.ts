import React from 'react';

/**
 * FluentIcon component type - represents a FluentUI icon component
 */
export type FluentIcon = React.ComponentType<React.SVGProps<SVGSVGElement> & {
  filled?: boolean;
  primaryFill?: string;
  className?: string;
}>;

/**
 * Props for bundled icons
 */
export interface BundledIconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean;
  primaryFill?: string;
  className?: string;
}