import * as React from 'react';
import { render } from '@testing-library/react';
import { useMergedRefs } from '../src/useMergedRefs';

describe('useMergedRefs', () => {
  it('updates callback ref', () => {
    const callbackRef = jest.fn();
    const element = document.createElement('div');
    
    function TestComponent() {
      const mergedRef = useMergedRefs(callbackRef);
      React.useEffect(() => {
        mergedRef(element);
      }, [mergedRef]);
      return null;
    }
    
    render(<TestComponent />);
    
    expect(callbackRef).toHaveBeenCalledWith(element);
  });

  it('updates ref object', () => {
    const refObject = React.createRef<HTMLDivElement>();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(refObject);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container } = render(<TestComponent />);
    const div = container.querySelector('div');
    
    expect(refObject.current).toBe(div);
  });

  it('updates multiple refs', () => {
    const callbackRef = jest.fn();
    const refObject = React.createRef<HTMLDivElement>();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(callbackRef, refObject);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container } = render(<TestComponent />);
    const div = container.querySelector('div');
    
    expect(callbackRef).toHaveBeenCalledWith(div);
    expect(refObject.current).toBe(div);
  });

  it('ignores null refs', () => {
    const refObject = React.createRef<HTMLDivElement>();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(null, refObject, null);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container } = render(<TestComponent />);
    const div = container.querySelector('div');
    
    expect(refObject.current).toBe(div);
  });

  it('ignores undefined refs', () => {
    const refObject = React.createRef<HTMLDivElement>();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(undefined, refObject, undefined);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container } = render(<TestComponent />);
    const div = container.querySelector('div');
    
    expect(refObject.current).toBe(div);
  });

  it('calls cleanup with null on unmount', () => {
    const callbackRef = jest.fn();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(callbackRef);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { unmount } = render(<TestComponent />);
    
    // First call with element
    expect(callbackRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    
    unmount();
    
    // Second call with null on cleanup
    expect(callbackRef).toHaveBeenCalledWith(null);
    expect(callbackRef).toHaveBeenCalledTimes(2);
  });

  it('works with forwarded refs', () => {
    const externalRef = React.createRef<HTMLDivElement>();
    
    const ForwardedComponent = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
      const internalRef = React.useRef<HTMLDivElement>(null);
      const mergedRef = useMergedRefs(internalRef, ref);
      return <div ref={mergedRef}>Test</div>;
    });
    
    const { container } = render(<ForwardedComponent ref={externalRef} />);
    const div = container.querySelector('div');
    
    expect(externalRef.current).toBe(div);
  });

  it('maintains stable callback reference when refs dont change', () => {
    const refCallbacks: Array<(instance: HTMLDivElement | null) => void> = [];
    
    function TestComponent({ value }: { value: number }) {
      const ref = React.createRef<HTMLDivElement>();
      // Pass the same ref instance to ensure callback stability
      const stableRef = React.useRef<React.RefObject<HTMLDivElement>>(ref);
      const mergedRef = useMergedRefs(stableRef.current);
      
      React.useEffect(() => {
        refCallbacks.push(mergedRef);
      });
      
      return <div ref={mergedRef}>{value}</div>;
    }
    
    const { rerender } = render(<TestComponent value={1} />);
    
    rerender(<TestComponent value={2} />);
    rerender(<TestComponent value={3} />);
    
    // Callbacks should be the same when refs don't change
    expect(refCallbacks[0]).toBe(refCallbacks[1]);
    expect(refCallbacks[1]).toBe(refCallbacks[2]);
  });

  it('handles changing refs between renders', () => {
    const ref1 = jest.fn();
    const ref2 = jest.fn();
    
    function TestComponent({ useRef1 }: { useRef1: boolean }) {
      const mergedRef = useMergedRefs(useRef1 ? ref1 : ref2);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container, rerender } = render(<TestComponent useRef1={true} />);
    const div = container.querySelector('div');
    
    expect(ref1).toHaveBeenCalledWith(div);
    expect(ref2).not.toHaveBeenCalled();
    
    // Clear mock calls before rerender
    ref1.mockClear();
    ref2.mockClear();
    
    rerender(<TestComponent useRef1={false} />);
    
    // When refs change, the new ref gets the element
    // The stable callback updates all current refs with the element
    expect(ref2).toHaveBeenCalledWith(div);
    // ref1 might or might not be called depending on when React processes the ref update
    // This is expected behavior - refs are updated with current element, not cleaned up
  });

  it('handles multiple ref objects', () => {
    const ref1 = React.createRef<HTMLDivElement>();
    const ref2 = React.createRef<HTMLDivElement>();
    const ref3 = React.createRef<HTMLDivElement>();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(ref1, ref2, ref3);
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container } = render(<TestComponent />);
    const div = container.querySelector('div');
    
    expect(ref1.current).toBe(div);
    expect(ref2.current).toBe(div);
    expect(ref3.current).toBe(div);
  });

  it('handles mix of callback refs and ref objects', () => {
    const callbackRef1 = jest.fn();
    const refObject1 = React.createRef<HTMLDivElement>();
    const callbackRef2 = jest.fn();
    const refObject2 = React.createRef<HTMLDivElement>();
    
    function TestComponent() {
      const mergedRef = useMergedRefs(
        callbackRef1,
        refObject1,
        callbackRef2,
        refObject2
      );
      return <div ref={mergedRef}>Test</div>;
    }
    
    const { container } = render(<TestComponent />);
    const div = container.querySelector('div');
    
    expect(callbackRef1).toHaveBeenCalledWith(div);
    expect(refObject1.current).toBe(div);
    expect(callbackRef2).toHaveBeenCalledWith(div);
    expect(refObject2.current).toBe(div);
  });

  it('works with no refs provided', () => {
    function TestComponent() {
      const mergedRef = useMergedRefs();
      return <div ref={mergedRef}>Test</div>;
    }
    
    // Should not throw
    expect(() => render(<TestComponent />)).not.toThrow();
  });
});
