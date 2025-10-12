import { renderHook } from '@testing-library/react';
import { useOnEvent } from '../src/useOnEvent';

describe('useOnEvent', () => {
  beforeEach(() => {
    // Clear any event listeners
    jest.clearAllMocks();
  });

  it('attaches event listener to window', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(window, 'resize', handler);
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), undefined);
    
    addEventListenerSpy.mockRestore();
  });

  it('attaches event listener to document', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(document, 'click', handler);
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);
    
    addEventListenerSpy.mockRestore();
  });

  it('removes event listener on unmount', () => {
    const handler = jest.fn();
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => {
      useOnEvent(window, 'scroll', handler);
    });
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), undefined);
    
    removeEventListenerSpy.mockRestore();
  });

  it('handles null target gracefully', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(null, 'resize', handler);
    });
    
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    
    addEventListenerSpy.mockRestore();
  });

  it('handles undefined target gracefully', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(undefined, 'resize', handler);
    });
    
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    
    addEventListenerSpy.mockRestore();
  });

  it('passes event listener options', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const options = { passive: true, capture: false };
    
    renderHook(() => {
      useOnEvent(window, 'scroll', handler, options);
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), options);
    
    addEventListenerSpy.mockRestore();
  });

  it('re-attaches listener when target changes', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { rerender } = renderHook(
      ({ target }) => {
        useOnEvent(target, 'resize', handler);
      },
      { initialProps: { target: window } }
    );
    
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    
    // Change to null (should remove listener)
    rerender({ target: null });
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    
    // Change back to window (should add listener again)
    rerender({ target: window });
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('re-attaches listener when event name changes', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { rerender } = renderHook(
      ({ eventName }) => {
        useOnEvent(window, eventName, handler);
      },
      { initialProps: { eventName: 'resize' as keyof WindowEventMap } }
    );
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), undefined);
    
    rerender({ eventName: 'scroll' as keyof WindowEventMap });
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), undefined);
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), undefined);
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('uses stable handler callback', () => {
    let callCount = 0;
    
    const { rerender } = renderHook(
      ({ count }) => {
        useOnEvent(window, 'resize', () => {
          callCount = count;
        });
      },
      { initialProps: { count: 0 } }
    );
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    expect(callCount).toBe(0);
    
    // Re-render with new count
    rerender({ count: 5 });
    
    // Trigger resize again - should use new handler
    window.dispatchEvent(new Event('resize'));
    expect(callCount).toBe(5);
  });

  it('works with custom HTMLElement', () => {
    const element = document.createElement('div');
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(element, 'click', handler);
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);
    
    addEventListenerSpy.mockRestore();
  });

  it('attaches listener with boolean capture option', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(document, 'click', handler, true);
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    
    addEventListenerSpy.mockRestore();
  });

  it('handles multiple event listeners in same component', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    renderHook(() => {
      useOnEvent(window, 'resize', handler1);
      useOnEvent(window, 'scroll', handler2);
    });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), undefined);
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), undefined);
    
    addEventListenerSpy.mockRestore();
  });

  it('cleans up all listeners on unmount', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => {
      useOnEvent(window, 'resize', handler1);
      useOnEvent(window, 'scroll', handler2);
    });
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), undefined);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), undefined);
    
    removeEventListenerSpy.mockRestore();
  });

  it('handles conditional target', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    const { rerender } = renderHook(
      ({ shouldListen }) => {
        useOnEvent(shouldListen ? window : null, 'resize', handler);
      },
      { initialProps: { shouldListen: false } }
    );
    
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    
    rerender({ shouldListen: true });
    
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    
    addEventListenerSpy.mockRestore();
  });
});
