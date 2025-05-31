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

- `react` >= 16.14.0 < 19.0.0
- `react-dom` >= 16.14.0 < 19.0.0
- `@fluentui/react-icons` >= 2.0.0

## Dependencies

This package includes:

- `@fluentui/utilities` for the Async utility class used by useAsync

## License

MIT