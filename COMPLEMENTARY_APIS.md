# Complementary Fluent UI APIs

This document enumerates potential complementary APIs that may be added to the `@cascadiacollections/fluentui-compat` package. These recommendations focus on React best patterns and practices, runtime performance, and memory considerations.

## Current APIs

The package currently provides the following optimized utilities:

1. **bundleIcon** - Optimized higher-order component for compound icons with filled/regular variants
2. **useAsync** - React hook providing Async instance with automatic cleanup
3. **useBoolean** - Hook for boolean state management with stable callbacks
4. **useConst** - Hook for constant values with guaranteed stable identity
5. **useEventCallback** - Hook for stable event handlers that access fresh props/state
6. **useForceUpdate** - Hook to force component re-renders when needed
7. **useSetTimeout** - Hook for timeout management with automatic cleanup

## Recommended Complementary APIs

### High Priority - Performance & Memory Focus

These APIs directly align with the package's focus on render performance and memory considerations.

#### 1. usePrevious

**Purpose**: Track the previous value of a prop or state variable across renders.

**Use Cases**:
- Detect actual changes in values to conditionally trigger effects
- Compare current vs previous values for optimization decisions
- Implement "did value change" logic without manual tracking

**Performance Benefits**:
- Prevents unnecessary re-renders by enabling precise change detection
- Avoids running expensive operations when values haven't changed
- Enables efficient memoization strategies

**Memory Considerations**:
- Minimal overhead: single `useRef` to store previous value
- No closures or function allocations

**Example**:
```typescript
function MyComponent({ userId }: Props) {
  const previousUserId = usePrevious(userId);
  
  useEffect(() => {
    if (userId !== previousUserId) {
      // Only fetch when userId actually changes
      fetchUserData(userId);
    }
  }, [userId, previousUserId]);
}
```

**Implementation Notes**:
- Uses `useRef` and `useEffect` internally
- Updates ref after render to capture "previous" value
- Type-safe with generic parameter

---

#### 2. useOnEvent / useEventListener

**Purpose**: Manage DOM event listeners with automatic cleanup on component unmount.

**Use Cases**:
- Window/document event listeners (scroll, resize, keydown)
- Element event listeners with automatic removal
- Complex event handling patterns

**Performance Benefits**:
- Automatic event listener removal on unmount
- Prevents orphaned event listeners
- Efficient event handler registration

**Memory Considerations**:
- Prevents memory leaks from forgotten event listeners
- Automatic cleanup of all registered events
- Uses WeakMap for efficient listener tracking

**Example**:
```typescript
function ScrollTracker() {
  useOnEvent(window, 'scroll', () => {
    console.log('Scrolled!');
  });
  
  // Event listener automatically removed on unmount
  return <div>Scroll the page</div>;
}
```

**Implementation Notes**:
- Based on FluentUI's EventGroup utility
- Supports multiple events and targets
- Properly handles addEventListener/removeEventListener

---

#### 3. useMountedState

**Purpose**: Check if a component is currently mounted to prevent state updates on unmounted components.

**Use Cases**:
- Async operations that may complete after unmount
- Conditional state updates based on mount status
- Preventing "Can't perform a React state update on an unmounted component" warnings

**Performance Benefits**:
- Avoids unnecessary state updates
- Prevents React warnings and associated overhead
- Enables safe async patterns

**Memory Considerations**:
- Prevents memory leaks from state updates after unmount
- Minimal overhead: single ref and effect

**Example**:
```typescript
function DataFetcher() {
  const isMounted = useMountedState();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(result => {
      if (isMounted()) {
        setData(result); // Only update if still mounted
      }
    });
  }, [isMounted]);
}
```

**Implementation Notes**:
- Returns a function that checks mounted state
- Uses ref to track mount/unmount
- Works with async/await patterns

---

#### 4. useId

**Purpose**: Generate unique, stable IDs for accessibility attributes and DOM elements.

**Use Cases**:
- Linking form inputs with labels (`htmlFor`/`id`)
- ARIA attributes requiring unique IDs
- Multiple instances of the same component needing unique IDs

**Performance Benefits**:
- Stable ID generation without re-computation
- No prop drilling for ID values
- Consistent across renders

**Memory Considerations**:
- Minimal overhead: single constant value
- IDs cleaned up automatically

**Example**:
```typescript
function FormField({ label }: Props) {
  const id = useId('field');
  
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

**Implementation Notes**:
- Based on FluentUI's getId utility
- Ensures uniqueness across component instances
- Optional prefix parameter for namespacing
- React 18+ provides native useId; this is for backward compatibility

---

#### 5. useDebounce

**Purpose**: Debounce a value or callback to limit the rate of updates/executions.

**Use Cases**:
- Search input with API calls
- Window resize handlers
- Form validation on user input

**Performance Benefits**:
- Dramatically reduces number of expensive operations
- Prevents excessive API calls or re-renders
- Configurable delay for different use cases

**Memory Considerations**:
- Efficiently manages timers with automatic cleanup
- Single timeout per debounced value

**Example**:
```typescript
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery); // Only called 500ms after typing stops
    }
  }, [debouncedQuery]);
  
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

**Implementation Notes**:
- Uses setTimeout internally with automatic cleanup
- Returns debounced value or callback
- Configurable delay parameter

---

#### 6. useThrottle

**Purpose**: Throttle a value or callback to execute at most once per time interval.

**Use Cases**:
- Scroll event handlers
- Window resize handlers
- Animation frame updates

**Performance Benefits**:
- Limits execution frequency of expensive operations
- Ensures consistent frame rate
- Reduces computational overhead

**Memory Considerations**:
- Efficient timer management
- Automatic cleanup on unmount

**Example**:
```typescript
function ScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  
  const handleScroll = useThrottle(() => {
    setScrollY(window.scrollY);
  }, 100); // At most once per 100ms
  
  useOnEvent(window, 'scroll', handleScroll);
  
  return <div>Scroll position: {scrollY}</div>;
}
```

**Implementation Notes**:
- Different from debounce: executes immediately, then waits
- Uses timestamp tracking for precise throttling
- Configurable interval parameter

---

#### 7. useMergedRefs

**Purpose**: Merge multiple refs into a single ref callback.

**Use Cases**:
- Component needs both forwarded ref and internal ref
- Multiple ref callbacks for the same element
- HOCs and ref forwarding patterns

**Performance Benefits**:
- Single ref callback instead of multiple
- Efficient ref handling
- Prevents ref callback churn

**Memory Considerations**:
- No additional closures per render
- Efficient ref management

**Example**:
```typescript
const ForwardedComponent = forwardRef((props, ref) => {
  const internalRef = useRef();
  const mergedRef = useMergedRefs(ref, internalRef);
  
  return <div ref={mergedRef}>Content</div>;
});
```

**Implementation Notes**:
- Based on FluentUI's createMergedRef
- Handles ref objects, ref callbacks, and null refs
- Type-safe with TypeScript

---

#### 8. useUnmount

**Purpose**: Execute cleanup logic when component unmounts.

**Use Cases**:
- Cleanup operations that don't fit in useEffect
- Clear API for unmount-only logic
- Resource disposal

**Performance Benefits**:
- Clear, explicit cleanup semantics
- Prevents resource leaks
- More readable than useEffect return

**Memory Considerations**:
- Ensures proper resource disposal
- Prevents memory leaks from lingering resources

**Example**:
```typescript
function ResourceManager() {
  const resource = useConst(() => createExpensiveResource());
  
  useUnmount(() => {
    resource.dispose(); // Clean up on unmount
  });
  
  return <div>Using resource</div>;
}
```

**Implementation Notes**:
- Simple wrapper around useEffect with empty deps
- Callback only called on unmount
- Clear intent compared to useEffect pattern

---

### Medium Priority - React Best Practices

These APIs support common React patterns and improve code quality.

#### 9. useControlled

**Purpose**: Support both controlled and uncontrolled component patterns.

**Use Cases**:
- Form inputs that can be controlled or uncontrolled
- Components with optional value prop
- Flexible component APIs

**Performance Benefits**:
- Efficient state management for both patterns
- Single implementation for both modes
- Prevents unnecessary re-renders

**Example**:
```typescript
function Input({ value: controlledValue, onChange, defaultValue }: Props) {
  const [value, setValue] = useControlled(controlledValue, defaultValue);
  
  const handleChange = (e) => {
    setValue(e.target.value);
    onChange?.(e);
  };
  
  return <input value={value} onChange={handleChange} />;
}
```

**Implementation Notes**:
- Based on FluentUI's isControlled utility
- Handles controlled/uncontrolled detection
- Manages internal state when uncontrolled

---

#### 10. useMount

**Purpose**: Execute logic only once when component mounts.

**Use Cases**:
- One-time initialization
- API calls on mount
- Logging, analytics

**Performance Benefits**:
- Clear intent: runs exactly once
- More explicit than useEffect with empty deps
- Prevents accidental re-runs

**Example**:
```typescript
function Dashboard() {
  useMount(() => {
    logPageView('dashboard');
    fetchInitialData();
  });
  
  return <div>Dashboard</div>;
}
```

**Implementation Notes**:
- Simple wrapper around useEffect with empty deps
- Clear semantic meaning
- No dependency array confusion

---

#### 11. useLatest

**Purpose**: Get a ref to the latest value without causing re-renders.

**Use Cases**:
- Callbacks that need latest props/state without being in deps
- Breaking closure capture in useEffect
- Event handlers with fresh values

**Performance Benefits**:
- Prevents unnecessary effect re-runs
- Stable ref identity
- No closure allocations

**Example**:
```typescript
function Timer({ onTick }: Props) {
  const onTickRef = useLatest(onTick);
  
  useEffect(() => {
    const timer = setInterval(() => {
      onTickRef.current(); // Always calls latest onTick
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Empty deps - effect never re-runs
}
```

**Implementation Notes**:
- Uses useRef to store latest value
- Updates ref on every render
- Returns stable ref object

---

### Lower Priority - Specialized Use Cases

These APIs solve specific problems but may have narrower applicability.

#### 12. useMediaQuery

**Purpose**: React to media query changes for responsive design.

**Use Cases**:
- Responsive layouts
- Conditional rendering based on screen size
- Mobile vs desktop experiences

**Performance Benefits**:
- Efficient media query matching
- Window resize optimization

**Example**:
```typescript
function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

---

#### 13. useClickOutside

**Purpose**: Detect clicks outside an element.

**Use Cases**:
- Close dropdowns when clicking outside
- Modal/dialog dismissal
- Tooltip interactions

**Performance Benefits**:
- Efficient event handling
- Automatic cleanup

**Example**:
```typescript
function Dropdown({ isOpen, onClose }: Props) {
  const ref = useRef();
  
  useClickOutside(ref, () => {
    if (isOpen) onClose();
  });
  
  return <div ref={ref}>Dropdown content</div>;
}
```

---

#### 14. useIsomorphicLayoutEffect

**Purpose**: Use `useLayoutEffect` on client, `useEffect` on server for SSR safety.

**Use Cases**:
- SSR applications
- Layout measurements
- DOM mutations before paint

**Performance Benefits**:
- Prevents SSR warnings
- Proper timing for layout effects

**Example**:
```typescript
function MeasuredComponent() {
  const ref = useRef();
  const [height, setHeight] = useState(0);
  
  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      setHeight(ref.current.offsetHeight);
    }
  }, []);
  
  return <div ref={ref}>Content</div>;
}
```

**Implementation Notes**:
- Already exists in @fluentui/utilities
- Could be re-exported for convenience

---

## Implementation Priority

Based on the package's focus on **render performance**, **memory considerations**, and **React best practices**, the recommended implementation order is:

### Phase 1: Core Performance & Memory (Highest Impact)
1. **usePrevious** - Extremely common pattern, high performance impact
2. **useDebounce** - High performance impact for search/input scenarios
3. **useThrottle** - High performance impact for scroll/resize scenarios
4. **useMountedState** - Prevents memory leaks, common async pattern

### Phase 2: Memory Safety & Cleanup
5. **useOnEvent** - Prevents memory leaks, common DOM interaction pattern
6. **useUnmount** - Clean API, improves code readability
7. **useMergedRefs** - Common React pattern, ref management

### Phase 3: Developer Experience & Best Practices
8. **useId** - Accessibility requirement, fills gap for React < 18
9. **useMount** - Clear intent, improves code readability
10. **useLatest** - Useful for breaking closure captures
11. **useControlled** - Important for component library APIs

### Phase 4: Specialized Use Cases (As Needed)
12. **useMediaQuery** - Responsive design support
13. **useClickOutside** - Common UI pattern
14. **useIsomorphicLayoutEffect** - SSR support (or re-export existing)

## Design Principles

When implementing these APIs, maintain consistency with existing package principles:

1. **Performance First**: Use `useRef` over `useMemo` where appropriate, minimize closures
2. **Memory Efficient**: Automatic cleanup, prevent leaks, efficient data structures
3. **Type Safe**: Full TypeScript support with strict mode
4. **Development Warnings**: Include helpful warnings in development mode
5. **React DevTools**: Provide `useDebugValue` for better debugging experience
6. **React 16-19 Compatible**: Support wide React version range
7. **Stable References**: Ensure returned functions/objects maintain identity
8. **Comprehensive Tests**: Test with React Testing Library, cover edge cases
9. **Well Documented**: JSDoc with examples, performance notes, and best practices

## Additional Considerations

### Bundle Size
- Each API should be tree-shakeable
- Minimize dependencies between hooks
- Keep implementation concise

### API Surface
- Follow existing naming conventions (use* prefix)
- Consistent parameter ordering
- Return types that match common expectations

### Documentation
- Update main README with new APIs
- Maintain API documentation with examples
- Document performance characteristics
- Include migration guides from FluentUI utilities

### Testing
- Unit tests for all hooks
- Integration tests with real components
- Performance benchmarks for critical paths
- React 19 compatibility tests

## References

- [React Hooks Documentation](https://react.dev/reference/react)
- [FluentUI Utilities Package](https://github.com/microsoft/fluentui/tree/master/packages/utilities)
- [React Hook Patterns](https://usehooks.com/)
- [Performance Optimization](https://react.dev/learn/render-and-commit)
