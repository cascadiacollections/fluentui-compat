# useForceUpdate: Controlled Component Re-renders

## The Problem: Force Updates in Functional Components

Forcing re-renders is sometimes necessary for integrating with non-React state or debugging, but React doesn't provide a direct API:

```typescript
// ❌ Common workarounds - verbose and unclear
function MyComponent() {
  // Option 1: Dummy state
  const [, setDummy] = useState(0);
  const forceUpdate = () => setDummy(prev => prev + 1);
  
  // Option 2: Reducer hack
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Option 3: Object state
  const [, setUpdate] = useState({});
  const forceUpdate = () => setUpdate({});
}
```

**Issues:**
- No standard pattern - developers create their own
- Unclear intent - what is the state for?
- No development warnings - easy to overuse
- No debugging support - hard to track excessive usage

## The Solution: useForceUpdate Hook

`fluentui-compat` provides a clear, optimized hook with built-in developer guidance:

```typescript
// ✅ useForceUpdate - clear intent and optimized
import { useForceUpdate } from '@cascadiacollections/fluentui-compat';

function MyComponent() {
  const forceUpdate = useForceUpdate();
  
  const handleRefresh = useCallback(() => {
    // Clear semantic meaning
    forceUpdate();
  }, [forceUpdate]);
  
  return <button onClick={handleRefresh}>Refresh</button>;
}
```

## Performance Benefits

### 1. Optimized Implementation
- **Uses `useReducer`** - React's most efficient force-update mechanism
- **Stable function identity** - returned function never changes
- **No closure allocations** - minimal memory overhead
- **Zero dependencies** - simplest possible implementation

### 2. Development Safeguards
- **High-frequency warnings** - detects excessive usage (>5 calls/second)
- **Lifecycle warnings** - flags short-lived components with many updates
- **Performance marks** - adds browser profiler markers
- **React DevTools integration** - shows usage metrics

### 3. Clear Intent
- **Self-documenting API** - purpose is immediately obvious
- **Explicit operation** - makes force updates visible in code
- **Discourages overuse** - warnings educate developers

## Comparison with Alternatives

### Alternative 1: Dummy State Counter

```typescript
function Component() {
  const [dummy, setDummy] = useState(0);
  const forceUpdate = () => setDummy(prev => prev + 1);
  
  // ❌ Unclear what 'dummy' represents
  // ❌ Counter grows unbounded (minor memory concern)
  // ❌ No warnings about overuse
}
```

### Alternative 2: useReducer Hack

```typescript
function Component() {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  // ❌ Not obvious what this does
  // ❌ Still has counter growth
  // ❌ No development warnings
}
```

### useForceUpdate (Ideal)

```typescript
function Component() {
  const forceUpdate = useForceUpdate();
  
  // ✅ Crystal clear intent
  // ✅ Optimized implementation
  // ✅ Development warnings
  // ✅ Performance monitoring
}
```

## Real-World Use Cases

### 1. Integration with Non-React State

```typescript
// External state management (MobX, Zustand, etc.)
import { makeObservable, observable } from 'mobx';

class Store {
  @observable value = 0;
}

const store = new Store();

function ObserverComponent() {
  const forceUpdate = useForceUpdate();
  
  useEffect(() => {
    // Subscribe to external state
    return store.subscribe(forceUpdate);
  }, [forceUpdate]);
  
  return <div>Value: {store.value}</div>;
}
```

### 2. Canvas/WebGL Updates

```typescript
function CanvasComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const forceUpdate = useForceUpdate();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl');
    
    // Animation loop
    const animate = () => {
      renderScene(gl);
      forceUpdate(); // Trigger React reconciliation
      requestAnimationFrame(animate);
    };
    
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [forceUpdate]);
  
  return <canvas ref={canvasRef} />;
}
```

### 3. Debugging and Development

```typescript
function DebugComponent() {
  const forceUpdate = useForceUpdate();
  
  // Add manual refresh for debugging
  useEffect(() => {
    window.debugRefresh = forceUpdate;
    return () => {
      delete window.debugRefresh;
    };
  }, [forceUpdate]);
  
  return <div>Debug content</div>;
}

// In browser console: debugRefresh()
```

## Development Warnings

### High Frequency Warning

```typescript
function BadExample() {
  const forceUpdate = useForceUpdate();
  
  useEffect(() => {
    // ⚠️ Triggers warning: 10 calls/second
    const interval = setInterval(forceUpdate, 100);
    return () => clearInterval(interval);
  }, [forceUpdate]);
}
```

**Console output:**
```
useForceUpdate: High usage frequency detected (10.0 calls/second).
Frequent force updates can cause performance degradation and should be 
used sparingly. Consider using useState, useReducer, or proper data 
flow patterns instead.
```

### Short Lifetime Warning

```typescript
function ShortLivedComponent() {
  const forceUpdate = useForceUpdate();
  
  useEffect(() => {
    // Component calls forceUpdate 10 times
    for (let i = 0; i < 10; i++) {
      forceUpdate();
    }
  }, [forceUpdate]);
  
  // Component unmounts after 500ms
  useEffect(() => {
    const timer = setTimeout(() => unmount(), 500);
    return () => clearTimeout(timer);
  }, []);
}
```

**Console output:**
```
useForceUpdate: Component had 10 force updates in a short lifetime 
(0.5 seconds). This pattern may indicate unnecessary re-renders 
affecting performance.
```

## Performance Monitoring

When force updates occur, browser performance markers are created:

```typescript
function MonitoredComponent() {
  const forceUpdate = useForceUpdate();
  
  const handleClick = () => {
    forceUpdate();
    // Creates performance mark: "useForceUpdate:call"
  };
  
  return <button onClick={handleClick}>Update</button>;
}
```

View in Chrome DevTools Performance tab:
- Search for "useForceUpdate:call" marks
- Analyze frequency and timing
- Identify optimization opportunities

## When to Use (and Not Use)

### ✅ Valid Use Cases

1. **External state integration** (MobX, Zustand, RxJS)
2. **Canvas/WebGL rendering loops**
3. **Third-party library integration** (D3, Three.js)
4. **Development/debugging tools**
5. **Legacy code migration** (class component → hooks)

### ❌ Anti-patterns (Use Proper State Instead)

```typescript
// ❌ DON'T: Use for regular state
function BadExample() {
  const forceUpdate = useForceUpdate();
  let count = 0; // This is wrong!
  
  return (
    <button onClick={() => {
      count++;
      forceUpdate();
    }}>
      Count: {count}
    </button>
  );
}

// ✅ DO: Use proper state
function GoodExample() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count: {count}
    </button>
  );
}
```

## API Reference

```typescript
function useForceUpdate(): () => void
```

Returns a stable function that forces a component re-render when called.

**Return value:**
- Function with stable identity (never changes)
- No parameters
- No return value
- Triggers immediate re-render when called

## Implementation Details

```typescript
export function useForceUpdate(): () => void {
  const [, dispatch] = useReducer((x: number) => x + 1, 0);
  
  // Stable wrapper with development instrumentation
  return useCallback(() => {
    // Development warnings and performance marks
    if (process.env.NODE_ENV === 'development') {
      // Track call frequency
      // Add performance marks
      // Warn about excessive usage
    }
    
    dispatch();
  }, [dispatch]);
}
```

## Migration Guide

1. **Replace custom force update implementations**:
   ```typescript
   // Before
   const [, setDummy] = useState(0);
   const forceUpdate = () => setDummy(prev => prev + 1);
   
   // After
   const forceUpdate = useForceUpdate();
   ```

2. **Update dependency arrays**:
   ```typescript
   useEffect(() => {
     someOperation(forceUpdate);
   }, [forceUpdate]); // Safe - stable identity
   ```

3. **Review warnings** in development and refactor if needed

## Summary

The `useForceUpdate` hook provides:

- **Clear semantic meaning** - obvious intent in code
- **Optimized implementation** - uses useReducer for best performance
- **Stable function identity** - safe in dependency arrays
- **Development warnings** - prevents performance issues
- **Performance monitoring** - browser profiler integration
- **Zero overhead in production** - warnings only in development

Use for legitimate scenarios like external state integration or canvas rendering, but heed the warnings - proper React state management is usually better. The hook makes force updates explicit and monitored, helping teams maintain performant applications.
