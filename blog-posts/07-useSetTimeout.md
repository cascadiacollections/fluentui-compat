# useSetTimeout: Managed Timeout Handling with Automatic Cleanup

## The Problem: setTimeout Memory Leaks

Raw `setTimeout` in React components often leads to memory leaks when components unmount before timeouts complete:

```typescript
// ❌ Common memory leak pattern
function NotificationComponent({ message }) {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    // ⚠️ Timeout continues after unmount
    setTimeout(() => {
      setShow(false); // setState on unmounted component!
    }, 3000);
    // Missing cleanup!
  }, []);
  
  return show ? <div>{message}</div> : null;
}
```

**Issues:**
- No automatic cleanup on unmount
- Multiple timeouts hard to track
- Easy to forget `clearTimeout`
- Manual ID management required
- setState warnings on unmounted components

## The Solution: useSetTimeout Hook

`fluentui-compat` provides automatic timeout management with guaranteed cleanup:

```typescript
// ✅ useSetTimeout - automatic cleanup
import { useSetTimeout } from '@cascadiacollections/fluentui-compat';

function NotificationComponent({ message }) {
  const [show, setShow] = useState(true);
  const { setTimeout } = useSetTimeout();
  
  useEffect(() => {
    setTimeout(() => {
      setShow(false);
    }, 3000);
    // ✅ Automatic cleanup on unmount!
  }, [setTimeout]);
  
  return show ? <div>{message}</div> : null;
}
```

## Performance Benefits

### 1. Memory Efficiency
- **Automatic cleanup** - all timeouts cleared on unmount
- **Set-based tracking** - O(1) add/remove operations
- **No memory leaks** - impossible to forget cleanup
- **Efficient storage** - uses Set instead of object/array

### 2. Developer Experience
- **No manual IDs** - handled internally
- **Multiple timeouts** - manage many at once
- **Clear API** - familiar setTimeout interface
- **Development warnings** - detects excessive timeouts (50+ active)
- **Long timeout warnings** - flags timeouts > 1 minute

### 3. Cleanup Guarantees
- **Guaranteed on unmount** - React's cleanup mechanism
- **Manual clearing** - optional clearTimeout provided
- **Auto-removal** - timeouts remove themselves when complete

## Comparison with Manual Management

### Before: Manual setTimeout Management

```typescript
function ToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIds = useRef<number[]>([]);
  
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    
    // ❌ Manual tracking
    const timeoutId = window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      // Remove from tracking
      timeoutIds.current = timeoutIds.current.filter(tid => tid !== timeoutId);
    }, 3000);
    
    timeoutIds.current.push(timeoutId);
  };
  
  // ❌ Manual cleanup required
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(id => clearTimeout(id));
    };
  }, []);
  
  return (
    <div>
      {toasts.map(toast => (
        <div key={toast.id}>{toast.message}</div>
      ))}
    </div>
  );
}
```

**Issues:**
- 15+ lines of timeout management boilerplate
- Manual ref management
- Manual cleanup code
- Array operations (not optimal)

### After: With useSetTimeout

```typescript
function ToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { setTimeout } = useSetTimeout();
  
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    
    // ✅ Simple, automatic cleanup
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  
  // ✅ No manual cleanup needed!
  
  return (
    <div>
      {toasts.map(toast => (
        <div key={toast.id}>{toast.message}</div>
      ))}
    </div>
  );
}
```

**Improvements:**
- 60% less code (6 lines vs 15)
- No manual cleanup
- Automatic tracking
- Set-based storage (O(1) operations)

## Real-World Refactor Example

### Before: Debounced Search with Manual Cleanup

```typescript
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const timeoutRef = useRef<number | null>(null);
  
  const handleSearch = (value: string) => {
    setQuery(value);
    
    // ❌ Clear previous timeout manually
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    
    // ❌ Track new timeout
    timeoutRef.current = window.setTimeout(() => {
      performSearch(value).then(setResults);
      timeoutRef.current = null;
    }, 500);
  };
  
  // ❌ Manual cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <input 
      value={query} 
      onChange={e => handleSearch(e.target.value)} 
    />
  );
}
```

**Code:** 25 lines with timeout management

### After: With useSetTimeout

```typescript
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { setTimeout, clearTimeout } = useSetTimeout();
  const timeoutRef = useRef<TimeoutId | null>(null);
  
  const handleSearch = (value: string) => {
    setQuery(value);
    
    // ✅ Clear previous timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    
    // ✅ Set new timeout - auto cleanup on unmount
    timeoutRef.current = setTimeout(() => {
      performSearch(value).then(setResults);
      timeoutRef.current = null;
    }, 500);
  };
  
  // ✅ No manual cleanup needed!
  
  return (
    <input 
      value={query} 
      onChange={e => handleSearch(e.target.value)} 
    />
  );
}
```

**Code:** 16 lines (36% reduction), automatic cleanup

## Multiple Timeouts Example

```typescript
function StepWizard() {
  const [step, setStep] = useState(1);
  const { setTimeout } = useSetTimeout();
  
  const startWizard = useCallback(() => {
    // ✅ Set multiple timeouts - all cleaned up together
    setTimeout(() => setStep(2), 2000);
    setTimeout(() => setStep(3), 4000);
    setTimeout(() => setStep(4), 6000);
    setTimeout(() => setStep(5), 8000);
    
    // ✅ All automatically cleared if component unmounts
  }, [setTimeout]);
  
  return (
    <div>
      <h2>Step {step} of 5</h2>
      <button onClick={startWizard}>Start Wizard</button>
    </div>
  );
}
```

## Development Warnings

### Excessive Timeouts Warning

```typescript
function ProblematicComponent() {
  const { setTimeout } = useSetTimeout();
  
  useEffect(() => {
    // ⚠️ Creates 100 timeouts
    for (let i = 0; i < 100; i++) {
      setTimeout(() => console.log(i), i * 100);
    }
  }, [setTimeout]);
}
```

**Console output:**
```
useSetTimeout: High number of active timeouts (100). This may indicate 
a performance or memory issue. Consider reviewing timeout usage.
```

### Long Timeout Warning

```typescript
function LongDelayComponent() {
  const { setTimeout } = useSetTimeout();
  
  useEffect(() => {
    // ⚠️ Very long timeout (2 hours)
    setTimeout(() => {
      console.log('Finally!');
    }, 2 * 60 * 60 * 1000);
  }, [setTimeout]);
}
```

**Console output:**
```
useSetTimeout: Very long timeout set (7200000ms). Long-running timeouts 
may indicate incorrect duration or potential memory issues.
```

## API Reference

```typescript
type TimeoutId = ReturnType<typeof setTimeout>;

interface UseSetTimeoutReturnType {
  setTimeout: (callback: () => void, duration: number) => TimeoutId;
  clearTimeout: (id: TimeoutId) => void;
}

function useSetTimeout(): UseSetTimeoutReturnType
```

**Returns:**
- `setTimeout` - Create a timeout with automatic cleanup
- `clearTimeout` - Manually clear a specific timeout

## Implementation Highlights

```typescript
export const useSetTimeout = (): UseSetTimeoutReturnType => {
  // O(1) operations with Set
  const timeoutIds = useRef<Set<TimeoutId>>(new Set());
  
  // Cleanup all on unmount
  useEffect(() => {
    const currentTimeoutIds = timeoutIds.current;
    return () => {
      currentTimeoutIds.forEach(id => clearTimeout(id));
      currentTimeoutIds.clear();
    };
  }, []);
  
  return useMemo(() => ({
    setTimeout: (callback: () => void, duration: number): TimeoutId => {
      const id = window.setTimeout(() => {
        callback();
        timeoutIds.current.delete(id); // Auto-remove
      }, duration);
      
      timeoutIds.current.add(id);
      return id;
    },
    
    clearTimeout: (id: TimeoutId) => {
      window.clearTimeout(id);
      timeoutIds.current.delete(id);
    }
  }), []);
};
```

## Common Use Cases

### 1. Notifications/Toasts
```typescript
const { setTimeout } = useSetTimeout();

setTimeout(() => {
  hideNotification();
}, 3000);
```

### 2. Debouncing
```typescript
const { setTimeout, clearTimeout } = useSetTimeout();
const timeoutRef = useRef<TimeoutId | null>(null);

const debouncedSearch = (query: string) => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => search(query), 500);
};
```

### 3. Delayed Actions
```typescript
const { setTimeout } = useSetTimeout();

const handleSave = async () => {
  await save();
  setTimeout(() => {
    showSuccessMessage();
  }, 1000);
};
```

### 4. Animations
```typescript
const { setTimeout } = useSetTimeout();

const animateIn = () => {
  setPhase(1);
  setTimeout(() => setPhase(2), 100);
  setTimeout(() => setPhase(3), 200);
  setTimeout(() => setPhase(4), 300);
};
```

## Migration Guide

1. **Import useSetTimeout**:
   ```typescript
   import { useSetTimeout } from '@cascadiacollections/fluentui-compat';
   ```

2. **Replace setTimeout usage**:
   ```typescript
   // Before
   const timeoutId = setTimeout(() => {...}, 1000);
   
   // After
   const { setTimeout } = useSetTimeout();
   setTimeout(() => {...}, 1000);
   ```

3. **Remove manual cleanup code**:
   ```typescript
   // Before
   useEffect(() => {
     return () => clearTimeout(timeoutId);
   }, []);
   
   // After - no cleanup needed!
   ```

## Summary

The `useSetTimeout` hook provides:

- **100% memory leak prevention** - automatic cleanup guaranteed
- **36-60% less boilerplate code** compared to manual management
- **O(1) performance** with Set-based tracking
- **Development warnings** for excessive or long timeouts
- **Familiar API** - same as native setTimeout
- **Multiple timeout support** - manage many timeouts easily

Perfect for notifications, debouncing, delayed actions, animations, and any scenario requiring timeouts in React components. Eliminates the most common source of memory leaks in React applications.
