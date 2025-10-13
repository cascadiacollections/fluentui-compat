# useAsync: React Hook for Automatic Async Cleanup

## The Problem with FluentUI's Async Class

FluentUI's `Async` utility class requires manual instantiation and cleanup, leading to potential memory leaks and boilerplate code:

```typescript
// ❌ FluentUI Async class - manual management required
import { Async } from '@fluentui/utilities';

class MyComponent extends React.Component {
  private async = new Async();
  
  componentWillUnmount() {
    this.async.dispose(); // Easy to forget!
  }
  
  handleClick = () => {
    this.async.setTimeout(() => {
      console.log('Delayed action');
    }, 1000);
  }
}
```

**Issues:**
- Requires class components or manual ref management
- Easy to forget calling `dispose()` → memory leaks
- Boilerplate code for initialization and cleanup
- Not idiomatic for modern React hooks

## The Solution: useAsync Hook

`fluentui-compat` provides a React hook that automatically manages the Async instance lifecycle:

```typescript
// ✅ fluentui-compat useAsync - automatic cleanup
import { useAsync } from '@cascadiacollections/fluentui-compat';

function MyComponent() {
  const async = useAsync();
  
  const handleClick = useCallback(() => {
    async.setTimeout(() => {
      console.log('Delayed action');
    }, 1000);
  }, [async]);
  
  return <button onClick={handleClick}>Start Timer</button>;
  // ✅ Automatic cleanup on unmount - no memory leaks!
}
```

## Performance Benefits

### 1. Memory Efficiency
- **Uses `useRef` instead of `useMemo`** - avoids closure allocation overhead
- **Lazy initialization** - only creates instance on first render
- **Automatic disposal** - prevents memory leaks from forgotten cleanup

### 2. Render Performance
- **Stable reference identity** - same instance across all renders
- **No re-renders triggered** - ref changes don't cause component updates
- **Minimal effect overhead** - single consolidated effect for cleanup

### 3. Development Experience
- **Automatic cleanup warnings** - detects components unmounting too quickly
- **React DevTools integration** - shows "Async(active)" in component tree
- **Zero boilerplate** - no manual initialization or disposal code

## Refactor Example

### Before (FluentUI Async class)

```typescript
import { Async } from '@fluentui/utilities';
import { useRef, useEffect } from 'react';

function SearchComponent() {
  const asyncRef = useRef<Async>();
  
  // Manual initialization
  useEffect(() => {
    asyncRef.current = new Async();
    
    // Manual cleanup
    return () => {
      asyncRef.current?.dispose();
    };
  }, []);
  
  const handleSearch = (query: string) => {
    asyncRef.current?.debounce(() => {
      performSearch(query);
    }, 500);
  };
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

**Lines of code:** 20 lines  
**Boilerplate:** 8 lines for setup/cleanup  
**Memory safety:** Manual (easy to forget disposal)

### After (useAsync hook)

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useCallback } from 'react';

function SearchComponent() {
  const async = useAsync();
  
  const handleSearch = useCallback((query: string) => {
    async.debounce(() => {
      performSearch(query);
    }, 500);
  }, [async]);
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

**Lines of code:** 12 lines (40% reduction)  
**Boilerplate:** 0 lines  
**Memory safety:** Automatic (guaranteed cleanup)

## Technical Implementation

The hook optimizes for performance through:

1. **Sentinel-based initialization** - uses `null` instead of Symbol for better memory efficiency
2. **Consolidated effects** - single effect handles both cleanup and dev warnings
3. **Conditional DevTools integration** - only in development mode
4. **TypeScript strict mode** - full type safety with minimal runtime overhead

## Compatibility

- ✅ React 16.14+ through 19.x
- ✅ Works with all Async class methods (setTimeout, setInterval, debounce, throttle)
- ✅ Drop-in replacement for manual Async management
- ✅ Full TypeScript support

## Migration Guide

1. Replace `Async` class imports with `useAsync` hook
2. Remove manual initialization and disposal code
3. Use the hook's return value directly in your component

```typescript
// Before
const asyncRef = useRef(new Async());
useEffect(() => () => asyncRef.current.dispose(), []);

// After
const async = useAsync();
```

## Summary

The `useAsync` hook transforms FluentUI's class-based Async utility into a modern, performant React hook that:

- **Eliminates memory leaks** through automatic cleanup
- **Reduces boilerplate** by 40%+ lines of code
- **Improves performance** with optimized ref-based implementation
- **Enhances developer experience** with warnings and DevTools integration

Perfect for any component using timeouts, intervals, debouncing, or throttling with guaranteed cleanup.
