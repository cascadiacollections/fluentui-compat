# fluentui-compat

> FluentUI React complimentary components and utilities focused on render performance

📚 **[Full API Documentation](https://cascadiacollections.github.io/fluentui-compat/)**

## Installation

```bash
npm install fluentui-compat
```

## useAsync

A React hook that provides an Async instance from `@fluentui/utilities` that is automatically cleaned up on component unmount. This hook ensures proper cleanup of timeouts, intervals, and other async operations.

### Usage

```typescript
import { useAsync } from 'fluentui-compat';
import { useCallback } from 'react';

function MyComponent() {
  const async = useAsync();
  
  const handleClick = useCallback(() => {
    async.setTimeout(() => {
      console.log('Delayed action');
    }, 1000);
  }, [async]);
  
  return <button onClick={handleClick}>Start Timer</button>;
}
```

### Features

- **Automatic Cleanup**: All async operations are automatically disposed when the component unmounts
- **Development Warnings**: Warns about potential race conditions in development mode  
- **React DevTools Integration**: Provides debugging information in development
- **Performance Optimized**: Uses stable references to prevent unnecessary re-renders

## Additional React Hooks

The fluentui-compat package provides several additional high-performance React hooks optimized for modern applications:

### useId

Generates a stable unique ID for component instances, useful for accessibility attributes and form elements.

```typescript
import { useId } from 'fluentui-compat';

function FormField() {
  const inputId = useId('text-field');
  
  return (
    <div>
      <label htmlFor={inputId}>Name:</label>
      <input id={inputId} type="text" />
    </div>
  );
}
```

### usePrevious

Tracks and returns the previous value of a prop or state across renders.

```typescript
import { usePrevious } from 'fluentui-compat';

function Counter() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);
  
  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {previousCount}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### useIsomorphicLayoutEffect

A drop-in replacement for `useLayoutEffect` that works with server-side rendering by using `useEffect` on the server and `useLayoutEffect` in the browser.

```typescript
import { useIsomorphicLayoutEffect } from 'fluentui-compat';

function MeasuredComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  
  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      setHeight(ref.current.offsetHeight);
    }
  }, []);
  
  return <div ref={ref}>Height: {height}px</div>;
}
```

### useMergedRefs

Merges multiple refs into a single callback ref, useful when you need to handle multiple refs on the same element.

```typescript
import { useMergedRefs } from 'fluentui-compat';
import { forwardRef, useRef } from 'react';

const FancyInput = forwardRef<HTMLInputElement>((props, forwardedRef) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(internalRef, forwardedRef);
  
  return <input ref={mergedRef} {...props} />;
});
```

### useOnEvent

Attaches event listeners to window or document with automatic cleanup.

```typescript
import { useOnEvent } from 'fluentui-compat';
import { useState } from 'react';

function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useOnEvent(window, 'resize', () => {
    setWidth(window.innerWidth);
  });
  
  return <div>Window width: {width}px</div>;
}
```

## bundleIcon

An optimized higher-order component for creating compound icons that can switch between filled and regular variants. This component is memoized for optimal render performance.

### Usage

```typescript
import { bundleIcon } from 'fluentui-compat';
import { HeartFilled, HeartRegular } from '@fluentui/react-icons';
import { useCallback, useState } from 'react';

// Create a bundled icon component
const HeartIcon = bundleIcon(HeartFilled, HeartRegular);

// Use the component
function MyComponent() {
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleToggleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev);
  }, []);
  
  return (
    <HeartIcon 
      filled={isFavorited}
      onClick={handleToggleFavorite}
      className="heart-icon"
    />
  );
}
```

### API

#### `bundleIcon(FilledIcon, RegularIcon)`

Creates a memoized compound icon component.

**Parameters:**
- `FilledIcon`: FluentIcon - The filled variant of the icon
- `RegularIcon`: FluentIcon - The regular variant of the icon

**Returns:**
- A React component that accepts all standard SVG props plus:
  - `filled?: boolean` - Whether to render the filled variant
  - `className?: string` - CSS classes to apply
  - `primaryFill?: string` - Fill color for the icon

### Features

- **Performance Optimized**: Uses React.memo for efficient re-renders
- **Type Safe**: Full TypeScript support with proper type definitions
- **Flexible**: Works with any FluentUI icon components
- **Consistent**: Applies standard icon class names for styling

## Peer Dependencies

This package requires the following peer dependencies:

- `react` >= 16.14.0 < 20.0.0
- `react-dom` >= 16.14.0 < 20.0.0
- `@fluentui/react-icons` >= 2.0.0

## Dependencies

This package includes:

- `@fluentui/utilities` for the Async utility class used by useAsync

## License

MIT