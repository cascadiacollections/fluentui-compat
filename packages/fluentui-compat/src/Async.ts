import { getWindow } from "./getWindow";

declare function setTimeout(callback: Function, delay: number): number;
declare function setInterval(callback: Function, delay: number): number;

/**
 * A no-operation function that serves as a safe fallback for disposed instances.
 * Using a constant prevents repeated function allocations and improves memory efficiency.
 */
const NOOP = (): void => { /* intentionally empty */ };

/**
 * Pre-frozen empty array to prevent unnecessary allocations when no arguments are provided.
 * This optimization reduces garbage collection pressure in frequently called functions.
 */
const EMPTY_ARRAY: readonly any[] = Object.freeze([]);

/**
 * Efficient ID pool manager that reuses numeric identifiers to reduce memory allocation overhead.
 * This is particularly beneficial when creating/destroying many short-lived timers.
 * 
 * @internal
 */
class AsyncIdPool {
  /** Pool of reusable IDs to minimize memory allocations */
  private static readonly _idPool: number[] = [];
  
  /** Incrementing counter for generating unique IDs when pool is empty */
  private static _idCounter = 0;
  
  /** Maximum pool size to prevent unbounded memory growth */
  private static readonly MAX_POOL_SIZE = 100;
  
  /**
   * Retrieves an ID from the pool or generates a new one if pool is empty.
   * @returns A unique numeric identifier
   */
  static acquire(): number {
    return this._idPool.pop() ?? ++this._idCounter;
  }
  
  /**
   * Returns an ID to the pool for reuse, unless pool is at capacity.
   * @param id - The ID to return to the pool
   */
  static release(id: number): void {
    if (this._idPool.length < this.MAX_POOL_SIZE) {
      this._idPool.push(id);
    }
  }
}

/**
 * Centralized timer management system that provides batch operations and efficient cleanup.
 * This reduces system calls and improves performance when managing multiple timers.
 * 
 * @internal
 */
class AsyncTimerManager {
  /** Map of timer IDs to their cleanup functions */
  private readonly _activeTimers = new Map<number, () => void>();
  
  /** Batch clear operation timeout ID */
  private _batchClearTimeoutId: number | null = null;
  
  /** Set of timer IDs pending batch removal */
  private readonly _pendingRemovals = new Set<number>();
  
  /**
   * Registers a timer with its cleanup function.
   * @param timerId - Unique identifier for the timer
   * @param cleanupFunction - Function to call when clearing this timer
   */
  addTimer(timerId: number, cleanupFunction: () => void): void {
    this._activeTimers.set(timerId, cleanupFunction);
  }
  
  /**
   * Immediately removes and cleans up a specific timer.
   * @param timerId - The timer ID to remove
   * @returns true if timer was found and removed, false otherwise
   */
  removeTimer(timerId: number): boolean {
    const cleanupFunction = this._activeTimers.get(timerId);
    if (cleanupFunction) {
      this._activeTimers.delete(timerId);
      cleanupFunction();
      return true;
    }
    return false;
  }
  
  /**
   * Schedules a timer for batch removal to improve performance when removing many timers.
   * This reduces the number of immediate cleanup operations.
   * @param timerId - The timer ID to schedule for removal
   */
  scheduleTimerRemoval(timerId: number): void {
    this._pendingRemovals.add(timerId);
    
    // Schedule batch processing if not already scheduled
    if (this._batchClearTimeoutId === null) {
      this._batchClearTimeoutId = setTimeout(() => {
        this._processBatchRemovals();
      }, 0);
    }
  }
  
  /**
   * Processes all pending timer removals in a single batch operation.
   * @internal
   */
  private _processBatchRemovals(): void {
    for (const pendingTimerId of this._pendingRemovals) {
      this.removeTimer(pendingTimerId);
    }
    this._pendingRemovals.clear();
    this._batchClearTimeoutId = null;
  }
  
  /**
   * Clears all active timers and cancels any pending batch operations.
   * Called during instance disposal.
   */
  clearAllTimers(): void {
    // Cancel pending batch operation
    if (this._batchClearTimeoutId !== null) {
      clearTimeout(this._batchClearTimeoutId);
      this._batchClearTimeoutId = null;
    }
    
    // Clean up all active timers
    for (const cleanupFunction of this._activeTimers.values()) {
      cleanupFunction();
    }
    
    // Clear all collections
    this._activeTimers.clear();
    this._pendingRemovals.clear();
  }
  
  /**
   * Gets the current number of active timers.
   * Useful for debugging and performance monitoring.
   */
  get activeTimerCount(): number {
    return this._activeTimers.size;
  }
}

/**
 * Performance metrics interface for development-time monitoring.
 * Tracks usage patterns to help identify performance bottlenecks.
 */
interface AsyncPerformanceMetrics {
  /** Number of setTimeout calls made */
  timeoutCount: number;
  
  /** Number of setInterval calls made */
  intervalCount: number;
  
  /** Number of requestAnimationFrame calls made */
  animationFrameCount: number;
  
  /** Number of throttle functions created */
  throttleCount: number;
  
  /** Number of debounce functions created */
  debounceCount: number;
}

/**
 * WeakMap for storing performance metrics without affecting garbage collection.
 * Only active in development mode to avoid production overhead.
 */
const developmentMetrics = new WeakMap<Async, AsyncPerformanceMetrics>();

/**
 * Options for throttle function behavior configuration.
 */
interface ThrottleOptions {
  /** Whether to execute on the leading edge of the timeout (default: true) */
  leading?: boolean;
  
  /** Whether to execute on the trailing edge of the timeout (default: true) */
  trailing?: boolean;
}

/**
 * Options for debounce function behavior configuration.
 */
interface DebounceOptions {
  /** Whether to execute on the leading edge of the timeout (default: false) */
  leading?: boolean;
  
  /** Maximum time function can be delayed before forced execution */
  maxWait?: number;
  
  /** Whether to execute on the trailing edge of the timeout (default: true) */
  trailing?: boolean;
}

/**
 * Interface for cancelable functions returned by debounce.
 * Provides additional control over the debounced function execution.
 */
export interface ICancelable<T extends (...args: any[]) => any> {
  /** Immediately executes the function and returns its result */
  flush: () => ReturnType<T>;
  
  /** Cancels any pending execution */
  cancel: () => void;
  
  /** Returns true if the function is currently pending execution */
  pending: () => boolean;
}

/**
 * Ultra-optimized Async utility class designed for high-performance React applications.
 * 
 * This class provides memory-efficient management of asynchronous operations with automatic
 * cleanup on disposal. It's particularly useful for preventing memory leaks in React components
 * where async operations might continue after component unmounting.
 * 
 * Key performance features:
 * - ID pooling to reduce memory allocations
 * - Batch timer operations to minimize system calls
 * - Window reference caching to reduce DOM queries
 * - Optimized state management in throttle/debounce functions
 * - Development-time performance monitoring
 * 
 * @example
 * ```typescript
 * const asyncManager = new Async(this, (error) => console.error(error));
 * 
 * // All of these will be automatically cleaned up on dispose
 * asyncManager.setTimeout(() => console.log('Hello'), 1000);
 * asyncManager.setInterval(() => console.log('Tick'), 500);
 * 
 * const throttledFn = asyncManager.throttle(expensiveFunction, 100);
 * const debouncedFn = asyncManager.debounce(searchFunction, 300);
 * 
 * // Clean up all async operations
 * asyncManager.dispose();
 * ```
 * 
 * @public
 */
export class Async {
  /** Centralized manager for all timer operations */
  private readonly _timerManager = new AsyncTimerManager();
  
  /** Flag indicating whether this instance has been disposed */
  private _isDisposed = false;
  
  /** Reference to parent object for callback context binding */
  private _parent: object | null;
  
  /** Optional error handler for async operation failures */
  private _onErrorHandler: ((error: any) => void) | undefined;
  
  /** Cached window reference to reduce DOM queries */
  private _cachedWindow: Window | null = null;
  
  /** Timestamp when window was last cached */
  private _windowCacheTimestamp = 0;
  
  /** Window cache time-to-live in milliseconds */
  private static readonly WINDOW_CACHE_TTL_MS = 1000;
  
  /**
   * Creates a new Async instance.
   * 
   * @param parent - Optional parent object to bind as 'this' context in callbacks
   * @param onError - Optional error handler for exceptions in async callbacks
   */
  constructor(parent?: object, onError?: (error: any) => void) {
    this._parent = parent || null;
    this._onErrorHandler = onError;
    
    // Initialize performance tracking in development builds
    if (process.env.NODE_ENV === 'development') {
      developmentMetrics.set(this, {
        timeoutCount: 0,
        intervalCount: 0,
        animationFrameCount: 0,
        throttleCount: 0,
        debounceCount: 0,
      });
    }
  }

  /**
   * Disposes of the Async instance and cleans up all associated resources.
   * 
   * This method should be called when the instance is no longer needed to prevent
   * memory leaks. It will cancel all pending timers, intervals, and animation frames.
   * 
   * @public
   */
  public dispose(): void {
    // Prevent double disposal
    if (this._isDisposed) {
      return;
    }
    
    this._isDisposed = true;
    
    // Clear object references to help garbage collection
    this._parent = null;
    this._onErrorHandler = undefined;
    this._cachedWindow = null;
    
    // Perform batch cleanup of all timers
    this._timerManager.clearAllTimers();
    
    // Remove development metrics to prevent memory leaks
    if (process.env.NODE_ENV === 'development') {
      developmentMetrics.delete(this);
    }
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
        (currentTime - this._windowCacheTimestamp) < Async.WINDOW_CACHE_TTL_MS) {
      return this._cachedWindow;
    }
    
    // Refresh cache with new window reference
    this._cachedWindow = getWindow(targetElement) ?? null;
    this._windowCacheTimestamp = currentTime;
    
    return this._cachedWindow;
  }

  /**
   * High-performance setTimeout implementation with automatic cleanup and memory pooling.
   * 
   * Provides the same API as the native setTimeout but with enhanced memory management
   * and automatic cleanup when the Async instance is disposed.
   * 
   * @param callback - Function to execute after the specified delay
   * @param duration - Delay in milliseconds before executing the callback
   * @returns Timer ID that can be used with clearTimeout
   * 
   * @public
   */
  public setTimeout(callback: () => void, duration: number): number {
    // Return immediately if instance is disposed
    if (this._isDisposed) {
      return 0;
    }
    
    // Get a reusable internal ID for tracking
    const internalTrackingId = AsyncIdPool.acquire();
    let nativeTimeoutId: number;
    
    /**
     * Wrapper function that handles cleanup and error handling.
     * This approach ensures proper cleanup even if the callback throws.
     */
    const wrappedCallback = (): void => {
      // Schedule cleanup using batch operations for performance
      this._timerManager.scheduleTimerRemoval(internalTrackingId);
      
      // Return ID to pool for reuse
      AsyncIdPool.release(internalTrackingId);
      
      try {
        // Execute callback with proper context binding
        callback.call(this._parent);
      } catch (error) {
        this._logError(error);
      }
    };
    
    // Create the actual native timer
    nativeTimeoutId = setTimeout(wrappedCallback, duration);
    
    // Register with timer manager for cleanup tracking
    this._timerManager.addTimer(internalTrackingId, () => clearTimeout(nativeTimeoutId));
    
    // Track performance metrics in development mode
    this._incrementDevelopmentMetric('timeoutCount');
    
    return nativeTimeoutId;
  }

  /**
   * Clears a timeout created by this instance's setTimeout method.
   * 
   * @param timerId - The timer ID returned by setTimeout
   * @public
   */
  public clearTimeout(timerId: number): void {
    this._timerManager.removeTimer(timerId);
  }

  /**
   * Optimized setImmediate implementation that uses setTimeout(0) with window caching.
   * 
   * Provides cross-browser compatibility for immediate execution scheduling.
   * 
   * @param callback - Function to execute immediately
   * @param targetElement - Optional element to determine window context
   * @returns Timer ID for the immediate execution
   * 
   * @public
   */
  public setImmediate(callback: () => void, targetElement?: Element | null): number {
    if (this._isDisposed) {
      return 0;
    }
    
    // Verify window availability before proceeding
    const windowContext = this._getCachedWindow(targetElement);
    if (!windowContext) {
      return 0;
    }
    
    // Use setTimeout with 0 delay for immediate execution
    return this.setTimeout(callback, 0);
  }

  /**
   * Clears an immediate execution created by setImmediate.
   * 
   * @param timerId - The timer ID returned by setImmediate
   * @param targetElement - Optional element for window context (unused but maintained for API compatibility)
   * @public
   */
  // eslint-disable-next-line no-unused-vars
  public clearImmediate(timerId: number, targetElement?: Element | null): void {
    this.clearTimeout(timerId);
  }

  /**
   * High-performance setInterval implementation with enhanced tracking and cleanup.
   * 
   * @param callback - Function to execute repeatedly
   * @param duration - Interval duration in milliseconds
   * @returns Interval ID that can be used with clearInterval
   * 
   * @public
   */
  public setInterval(callback: () => void, duration: number): number {
    if (this._isDisposed) {
      return 0;
    }
    
    const internalTrackingId = AsyncIdPool.acquire();
    let nativeIntervalId: number;
    
    /**
     * Wrapper that adds error handling to interval callbacks.
     * Note: Intervals don't auto-cleanup like timeouts, so no removal scheduling needed.
     */
    const wrappedCallback = (): void => {
      try {
        callback.call(this._parent);
      } catch (error) {
        this._logError(error);
      }
    };
    
    nativeIntervalId = setInterval(wrappedCallback, duration);
    
    // Register cleanup function that handles both native cleanup and ID recycling
    this._timerManager.addTimer(internalTrackingId, () => {
      clearInterval(nativeIntervalId);
      AsyncIdPool.release(internalTrackingId);
    });
    
    this._incrementDevelopmentMetric('intervalCount');
    
    return nativeIntervalId;
  }

  /**
   * Clears an interval created by this instance's setInterval method.
   * 
   * @param intervalId - The interval ID returned by setInterval
   * @public
   */
  public clearInterval(intervalId: number): void {
    this._timerManager.removeTimer(intervalId);
  }

  /**
   * Creates an ultra-optimized throttle function with minimal memory allocations.
   * 
   * Throttling limits function execution to at most once per specified time period.
   * This is useful for performance-critical events like scroll or resize handlers.
   * 
   * @param func - The function to throttle
   * @param wait - Minimum time between executions in milliseconds (default: 0)
   * @param options - Configuration options for throttle behavior
   * @returns Throttled version of the input function
   * 
   * @public
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    wait = 0,
    options?: ThrottleOptions
  ): T {
    if (this._isDisposed) {
      return NOOP as T;
    }
    
    const enableLeadingExecution = options?.leading ?? true;
    const enableTrailingExecution = options?.trailing ?? true;
    
    /**
     * Consolidated state object for better memory layout and cache performance.
     * Using a single object reduces pointer chasing and improves CPU cache efficiency.
     */
    const throttleState = {
      lastExecutionTime: 0,
      lastResult: undefined as ReturnType<T>,
      lastArguments: EMPTY_ARRAY as readonly any[],
      pendingTimeoutId: null as number | null,
    };
    
    /**
     * Core throttle logic that determines when to execute the function.
     * 
     * @param isUserCall - Whether this execution was triggered by user code
     * @returns The result of the last function execution
     */
    const executeThrottledFunction = (isUserCall = false): ReturnType<T> => {
      const currentTime = performance.now();
      const timeSinceLastExecution = currentTime - throttleState.lastExecutionTime;
      const remainingWaitTime = enableLeadingExecution ? 
        wait - timeSinceLastExecution : 
        wait;
      
      // Execute immediately if enough time has passed and conditions are met
      if (timeSinceLastExecution >= wait && (!isUserCall || enableLeadingExecution)) {
        throttleState.lastExecutionTime = currentTime;
        
        // Clear any pending timeout since we're executing now
        if (throttleState.pendingTimeoutId !== null) {
          this.clearTimeout(throttleState.pendingTimeoutId);
          throttleState.pendingTimeoutId = null;
        }
        
        // Execute function with proper context and store result
        throttleState.lastResult = func.apply(this._parent, [...throttleState.lastArguments]);
      } 
      // Schedule trailing execution if not already scheduled
      else if (throttleState.pendingTimeoutId === null && enableTrailingExecution) {
        throttleState.pendingTimeoutId = this.setTimeout(() => {
          throttleState.pendingTimeoutId = null;
          executeThrottledFunction();
        }, remainingWaitTime);
      }
      
      return throttleState.lastResult;
    };
    
    this._incrementDevelopmentMetric('throttleCount');
    
    // Return the throttled function with optimized argument handling
    return ((...args: any[]): ReturnType<T> => {
      // Only store arguments if they exist to save memory
      throttleState.lastArguments = args.length ? args : EMPTY_ARRAY;
      return executeThrottledFunction(true);
    }) as T;
  }

  /**
   * Creates an ultra-optimized debounce function with advanced state management.
   * 
   * Debouncing delays function execution until after the specified wait time has
   * elapsed since the last invocation. This is ideal for expensive operations
   * triggered by frequent events like typing or API calls.
   * 
   * @param func - The function to debounce
   * @param wait - Delay time in milliseconds (default: 0)
   * @param options - Configuration options for debounce behavior
   * @returns Debounced function with cancel, flush, and pending methods
   * 
   * @public
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait = 0,
    options?: DebounceOptions
  ): ICancelable<T> & T {
    if (this._isDisposed) {
      // Return a fully functional no-op for disposed instances
      const disposedNoOp = NOOP as ICancelable<T> & T;
      disposedNoOp.cancel = NOOP;
      disposedNoOp.flush = (() => undefined) as () => ReturnType<T>;
      disposedNoOp.pending = () => false;
      return disposedNoOp;
    }

    const enableLeadingExecution = options?.leading ?? false;
    const enableTrailingExecution = options?.trailing ?? true;
    const maxWaitTime = options?.maxWait;
    
    /**
     * Consolidated state for the debounced function.
     * Optimized memory layout for better cache performance.
     */
    const debounceState = {
      lastCallTime: 0,
      lastExecutionTime: performance.now(),
      lastResult: undefined as ReturnType<T>,
      lastArguments: EMPTY_ARRAY as readonly any[],
      pendingTimeoutId: null as number | null,
    };

    /**
     * Marks the function as executed and cleans up any pending timeouts.
     * 
     * @param executionTime - Timestamp when execution occurred
     */
    const markFunctionExecuted = (executionTime: number): void => {
      if (debounceState.pendingTimeoutId !== null) {
        this.clearTimeout(debounceState.pendingTimeoutId);
        debounceState.pendingTimeoutId = null;
      }
      debounceState.lastExecutionTime = executionTime;
    };

    /**
     * Executes the debounced function and updates state.
     * 
     * @param executionTime - Timestamp when execution should be recorded
     */
    const executeDebounceFunction = (executionTime: number): void => {
      markFunctionExecuted(executionTime);
      debounceState.lastResult = func.apply(this._parent, [...debounceState.lastArguments]);
    };

    /**
     * Core debounce logic that handles timing and execution decisions.
     * 
     * @param isUserCall - Whether this was triggered by user code
     * @returns The result of the last function execution
     */
    const processDebounceCall = (isUserCall = false): ReturnType<T> => {
      const currentTime = performance.now();
      let shouldExecuteImmediately = false;
      
      // Handle user-initiated calls
      if (isUserCall) {
        // Execute immediately if leading is enabled and enough time has passed
        if (enableLeadingExecution && currentTime - debounceState.lastCallTime >= wait) {
          shouldExecuteImmediately = true;
        }
        debounceState.lastCallTime = currentTime;
      }
      
      const timeSinceLastCall = currentTime - debounceState.lastCallTime;
      let waitTimeRemaining = wait - timeSinceLastCall;
      const timeSinceLastExecution = currentTime - debounceState.lastExecutionTime;
      
      // Check if maxWait has been exceeded
      const hasMaxWaitExpired = maxWaitTime !== undefined && 
        maxWaitTime !== null && 
        timeSinceLastExecution >= maxWaitTime && 
        debounceState.pendingTimeoutId !== null;
      
      // Execute immediately under various conditions
      if (timeSinceLastCall >= wait || hasMaxWaitExpired || shouldExecuteImmediately) {
        executeDebounceFunction(currentTime);
      } 
      // Schedule trailing execution if appropriate
      else if ((debounceState.pendingTimeoutId === null || !isUserCall) && enableTrailingExecution) {
        // Adjust wait time for maxWait constraint
        if (maxWaitTime !== undefined && maxWaitTime !== null) {
          waitTimeRemaining = Math.min(waitTimeRemaining, maxWaitTime - timeSinceLastExecution);
        }
        
        debounceState.pendingTimeoutId = this.setTimeout(() => {
          debounceState.pendingTimeoutId = null;
          processDebounceCall();
        }, waitTimeRemaining);
      }

      return debounceState.lastResult;
    };

    /**
     * Checks if the debounced function has a pending execution.
     * 
     * @returns true if execution is pending, false otherwise
     */
    const isPending = (): boolean => debounceState.pendingTimeoutId !== null;

    /**
     * Cancels any pending execution of the debounced function.
     */
    const cancelExecution = (): void => {
      if (isPending()) {
        markFunctionExecuted(performance.now());
      }
    };

    /**
     * Immediately executes the debounced function if it's pending.
     * 
     * @returns The result of the function execution
     */
    const flushExecution = (): ReturnType<T> => {
      if (isPending()) {
        executeDebounceFunction(performance.now());
      }
      return debounceState.lastResult;
    };

    this._incrementDevelopmentMetric('debounceCount');

    // Create the debounced function with attached utility methods
    const debouncedFunction = ((...args: any[]): ReturnType<T> => {
      debounceState.lastArguments = args.length ? args : EMPTY_ARRAY;
      return processDebounceCall(true);
    }) as ICancelable<T> & T;

    // Attach control methods to the debounced function
    debouncedFunction.cancel = cancelExecution;
    debouncedFunction.flush = flushExecution;
    debouncedFunction.pending = isPending;

    return debouncedFunction;
  }

  /**
   * Optimized requestAnimationFrame implementation with intelligent fallback handling.
   * 
   * Provides smooth animation frame scheduling with automatic cleanup and cross-browser
   * compatibility. Falls back to setTimeout with 60fps timing when RAF is unavailable.
   * 
   * @param callback - Function to execute on the next animation frame
   * @param targetElement - Optional element to determine window context
   * @returns Animation frame ID for cancellation
   * 
   * @public
   */
  public requestAnimationFrame(callback: () => void, targetElement?: Element | null): number {
    if (this._isDisposed) {
      return 0;
    }
    
    const windowContext = this._getCachedWindow(targetElement);
    if (!windowContext) {
      return 0;
    }
    
    const internalTrackingId = AsyncIdPool.acquire();
    let nativeFrameId: number;
    
    /**
     * Wrapper function that handles cleanup and error management for animation frames.
     */
    const wrappedAnimationCallback = (): void => {
      // Clean up tracking immediately after execution
      this._timerManager.scheduleTimerRemoval(internalTrackingId);
      AsyncIdPool.release(internalTrackingId);
      
      try {
        callback.call(this._parent);
      } catch (error) {
        this._logError(error);
      }
    };
    
    // Use native requestAnimationFrame if available, otherwise fall back to setTimeout
    // 16ms ≈ 60fps for smooth animation fallback
    nativeFrameId = windowContext.requestAnimationFrame
      ? windowContext.requestAnimationFrame(wrappedAnimationCallback)
      : windowContext.setTimeout(wrappedAnimationCallback, 16);
    
    // Register appropriate cleanup function based on the method used
    this._timerManager.addTimer(internalTrackingId, () => {
      if (windowContext.cancelAnimationFrame) {
        windowContext.cancelAnimationFrame(nativeFrameId);
      } else {
        windowContext.clearTimeout(nativeFrameId);
      }
    });
    
    this._incrementDevelopmentMetric('animationFrameCount');
    
    return nativeFrameId;
  }

  /**
   * Cancels an animation frame request created by requestAnimationFrame.
   * 
   * @param frameId - The frame ID returned by requestAnimationFrame
   * @param targetElement - Optional element for window context (maintained for API compatibility)
   * @public
   */
  // eslint-disable-next-line no-unused-vars
  public cancelAnimationFrame(frameId: number, targetElement?: Element | null): void {
    this._timerManager.removeTimer(frameId);
  }

  /**
   * Handles errors that occur in async operation callbacks.
   * 
   * @param error - The error that occurred
   * @internal
   */
  protected _logError(error: any): void {
    this._onErrorHandler?.(error);
  }

  /**
   * Increments a development-time performance metric counter.
   * This method is optimized away in production builds.
   * 
   * @param metricName - Name of the metric to increment
   * @internal
   */
  private _incrementDevelopmentMetric(metricName: keyof AsyncPerformanceMetrics): void {
    if (process.env.NODE_ENV === 'development') {
      const metrics = developmentMetrics.get(this);
      if (metrics) {
        metrics[metricName]++;
      }
    }
  }

  /**
   * Retrieves performance metrics for this Async instance.
   * Only available in development builds to avoid production overhead.
   * 
   * @returns Performance metrics object or null in production builds
   * @public
   */
  public getPerformanceMetrics(): (AsyncPerformanceMetrics & { activeTimers: number }) | null {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    const metrics = developmentMetrics.get(this);
    return metrics ? {
      ...metrics,
      activeTimers: this._timerManager.activeTimerCount
    } : null;
  }
}