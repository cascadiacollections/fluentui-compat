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

## useArraySlice

A React hook for managing array collections with pagination, search/filtering, and visibility controls. Optimized for performance with large datasets and provides comprehensive list management functionality.

### Usage

```typescript
import { useArraySlice } from 'fluentui-compat';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserList({ users }: { users: User[] }) {
  const {
    currentItems,
    pagination,
    search,
    getItemId
  } = useArraySlice(users, {
    pageSize: 10,
    searchFunction: (user, term) => 
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase())
  });

  return (
    <div>
      <input 
        placeholder="Search users..."
        onChange={(e) => search.setSearchTerm(e.target.value)}
      />
      
      {currentItems.map((user, index) => (
        <div key={getItemId(user, index)}>
          {user.name} - {user.email}
        </div>
      ))}
      
      <div>
        <button 
          onClick={pagination.previousPage} 
          disabled={!pagination.hasPreviousPage}>
          Previous
        </button>
        <span>Page {pagination.currentPage + 1} of {pagination.totalPages}</span>
        <button 
          onClick={pagination.nextPage} 
          disabled={!pagination.hasNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Features

- **Pagination**: Configurable page size with full navigation controls
- **Search/Filtering**: Custom search functions with automatic pagination reset
- **Visibility Toggle**: Global show/hide all items functionality
- **ID Management**: User-provided ID functions with collision-resistant fallbacks
- **Performance Optimized**: Stable callback identities and efficient memoization
- **TypeScript Generics**: Complete type safety for any array type
- **React 18+ Support**: Progressive enhancement with `useId` and `useDeferredValue`
- **React DevTools Integration**: Debug information in development builds

### API

#### Options

```typescript
interface UseArraySliceOptions<T> {
  pageSize?: number;              // Items per page (default: 10)
  initialPage?: number;            // Starting page 0-based (default: 0)
  initialVisible?: boolean;        // Initial visibility (default: true)
  searchFunction?: (item: T, searchTerm: string) => boolean;
  initialSearchTerm?: string;      // Initial search term
  getItemId?: (item: T, index: number) => string | number;
}
```

#### Return Value

```typescript
interface UseArraySliceResult<T> {
  currentItems: readonly T[];      // Current page slice
  totalItems: number;              // Total filtered items
  currentPage: number;             // Current page (0-based)
  totalPages: number;              // Total page count
  allVisible: boolean;             // Global visibility state
  searchTerm: string;              // Current search term
  
  pagination: {
    goToPage: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  
  visibility: {
    showAll: () => void;
    hideAll: () => void;
    toggleAll: () => void;
  };
  
  search: {
    setSearchTerm: (term: string) => void;
    clearSearch: () => void;
  };
  
  controls: {
    setPageSize: (size: number) => void;
    pageSize: number;
  };
  
  getItemId: (item: T, sliceIndex: number) => string | number;
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

- `react` >= 16.14.0 < 19.0.0
- `react-dom` >= 16.14.0 < 19.0.0
- `@fluentui/react-icons` >= 2.0.0

## Dependencies

This package includes:

- `@fluentui/utilities` for the Async utility class used by useAsync

## License

MIT