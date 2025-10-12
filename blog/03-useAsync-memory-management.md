# Preventing Memory Leaks with useAsync: A Deep Dive

## The Hidden Memory Leak Problem in React

Picture this: You've built a beautiful React component with a search box that debounces input. You ship it to production, and everything works great... until users start reporting that the app gets slower over time. What's happening?

You might have a **memory leak**.

Memory leaks in React often come from async operations - setTimeout, setInterval, fetch requests, WebSocket connections - that aren't properly cleaned up when components unmount. Let's explore how **useAsync** from fluentui-compat solves this problem elegantly.

## The Problem: Async Operations Without Cleanup

Here's a common pattern that looks innocent but has a critical bug:

```typescript
import { useState } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSearch = (value) => {
    setQuery(value);
    
    // Debounce the search
    setTimeout(() => {
      fetch(`/api/search?q=${value}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300);
  };
  
  return (
    <input 
      value={query}
      onChange={(e) => handleSearch(e.target.value)} 
    />
  );
}
```

### What's Wrong?

1. **Memory Leak**: If the user types quickly, multiple timeouts are created but never cancelled
2. **Race Condition**: The last API call might not be the last to complete, showing wrong results
3. **State Update After Unmount**: If the component unmounts before the API returns, you'll get the infamous "Can't perform a React state update on an unmounted component" warning
4. **No Cleanup**: Nothing cancels pending operations when the component is destroyed

## The Traditional Solution (Verbose and Error-Prone)

The React way to solve this is with useEffect cleanup:

```typescript
import { useState, useEffect, useRef } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const handleSearch = (value) => {
    setQuery(value);
    
    // Cancel previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    timeoutRef.current = setTimeout(() => {
      abortControllerRef.current = new AbortController();
      
      fetch(`/api/search?q=${value}`, {
        signal: abortControllerRef.current.signal
      })
        .then(res => res.json())
        .then(data => setResults(data))
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error(err);
          }
        });
    }, 300);
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return (
    <input 
      value={query}
      onChange={(e) => handleSearch(e.target.value)} 
    />
  );
}
```

This works, but:
- **45 lines of code** for what should be simple
- **Easy to forget** cleanup logic
- **Multiple refs** to manage
- **Repetitive** across components

## Enter useAsync: Automatic Cleanup Made Simple

The **useAsync** hook provides a clean, simple API that handles all cleanup automatically:

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useState } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const async = useAsync();
  
  const handleSearch = (value) => {
    setQuery(value);
    
    // Automatically cancels previous timeout
    async.setTimeout(() => {
      fetch(`/api/search?q=${value}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300);
  };
  
  // All async operations automatically cleaned up on unmount!
  return (
    <input 
      value={query}
      onChange={(e) => handleSearch(e.target.value)} 
    />
  );
}
```

**That's it.** Just 17 lines instead of 45, and all cleanup is automatic.

## How useAsync Works Under the Hood

useAsync leverages the `Async` utility class from `@fluentui/utilities` and wraps it in a React hook:

```typescript
import { useRef, useEffect } from 'react';
import { Async } from '@fluentui/utilities';

export function useAsync() {
  const asyncRef = useRef<Async>();
  
  if (!asyncRef.current) {
    asyncRef.current = new Async();
  }
  
  useEffect(() => {
    // Cleanup all pending operations on unmount
    return () => {
      asyncRef.current?.dispose();
    };
  }, []);
  
  return asyncRef.current;
}
```

The `Async` class internally:
1. **Tracks all operations** (timeouts, intervals, animation frames, etc.)
2. **Cancels previous operations** when you call the same method again
3. **Cleans up everything** when `dispose()` is called

## API Overview

useAsync provides wrapped versions of common async APIs:

### setTimeout

```typescript
const async = useAsync();

// Automatically cancels previous timeout
async.setTimeout(() => {
  console.log('Executed after delay');
}, 1000);
```

### setInterval

```typescript
const async = useAsync();

// Automatically cleans up on unmount
async.setInterval(() => {
  console.log('Recurring task');
}, 5000);
```

### requestAnimationFrame

```typescript
const async = useAsync();

async.requestAnimationFrame(() => {
  console.log('Next animation frame');
});
```

### debounce

```typescript
const async = useAsync();

const debouncedSearch = async.debounce((query) => {
  performSearch(query);
}, 300);

// Call multiple times, only executes once after delay
debouncedSearch('react');
debouncedSearch('react hooks');
debouncedSearch('react hooks async');
```

### throttle

```typescript
const async = useAsync();

const throttledScroll = async.throttle(() => {
  updateScrollPosition();
}, 100);

// Executes at most once per 100ms
window.addEventListener('scroll', throttledScroll);
```

## Real-World Examples

### 1. Debounced Search Input

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useState } from 'react';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const async = useAsync();
  
  const handleSearch = (value) => {
    setQuery(value);
    setLoading(true);
    
    async.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${value}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
  };
  
  return (
    <div>
      <input 
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {loading && <div>Loading...</div>}
      <SearchResults results={results} />
    </div>
  );
}
```

### 2. Auto-Save Draft

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useState, useCallback } from 'react';

function DraftEditor({ draftId }) {
  const [content, setContent] = useState('');
  const async = useAsync();
  
  const saveDraft = useCallback((text) => {
    // Automatically cancels previous save
    async.setTimeout(async () => {
      await fetch(`/api/drafts/${draftId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: text }),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Draft saved');
    }, 2000); // Save 2 seconds after user stops typing
  }, [async, draftId]);
  
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    saveDraft(newContent);
  };
  
  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Start writing..."
    />
  );
}
```

### 3. Polling for Updates

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useState, useEffect } from 'react';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const async = useAsync();
  
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const response = await fetch('/api/notifications/unread');
        const data = await response.json();
        setUnreadCount(data.count);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    
    // Poll every 30 seconds
    async.setInterval(pollNotifications, 30000);
    
    // Initial fetch
    pollNotifications();
    
    // Cleanup automatically happens on unmount!
  }, [async]);
  
  return (
    <button>
      🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
    </button>
  );
}
```

### 4. Animated Loading Spinner

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useState, useEffect } from 'react';

function LoadingSpinner() {
  const [rotation, setRotation] = useState(0);
  const async = useAsync();
  
  useEffect(() => {
    const animate = () => {
      setRotation(prev => (prev + 5) % 360);
      async.requestAnimationFrame(animate);
    };
    
    animate();
    // Animation automatically stops on unmount!
  }, [async]);
  
  return (
    <div 
      className="spinner"
      style={{ transform: `rotate(${rotation}deg)` }}
    />
  );
}
```

## Development Mode Warnings

useAsync includes helpful warnings in development mode to catch common mistakes:

```typescript
function ProblemComponent() {
  const async = useAsync();
  
  // ⚠️ Warning: Setting timeout after component likely unmounted
  setTimeout(() => {
    async.setTimeout(() => {
      console.log('This might not work as expected');
    }, 1000);
  }, 5000);
  
  return <div>Component</div>;
}
```

The warning helps you catch potential race conditions where you're trying to use async after the component may have unmounted.

## Performance Characteristics

useAsync is designed for minimal overhead:

- **Stable Reference**: The returned `async` object never changes between renders, preventing unnecessary re-renders
- **Single Async Instance**: Only one Async instance is created per component
- **Efficient Cleanup**: O(1) cleanup regardless of how many operations were queued
- **Zero Dependencies**: useAsync has no external dependencies beyond @fluentui/utilities

## Best Practices

### 1. Use with useCallback for Event Handlers

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useCallback } from 'react';

function Component() {
  const async = useAsync();
  
  // ✅ Good: async is stable, so callback is stable
  const handleClick = useCallback(() => {
    async.setTimeout(() => {
      console.log('Delayed action');
    }, 1000);
  }, [async]);
  
  return <button onClick={handleClick}>Click</button>;
}
```

### 2. Combine with AbortController for Fetch

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useRef } from 'react';

function DataFetcher() {
  const async = useAsync();
  const abortControllerRef = useRef();
  
  const fetchData = (query) => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    async.setTimeout(async () => {
      try {
        const response = await fetch(`/api/data?q=${query}`, {
          signal: abortControllerRef.current.signal
        });
        const data = await response.json();
        setData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }, 300);
  };
  
  return <SearchBox onSearch={fetchData} />;
}
```

### 3. Extract Custom Hooks

Create reusable hooks for common patterns:

```typescript
import { useAsync } from '@cascadiacollections/fluentui-compat';
import { useState, useCallback } from 'react';

function useDebounced(callback, delay) {
  const async = useAsync();
  
  return useCallback((...args) => {
    async.setTimeout(() => {
      callback(...args);
    }, delay);
  }, [async, callback, delay]);
}

// Usage
function SearchComponent() {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useDebounced((value) => {
    performSearch(value);
  }, 300);
  
  return (
    <input 
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

## Comparison with Other Solutions

### vs useEffect Cleanup

**useEffect cleanup:**
- ✅ Built-in React feature
- ❌ Verbose for multiple async operations
- ❌ Easy to forget cleanup
- ❌ Need separate refs for each operation

**useAsync:**
- ✅ Automatic cleanup
- ✅ One line per operation
- ✅ Handles multiple operations
- ✅ Impossible to forget cleanup

### vs react-use/useDebounce

**react-use:**
- ✅ Specialized hooks for specific patterns
- ❌ Need different hook for each pattern
- ❌ Larger bundle size (includes many hooks)

**useAsync:**
- ✅ Single hook for all async patterns
- ✅ Smaller bundle size
- ✅ Flexible API
- ✅ Matches FluentUI patterns

## Migration Guide

**Before (using raw setTimeout):**
```typescript
const [timer, setTimer] = useState(null);

useEffect(() => {
  return () => {
    if (timer) clearTimeout(timer);
  };
}, [timer]);

const handleClick = () => {
  const id = setTimeout(() => {
    doSomething();
  }, 1000);
  setTimer(id);
};
```

**After (using useAsync):**
```typescript
const async = useAsync();

const handleClick = () => {
  async.setTimeout(() => {
    doSomething();
  }, 1000);
};
```

## What's Next?

In our next post, we'll explore the **modernization journey** of fluentui-compat:
- How we leveraged Rush Stack tools for enterprise-grade development
- API Extractor for documentation generation
- The power of monorepo architecture
- DevContainer setup for instant development environments

## Get Started Today

Ready to eliminate memory leaks from your React apps?

```bash
npm install @cascadiacollections/fluentui-compat
```

Check out the [full API documentation](https://cascadiacollections.github.io/fluentui-compat/) for more details.

---

*Have you encountered memory leaks in your React applications? Share your experiences in the comments below!*
