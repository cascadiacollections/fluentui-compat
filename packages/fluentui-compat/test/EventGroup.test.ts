import { EventGroup } from '../src/EventGroup';

describe('EventGroup', () => {
  let eventGroup: EventGroup;
  let element: HTMLDivElement;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    eventGroup = new EventGroup();
    element = document.createElement('div');
    mockCallback = jest.fn();
  });

  afterEach(() => {
    eventGroup.dispose();
  });

  describe('constructor', () => {
    it('creates an EventGroup instance', () => {
      expect(eventGroup).toBeInstanceOf(EventGroup);
    });

    it('creates an EventGroup with parent context', () => {
      const parent = { name: 'test' };
      const group = new EventGroup(parent);
      expect(group).toBeInstanceOf(EventGroup);
      group.dispose();
    });
  });

  describe('on() method', () => {
    it('adds an event listener to element', () => {
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
      
      eventGroup.on(element, 'click', mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);
      
      addEventListenerSpy.mockRestore();
    });

    it('adds event listener to window', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      eventGroup.on(window, 'resize', mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), undefined);
      
      addEventListenerSpy.mockRestore();
    });

    it('adds event listener to document', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      eventGroup.on(document, 'keydown', mockCallback);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), undefined);
      
      addEventListenerSpy.mockRestore();
    });

    it('supports method chaining', () => {
      const result = eventGroup.on(element, 'click', mockCallback);
      
      expect(result).toBe(eventGroup);
    });

    it('adds multiple listeners to same target', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
      
      eventGroup.on(element, 'click', callback1);
      eventGroup.on(element, 'click', callback2);
      
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      
      addEventListenerSpy.mockRestore();
    });

    it('adds listeners with options object', () => {
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
      const options = { passive: true, capture: false };
      
      eventGroup.on(element, 'scroll', mockCallback, options);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), options);
      
      addEventListenerSpy.mockRestore();
    });

    it('adds listeners with boolean capture option', () => {
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
      
      eventGroup.on(element, 'click', mockCallback, true);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      
      addEventListenerSpy.mockRestore();
    });

    it('binds callback to parent context', () => {
      const parent = { value: 42 };
      const group = new EventGroup(parent);
      let capturedThis: any;
      
      const callback = function(this: any) {
        capturedThis = this;
      };
      
      group.on(element, 'click', callback);
      element.click();
      
      expect(capturedThis).toBe(parent);
      
      group.dispose();
    });

    it('handles invalid inputs gracefully', () => {
      // Should not throw
      expect(() => {
        eventGroup.on(null as any, 'click', mockCallback);
      }).not.toThrow();
      
      expect(() => {
        eventGroup.on(element, '', mockCallback);
      }).not.toThrow();
      
      expect(() => {
        eventGroup.on(element, 'click', null as any);
      }).not.toThrow();
    });

    it('warns when adding to disposed instance in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      eventGroup.dispose();
      eventGroup.on(element, 'click', mockCallback);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('disposed instance')
      );
      
      consoleWarnSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('off() method', () => {
    it('removes specific event listener', () => {
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
      
      eventGroup.on(element, 'click', mockCallback);
      eventGroup.off(element, 'click', mockCallback);
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });

    it('removes all events of a specific type from target', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
      
      eventGroup.on(element, 'click', callback1);
      eventGroup.on(element, 'click', callback2);
      eventGroup.off(element, 'click');
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      
      removeEventListenerSpy.mockRestore();
    });

    it('removes all events from target', () => {
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
      
      eventGroup.on(element, 'click', jest.fn());
      eventGroup.on(element, 'mousedown', jest.fn());
      eventGroup.on(element, 'mouseup', jest.fn());
      eventGroup.off(element);
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
      
      removeEventListenerSpy.mockRestore();
    });

    it('removes all events when called without arguments', () => {
      const spy1 = jest.spyOn(element, 'removeEventListener');
      const element2 = document.createElement('div');
      const spy2 = jest.spyOn(element2, 'removeEventListener');
      
      eventGroup.on(element, 'click', jest.fn());
      eventGroup.on(element2, 'click', jest.fn());
      eventGroup.off();
      
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      
      spy1.mockRestore();
      spy2.mockRestore();
    });

    it('supports method chaining', () => {
      eventGroup.on(element, 'click', mockCallback);
      const result = eventGroup.off(element, 'click', mockCallback);
      
      expect(result).toBe(eventGroup);
    });

    it('only removes matching callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
      
      eventGroup.on(element, 'click', callback1);
      eventGroup.on(element, 'click', callback2);
      eventGroup.off(element, 'click', callback1);
      
      // Should only remove callback1
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      
      // Trigger event to verify callback2 still works
      element.click();
      expect(callback2).toHaveBeenCalled();
      expect(callback1).not.toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });

    it('handles removing non-existent listener gracefully', () => {
      expect(() => {
        eventGroup.off(element, 'click', mockCallback);
      }).not.toThrow();
    });

    it('does nothing if called on disposed instance', () => {
      eventGroup.on(element, 'click', mockCallback);
      eventGroup.dispose();
      
      expect(() => {
        eventGroup.off(element, 'click', mockCallback);
      }).not.toThrow();
    });
  });

  describe('raise() method', () => {
    it('invokes registered callbacks', () => {
      eventGroup.on(element, 'custom-event', mockCallback);
      eventGroup.raise('custom-event');
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('passes event arguments to callbacks', () => {
      const eventArgs = { detail: 'test data' };
      
      eventGroup.on(element, 'custom-event', mockCallback);
      eventGroup.raise('custom-event', eventArgs);
      
      expect(mockCallback).toHaveBeenCalledWith(eventArgs);
    });

    it('invokes multiple callbacks for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventGroup.on(element, 'test-event', callback1);
      eventGroup.on(element, 'test-event', callback2);
      eventGroup.raise('test-event');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('only invokes callbacks for matching event name', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventGroup.on(element, 'event1', callback1);
      eventGroup.on(element, 'event2', callback2);
      eventGroup.raise('event1');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('supports method chaining', () => {
      const result = eventGroup.raise('test-event');
      
      expect(result).toBe(eventGroup);
    });

    it('handles errors in callbacks gracefully', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const successCallback = jest.fn();
      
      eventGroup.on(element, 'test-event', errorCallback);
      eventGroup.on(element, 'test-event', successCallback);
      
      eventGroup.raise('test-event');
      
      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('does nothing if called on disposed instance', () => {
      eventGroup.on(element, 'test-event', mockCallback);
      eventGroup.dispose();
      eventGroup.raise('test-event');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('declare() method', () => {
    it('is a no-op for API compatibility', () => {
      expect(() => {
        eventGroup.declare({ eventName: 'custom-event' });
      }).not.toThrow();
    });

    it('supports method chaining', () => {
      const result = eventGroup.declare({ eventName: 'test' });
      
      expect(result).toBe(eventGroup);
    });
  });

  describe('dispose() method', () => {
    it('removes all registered event listeners', () => {
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
      
      eventGroup.on(element, 'click', jest.fn());
      eventGroup.on(element, 'mousedown', jest.fn());
      eventGroup.dispose();
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      
      removeEventListenerSpy.mockRestore();
    });

    it('can be called multiple times safely', () => {
      eventGroup.on(element, 'click', mockCallback);
      
      expect(() => {
        eventGroup.dispose();
        eventGroup.dispose();
        eventGroup.dispose();
      }).not.toThrow();
    });

    it('prevents further event registration', () => {
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
      
      eventGroup.dispose();
      eventGroup.on(element, 'click', mockCallback);
      
      // Should not add event after disposal
      expect(addEventListenerSpy).not.toHaveBeenCalled();
      
      addEventListenerSpy.mockRestore();
    });

    it('clears internal tracking', () => {
      eventGroup.on(element, 'click', jest.fn());
      eventGroup.on(window, 'resize', jest.fn());
      
      eventGroup.dispose();
      
      // Verify no listeners are tracked after disposal
      // (this is implicit - if they were tracked, off() would try to remove them)
      expect(() => eventGroup.off()).not.toThrow();
    });

    it('handles errors during cleanup gracefully', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Create a broken element that throws on removeEventListener
      const brokenElement = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(() => {
          throw new Error('Removal error');
        }),
      };
      
      eventGroup.on(brokenElement as any, 'click', mockCallback);
      
      expect(() => {
        eventGroup.dispose();
      }).not.toThrow();
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('event execution', () => {
    it('actually fires registered callbacks when events occur', () => {
      eventGroup.on(element, 'click', mockCallback);
      
      element.click();
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('passes event object to callback', () => {
      let capturedEvent: Event | null = null;
      
      eventGroup.on(element, 'click', (event: Event) => {
        capturedEvent = event;
      });
      
      element.click();
      
      expect(capturedEvent).toBeInstanceOf(Event);
      expect(capturedEvent?.type).toBe('click');
    });

    it('handles multiple events on same element', () => {
      const clickCallback = jest.fn();
      const mousedownCallback = jest.fn();
      
      eventGroup.on(element, 'click', clickCallback);
      eventGroup.on(element, 'mousedown', mousedownCallback);
      
      element.click();
      element.dispatchEvent(new Event('mousedown'));
      
      expect(clickCallback).toHaveBeenCalled();
      expect(mousedownCallback).toHaveBeenCalled();
    });

    it('stops firing after removal', () => {
      eventGroup.on(element, 'click', mockCallback);
      element.click();
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      eventGroup.off(element, 'click', mockCallback);
      element.click();
      
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('stops firing after disposal', () => {
      eventGroup.on(element, 'click', mockCallback);
      element.click();
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      eventGroup.dispose();
      element.click();
      
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe('memory management', () => {
    it('maintains unique IDs for different targets', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      
      eventGroup.on(element1, 'click', jest.fn());
      eventGroup.on(element2, 'click', jest.fn());
      
      eventGroup.off(element1);
      
      // Verify element2's listener is not affected
      const spy = jest.spyOn(element2, 'removeEventListener');
      eventGroup.off(element2);
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });

    it('handles many events efficiently', () => {
      const callbacks: jest.Mock[] = [];
      const elements: HTMLDivElement[] = [];
      
      // Add many events
      for (let i = 0; i < 100; i++) {
        const el = document.createElement('div');
        const cb = jest.fn();
        elements.push(el);
        callbacks.push(cb);
        eventGroup.on(el, 'click', cb);
      }
      
      // Verify all work
      elements.forEach((el, i) => {
        el.click();
        expect(callbacks[i]).toHaveBeenCalled();
      });
      
      // Dispose should clean up all
      eventGroup.dispose();
    });
  });

  describe('edge cases', () => {
    it('handles same callback registered twice', () => {
      const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
      
      eventGroup.on(element, 'click', mockCallback);
      eventGroup.on(element, 'click', mockCallback);
      
      // Should register twice (EventGroup tracks both)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      
      element.click();
      
      // Browser deduplicates identical function references, so fires once
      // But EventGroup tracks both registrations
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      addEventListenerSpy.mockRestore();
    });

    it('handles removing one instance of duplicate callback', () => {
      eventGroup.on(element, 'click', mockCallback);
      eventGroup.on(element, 'click', mockCallback);
      
      eventGroup.off(element, 'click', mockCallback);
      
      element.click();
      
      // Both should be removed since off() removes all matching callbacks
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('handles events with special characters in name', () => {
      const customEvent = 'my:custom-event.test';
      
      eventGroup.on(element, customEvent, mockCallback);
      element.dispatchEvent(new Event(customEvent));
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('works with custom event targets', () => {
      const customTarget = {
        listeners: new Map<string, Set<EventListener>>(),
        addEventListener(event: string, callback: EventListener) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
          }
          this.listeners.get(event)!.add(callback);
        },
        removeEventListener(event: string, callback: EventListener) {
          this.listeners.get(event)?.delete(callback);
        },
      };
      
      eventGroup.on(customTarget as any, 'test', mockCallback);
      
      expect(customTarget.listeners.get('test')?.size).toBe(1);
      
      eventGroup.off(customTarget as any, 'test');
      
      expect(customTarget.listeners.get('test')?.size).toBe(0);
    });
  });

  describe('React integration scenarios', () => {
    it('simulates React component lifecycle', () => {
      // Simulate componentDidMount
      const component = { name: 'TestComponent' };
      const group = new EventGroup(component);
      
      const resizeCallback = jest.fn();
      const clickCallback = jest.fn();
      
      group.on(window, 'resize', resizeCallback);
      group.on(document, 'click', clickCallback);
      
      // Simulate some interactions
      window.dispatchEvent(new Event('resize'));
      document.dispatchEvent(new Event('click'));
      
      expect(resizeCallback).toHaveBeenCalled();
      expect(clickCallback).toHaveBeenCalled();
      
      // Simulate componentWillUnmount
      group.dispose();
      
      // Events should no longer fire
      resizeCallback.mockClear();
      clickCallback.mockClear();
      
      window.dispatchEvent(new Event('resize'));
      document.dispatchEvent(new Event('click'));
      
      expect(resizeCallback).not.toHaveBeenCalled();
      expect(clickCallback).not.toHaveBeenCalled();
    });

    it('provides proper this binding in React context', () => {
      const component = {
        state: { count: 0 },
        handleClick() {
          this.state.count++;
        },
      };
      
      const group = new EventGroup(component);
      
      group.on(element, 'click', component.handleClick);
      element.click();
      
      expect(component.state.count).toBe(1);
      
      group.dispose();
    });
  });
});
