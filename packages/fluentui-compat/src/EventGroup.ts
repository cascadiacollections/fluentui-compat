import { getWindow } from "./getWindow";

/**
 * Event listener options that can be passed to addEventListener.
 * 
 * @public
 */
/* eslint-disable no-undef */
export type EventListenerOptions = boolean | AddEventListenerOptions;

/**
 * Interface for event targets that support addEventListener and removeEventListener.
 * 
 * @public
 */
export interface IEventTarget {
  addEventListener(eventName: string, callback: EventListener, options?: EventListenerOptions): void;
  removeEventListener(eventName: string, callback: EventListener, options?: EventListenerOptions): void;
}
/* eslint-enable no-undef */

/**
 * Internal representation of a registered event listener.
 * Stores all information needed to remove the listener later.
 * 
 * @internal
 */
/* eslint-disable no-undef */
interface IEventRecord {
  target: IEventTarget;
  eventName: string;
  callback: EventListener;
  options?: EventListenerOptions;
  parent?: any;
  objectCallback?: (...args: any[]) => void;
}
/* eslint-enable no-undef */

/**
 * Ultra-optimized EventGroup utility class for managing multiple event listeners.
 * 
 * This class provides centralized management of DOM event listeners with automatic cleanup
 * on disposal. It's particularly useful in React components for preventing memory leaks from
 * forgotten event listeners.
 * 
 * Key performance features:
 * - Efficient event tracking using Map for O(1) lookups
 * - Automatic cleanup of all listeners on dispose
 * - Support for both function callbacks and object methods
 * - Proper handling of event listener options
 * - Type-safe event management with TypeScript
 * - Window reference caching to reduce DOM queries
 * 
 * **Performance considerations**:
 * - Uses Map for O(1) event lookup and removal
 * - Minimal memory allocations per event
 * - Efficient batch cleanup on dispose
 * - No memory leaks from orphaned listeners
 * 
 * **React integration**:
 * While this class can be used directly, consider using `useOnEvent` hook for simpler
 * React integration that automatically handles cleanup via useEffect.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const events = new EventGroup(this);
 * 
 * events.on(window, 'resize', this.handleResize);
 * events.on(document, 'click', this.handleClick);
 * 
 * // Clean up all listeners
 * events.dispose();
 * ```
 * 
 * @example
 * ```typescript
 * // React class component usage
 * class MyComponent extends React.Component {
 *   private events = new EventGroup(this);
 *   
 *   componentDidMount() {
 *     this.events.on(window, 'resize', this.handleResize);
 *     this.events.on(document, 'keydown', this.handleKeyDown);
 *   }
 *   
 *   componentWillUnmount() {
 *     this.events.dispose();
 *   }
 *   
 *   handleResize = () => {
 *     console.log('Window resized');
 *   };
 *   
 *   handleKeyDown = (event: KeyboardEvent) => {
 *     console.log('Key pressed:', event.key);
 *   };
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Multiple events on same target
 * const events = new EventGroup();
 * 
 * events.on(element, 'mousedown', handleMouseDown);
 * events.on(element, 'mouseup', handleMouseUp);
 * events.on(element, 'mousemove', handleMouseMove);
 * 
 * // Remove specific event
 * events.off(element, 'mousemove');
 * 
 * // Remove all events on target
 * events.off(element);
 * 
 * // Remove all events
 * events.dispose();
 * ```
 * 
 * @example
 * ```typescript
 * // With event listener options
 * const events = new EventGroup();
 * 
 * // Passive scroll listener for better performance
 * events.on(window, 'scroll', handleScroll, { passive: true });
 * 
 * // Capture phase event
 * events.on(document, 'click', handleClick, true);
 * 
 * // Once option - automatically removed after first call
 * events.on(button, 'click', handleClick, { once: true });
 * ```
 * 
 * @example
 * ```typescript
 * // Conditional event management
 * const events = new EventGroup(this);
 * 
 * if (isMobile) {
 *   events.on(element, 'touchstart', handleTouchStart);
 *   events.on(element, 'touchend', handleTouchEnd);
 * } else {
 *   events.on(element, 'mousedown', handleMouseDown);
 *   events.on(element, 'mouseup', handleMouseUp);
 * }
 * 
 * // All events cleaned up regardless of which were added
 * events.dispose();
 * ```
 * 
 * @see {@link useOnEvent} for a React hook alternative
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener | addEventListener on MDN}
 * 
 * @public
 */
export class EventGroup {
  /** 
   * Map of event records for efficient lookup and removal.
   * Uses compound key of target + eventName for O(1) lookups.
   * @internal
   */
  private _eventRecords = new Map<string, IEventRecord[]>();
  
  /** 
   * Flag indicating whether this instance has been disposed.
   * @internal
   */
  private _isDisposed = false;
  
  /** 
   * Reference to parent object for callback context binding.
   * @internal
   */
  private _parent: any;
  
  /** 
   * Cached window reference to reduce DOM queries.
   * @internal
   */
  private _cachedWindow: Window | null = null;
  
  /** 
   * Timestamp when window was last cached.
   * @internal
   */
  private _windowCacheTimestamp = 0;
  
  /** 
   * Window cache time-to-live in milliseconds.
   * @internal
   */
  private static readonly WINDOW_CACHE_TTL_MS = 1000;
  
  /**
   * Counter for generating unique IDs for anonymous targets.
   * Ensures Map keys are unique even for targets without native identity.
   * @internal
   */
  private static _uniqueId = 0;
  
  /**
   * WeakMap storing unique IDs for event targets.
   * Prevents memory leaks by allowing garbage collection.
   * @internal
   */
  private static _targetIds = new WeakMap<object, number>();

  /**
   * Creates a new EventGroup instance.
   * 
   * @param parent - Optional parent object to bind as 'this' context in callbacks
   */
  constructor(parent?: any) {
    this._parent = parent;
  }

  /**
   * Gets a cached window reference or retrieves a fresh one if cache is stale.
   * This optimization reduces repeated DOM queries for window access.
   * 
   * @param targetElement - Optional element to determine the correct window context
   * @returns The window object or null if unavailable
   * @internal
   */
  private _getCachedWindow(targetElement?: Element | null): Window | null {
    const currentTime = performance.now();
    
    // Return cached window if still valid
    if (this._cachedWindow && 
        (currentTime - this._windowCacheTimestamp) < EventGroup.WINDOW_CACHE_TTL_MS) {
      return this._cachedWindow;
    }
    
    // Refresh cache with new window reference
    this._cachedWindow = getWindow(targetElement) ?? null;
    this._windowCacheTimestamp = currentTime;
    
    return this._cachedWindow;
  }

  /**
   * Generates a unique identifier for an event target.
   * Uses WeakMap to avoid memory leaks while providing stable IDs.
   * 
   * @param target - The event target to get an ID for
   * @returns A unique numeric ID for the target
   * @internal
   */
  private _getTargetId(target: any): number {
    let id = EventGroup._targetIds.get(target);
    if (id === undefined) {
      id = ++EventGroup._uniqueId;
      EventGroup._targetIds.set(target, id);
    }
    return id;
  }

  /**
   * Generates a unique key for storing event records in the Map.
   * Combines target ID and event name for efficient lookup.
   * 
   * @param target - The event target
   * @param eventName - The event name
   * @returns A unique string key for this target/event combination
   * @internal
   */
  private _getEventKey(target: any, eventName: string): string {
    const targetId = this._getTargetId(target);
    return `${targetId}:${eventName}`;
  }

  /**
   * Adds an event listener to the specified target.
   * 
   * This method registers an event listener and tracks it for automatic cleanup.
   * Multiple listeners can be added to the same target/event combination.
   * 
   * @param target - The event target (element, window, document, etc.)
   * @param eventName - The name of the event to listen for
   * @param callback - The callback function to invoke when the event fires
   * @param options - Optional event listener options (capture, passive, once, etc.)
   * @returns This EventGroup instance for method chaining
   * 
   * @public
   */
  /* eslint-disable no-undef */
  public on(
    target: IEventTarget,
    eventName: string,
    callback: EventListener | ((...args: any[]) => void),
    options?: EventListenerOptions
  ): EventGroup {
    /* eslint-enable no-undef */
    // Validate that instance is not disposed
    if (this._isDisposed) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('EventGroup: Attempted to add event listener to disposed instance.');
      }
      return this;
    }

    // Validate inputs
    if (!target || !eventName || !callback) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('EventGroup: Invalid arguments provided to on() method.');
      }
      return this;
    }

    let objectCallback: any;
    let eventCallback: EventListener; // eslint-disable-line no-undef

    // Handle method binding for parent context
    if (typeof callback === 'function' && this._parent) {
      objectCallback = callback;
      // eslint-disable-next-line no-undef
      eventCallback = this._callbackWrapper.bind(this, objectCallback) as EventListener;
    } else {
      // eslint-disable-next-line no-undef
      eventCallback = callback as EventListener;
    }

    // Create event record for tracking
    const eventRecord: IEventRecord = {
      target,
      eventName,
      callback: eventCallback,
      options,
      parent: this._parent,
      objectCallback,
    };

    // Get or create array of records for this target/event combination
    const eventKey = this._getEventKey(target, eventName);
    let records = this._eventRecords.get(eventKey);
    
    if (!records) {
      records = [];
      this._eventRecords.set(eventKey, records);
    }
    
    records.push(eventRecord);

    // Actually attach the event listener
    target.addEventListener(eventName, eventCallback, options);

    return this;
  }

  /**
   * Removes event listeners from the specified target.
   * 
   * This method can remove:
   * - All events from a target (if only target is provided)
   * - All events of a specific type from a target (if target and eventName provided)
   * - A specific event listener (if all parameters provided)
   * 
   * @param target - The event target to remove listeners from
   * @param eventName - Optional event name to filter removal
   * @param callback - Optional specific callback to remove
   * @param options - Optional event listener options that match the original registration
   * @returns This EventGroup instance for method chaining
   * 
   * @public
   */
  /* eslint-disable no-undef */
  public off(
    target?: IEventTarget,
    eventName?: string,
    callback?: EventListener | ((...args: any[]) => void),
    options?: EventListenerOptions
  ): EventGroup {
    /* eslint-enable no-undef */
    if (this._isDisposed) {
      return this;
    }

    // If no target specified, remove all events
    if (!target) {
      this.dispose();
      return this;
    }

    // Build list of keys to process
    const keysToProcess: string[] = [];
    
    if (eventName) {
      // Specific event name - only process that key
      keysToProcess.push(this._getEventKey(target, eventName));
    } else {
      // No event name - process all events for this target
      const targetId = this._getTargetId(target);
      for (const key of this._eventRecords.keys()) {
        if (key.startsWith(`${targetId}:`)) {
          keysToProcess.push(key);
        }
      }
    }

    // Process each key
    for (const key of keysToProcess) {
      const records = this._eventRecords.get(key);
      if (!records) {
        continue;
      }

      // Filter records to find ones to remove
      const recordsToRemove = records.filter((record) => {
        // Must match target
        if (record.target !== target) {
          return false;
        }
        
        // Must match event name if specified
        if (eventName && record.eventName !== eventName) {
          return false;
        }
        
        // Must match callback if specified
        if (callback) {
          // Check both the wrapped callback and the original object callback
          if (record.objectCallback) {
            if (record.objectCallback !== callback) {
              return false;
            }
          } else if (record.callback !== callback) {
            return false;
          }
        }
        
        // Must match options if specified
        if (options !== undefined && record.options !== options) {
          return false;
        }
        
        return true;
      });

      // Remove matched records
      if (recordsToRemove.length > 0) {
        // Remove listeners from DOM
        for (const record of recordsToRemove) {
          record.target.removeEventListener(record.eventName, record.callback, record.options);
        }

        // Remove from tracking
        if (recordsToRemove.length === records.length) {
          // All records removed - delete the key
          this._eventRecords.delete(key);
        } else {
          // Some records remain - filter them out
          const remainingRecords = records.filter((r) => !recordsToRemove.includes(r));
          this._eventRecords.set(key, remainingRecords);
        }
      }
    }

    return this;
  }

  /**
   * Wrapper function that provides proper 'this' context binding for callbacks.
   * 
   * @param callback - The original callback function
   * @param args - Arguments to pass to the callback
   * @internal
   */
  private _callbackWrapper(callback: (...args: any[]) => void, ...args: any[]): void {
    if (this._isDisposed) {
      return;
    }

    try {
      callback.apply(this._parent, args);
    } catch (error) {
      // Re-throw errors but ensure they don't break event handling
      if (process.env.NODE_ENV === 'development') {
        console.error('EventGroup: Error in event callback:', error);
      }
      throw error;
    }
  }

  /**
   * Raises a synthetic event by invoking all registered callbacks for the specified event.
   * 
   * This method can be used to programmatically trigger events without actually firing
   * them on the DOM. Useful for testing and custom event patterns.
   * 
   * @param eventName - The name of the event to raise
   * @param eventArgs - Optional event object or arguments to pass to callbacks
   * @returns This EventGroup instance for method chaining
   * 
   * @public
   */
  public raise(eventName: string, eventArgs?: Event | any): EventGroup {
    if (this._isDisposed) {
      return this;
    }

    // Process all event records
    for (const records of this._eventRecords.values()) {
      for (const record of records) {
        if (record.eventName === eventName) {
          try {
            record.callback.call(record.target, eventArgs);
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`EventGroup: Error raising event "${eventName}":`, error);
            }
          }
        }
      }
    }

    return this;
  }

  /**
   * Declares an event that this group will manage.
   * 
   * This is a no-op method for API compatibility with FluentUI's EventGroup.
   * In the original implementation, this was used for TypeScript type checking,
   * but modern TypeScript doesn't require this pattern.
   * 
   * @param _hasEventName - Event declaration object (unused)
   * @returns This EventGroup instance for method chaining
   * 
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  public declare(_hasEventName: { eventName: string }): EventGroup {
    // No-op for compatibility
    return this;
  }

  /**
   * Disposes of the EventGroup instance and removes all registered event listeners.
   * 
   * This method should be called when the EventGroup is no longer needed to prevent
   * memory leaks. It will remove all event listeners and clear internal tracking.
   * After disposal, the instance cannot be reused.
   * 
   * @public
   */
  public dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;

    // Remove all event listeners
    for (const records of this._eventRecords.values()) {
      for (const record of records) {
        try {
          record.target.removeEventListener(record.eventName, record.callback, record.options);
        } catch (error) {
          // Ignore errors during cleanup
          if (process.env.NODE_ENV === 'development') {
            console.warn('EventGroup: Error removing event listener during disposal:', error);
          }
        }
      }
    }

    // Clear all tracking
    this._eventRecords.clear();
    
    // Clear object references to help garbage collection
    this._parent = undefined;
    this._cachedWindow = null;
  }
}
