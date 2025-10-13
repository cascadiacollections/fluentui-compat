# useBoolean: Optimized Boolean State Management

## The Problem with Standard useState for Booleans

Using React's `useState` for boolean toggles leads to unstable callback references and verbose code:

```typescript
// ❌ Standard useState - new functions on every render
function TogglePanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  // ❌ New function instances created on every render
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);
  
  return (
    <div>
      <button onClick={toggle}>Toggle</button>
      <Panel isOpen={isOpen} onClose={close} />
    </div>
  );
}
```

**Issues:**
- Callback functions recreated on every render
- Child components re-render unnecessarily
- Must wrap in `useCallback` manually for optimization
- Boilerplate for simple operations
- Easy to forget functional updates for toggle

## The Solution: useBoolean Hook

`fluentui-compat` provides a hook with stable callback references by default:

```typescript
// ✅ useBoolean - stable callbacks, zero boilerplate
import { useBoolean } from '@cascadiacollections/fluentui-compat';

function TogglePanel() {
  const [isOpen, { setTrue: open, setFalse: close, toggle }] = useBoolean(false);
  
  return (
    <div>
      <button onClick={toggle}>Toggle</button>
      <Panel isOpen={isOpen} onClose={close} />
    </div>
  );
}
```

## Performance Benefits

### 1. Stable Callback References
- **Callbacks never change** - same identity across all renders
- **No useCallback needed** - optimization built-in
- **Prevents child re-renders** - memoized children don't update unnecessarily

### 2. Memory Efficiency
- **Single useMemo call** - all callbacks created together
- **Empty dependency array** - callbacks created once and reused
- **No closure overhead** - uses setState functional updates

### 3. Developer Experience
- **Explicit operations** - `setTrue`, `setFalse`, `toggle` are self-documenting
- **Safe in dependency arrays** - stable references won't trigger effects
- **Destructuring support** - rename callbacks as needed

## Performance Comparison

### Before (useState + useCallback)

```typescript
function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  
  // ❌ Must manually memoize each callback
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return (
    <>
      <button onClick={open}>Open Modal</button>
      <ModalDialog isOpen={isOpen} onClose={close} />
    </>
  );
}
```

**Code metrics:**
- 9 lines for state + callbacks
- 3 `useCallback` calls
- Easy to forget functional update in toggle

### After (useBoolean)

```typescript
function Modal() {
  const [isOpen, { setTrue: open, setFalse: close, toggle }] = useBoolean(false);
  
  return (
    <>
      <button onClick={open}>Open Modal</button>
      <ModalDialog isOpen={isOpen} onClose={close} />
    </>
  );
}
```

**Code metrics:**
- 1 line for state + callbacks
- 0 manual memoization needed
- Functional update built-in

**Result:** 88% reduction in boilerplate code

## Real-World Refactor Example

### Before: Feature Flags Component

```typescript
function FeatureFlags() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  // ❌ Lots of boilerplate
  const toggleDarkMode = useCallback(() => 
    setDarkMode(prev => !prev), []);
  const toggleNotifications = useCallback(() => 
    setNotifications(prev => !prev), []);
  const toggleAutoSave = useCallback(() => 
    setAutoSave(prev => !prev), []);
  
  return (
    <div>
      <label>
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        Dark Mode
      </label>
      <label>
        <input type="checkbox" checked={notifications} onChange={toggleNotifications} />
        Notifications
      </label>
      <label>
        <input type="checkbox" checked={autoSave} onChange={toggleAutoSave} />
        Auto Save
      </label>
    </div>
  );
}
```

**Lines of code:** 23 lines  
**Boilerplate:** 9 lines for callbacks

### After: With useBoolean

```typescript
function FeatureFlags() {
  const [darkMode, darkModeActions] = useBoolean(false);
  const [notifications, notificationActions] = useBoolean(true);
  const [autoSave, autoSaveActions] = useBoolean(true);
  
  return (
    <div>
      <label>
        <input type="checkbox" checked={darkMode} onChange={darkModeActions.toggle} />
        Dark Mode
      </label>
      <label>
        <input type="checkbox" checked={notifications} onChange={notificationActions.toggle} />
        Notifications
      </label>
      <label>
        <input type="checkbox" checked={autoSave} onChange={autoSaveActions.toggle} />
        Auto Save
      </label>
    </div>
  );
}
```

**Lines of code:** 14 lines (39% reduction)  
**Boilerplate:** 0 lines

## Preventing Child Re-renders

### Without Optimization

```typescript
const MemoizedPanel = React.memo(Panel);

function Container() {
  const [isOpen, setIsOpen] = useState(false);
  
  // ❌ New function on every render = Panel re-renders
  const close = () => setIsOpen(false);
  
  return <MemoizedPanel isOpen={isOpen} onClose={close} />;
}
```

**Result:** `MemoizedPanel` re-renders on every Container render

### With useBoolean

```typescript
const MemoizedPanel = React.memo(Panel);

function Container() {
  const [isOpen, { setFalse: close }] = useBoolean(false);
  
  // ✅ Stable callback = Panel only re-renders when isOpen changes
  return <MemoizedPanel isOpen={isOpen} onClose={close} />;
}
```

**Result:** `MemoizedPanel` only re-renders when `isOpen` actually changes

## API Reference

```typescript
interface IUseBooleanCallbacks {
  setTrue: () => void;   // Set to true
  setFalse: () => void;  // Set to false
  toggle: () => void;    // Toggle current value
}

function useBoolean(
  initialState: boolean
): [boolean, IUseBooleanCallbacks]
```

All callback functions maintain stable identity across renders.

## Common Use Cases

### 1. Modal/Dialog State
```typescript
const [isVisible, { setTrue: show, setFalse: hide }] = useBoolean(false);
```

### 2. Loading States
```typescript
const [isLoading, { setTrue: startLoading, setFalse: stopLoading }] = useBoolean(false);

async function fetchData() {
  startLoading();
  try {
    await api.fetch();
  } finally {
    stopLoading();
  }
}
```

### 3. Form Controls
```typescript
const [isChecked, { toggle }] = useBoolean(false);
<input type="checkbox" checked={isChecked} onChange={toggle} />
```

### 4. Accordion/Disclosure
```typescript
const [isExpanded, { toggle }] = useBoolean(false);
<button onClick={toggle}>
  {isExpanded ? 'Collapse' : 'Expand'}
</button>
```

## Migration Guide

1. **Replace useState** with useBoolean:
   ```typescript
   // Before
   const [value, setValue] = useState(false);
   
   // After
   const [value, { setTrue, setFalse, toggle }] = useBoolean(false);
   ```

2. **Remove useCallback** wrappers:
   ```typescript
   // Before
   const enable = useCallback(() => setValue(true), []);
   
   // After - destructure from useBoolean
   const [value, { setTrue: enable }] = useBoolean(false);
   ```

3. **Use in dependency arrays** safely:
   ```typescript
   useEffect(() => {
     // Safe - callbacks never change
     someOperation(setTrue);
   }, [setTrue]);
   ```

## Summary

The `useBoolean` hook provides:

- **100% stable callback references** - never change across renders
- **40-90% less boilerplate** compared to useState + useCallback
- **Prevents unnecessary re-renders** in child components
- **Self-documenting API** with explicit setTrue/setFalse/toggle
- **Zero runtime overhead** - single useMemo with empty deps

Perfect for any boolean state: modals, toggles, flags, loading states, expanded/collapsed panels, and feature flags. Eliminates the need for manual memoization while providing a cleaner, more expressive API.
