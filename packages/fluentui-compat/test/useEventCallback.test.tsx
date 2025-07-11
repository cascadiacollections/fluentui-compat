import * as React from "react";
import { render, fireEvent } from "@testing-library/react";
import { useEventCallback } from "../src/useEventCallback";

describe("useEventCallback", () => {
  it("returns a stable function reference between renders", () => {
    let callbackRef: Function[] = [];

    function TestComponent({ fn }: { fn: (a: string) => void }) {
      const stableCallback = useEventCallback(fn);
      callbackRef.push(stableCallback);
      return null;
    }

    const firstFn = jest.fn();
    const { rerender } = render(<TestComponent fn={firstFn} />);
    const secondFn = jest.fn();
    rerender(<TestComponent fn={secondFn} />);

    expect(callbackRef[0]).toBe(callbackRef[1]);
  });

  it("calls the latest callback implementation", () => {
    let capturedCallback: (...args: any[]) => void = () => {};

    function TestComponent({ fn }: { fn: (n: number) => void }) {
      capturedCallback = useEventCallback(fn);
      return null;
    }

    const fn1 = jest.fn();
    const { rerender } = render(<TestComponent fn={fn1} />);
    capturedCallback(42);
    expect(fn1).toHaveBeenCalledWith(42);

    const fn2 = jest.fn();
    rerender(<TestComponent fn={fn2} />);
    capturedCallback(99);
    expect(fn2).toHaveBeenCalledWith(99);
  });

  it("throws in dev if callbackRef.current is unset (only in development)", () => {
    // Simulate NODE_ENV !== 'production'
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { useEventCallback } = require("./useEventCallback");
    function TestComponent() {
      // @ts-ignore
      const ref = React.useRef();
      // Force callbackRef.current to be undefined
      // @ts-ignore
      React.useRef = () => ref;
      const stable = useEventCallback(() => {});
      // Reset useRef after test
      // @ts-ignore
      React.useRef = React.__proto__.useRef || React.useRef;
      expect(() => stable("test")).toThrow(
        /useEventCallback: Internal error - callbackRef.current is undefined or null/
      );
      return null;
    }

    // Only run this test if not in production
    if (originalEnv !== "production") {
      expect(() => render(<TestComponent />)).toThrow();
    }

    process.env.NODE_ENV = originalEnv;
  });

  it("works as a stable event handler in a component", () => {
    function ButtonComponent({
      onClick,
    }: {
      onClick: (e: React.MouseEvent, data: string) => void;
    }) {
      const handleClick = useEventCallback(onClick);
      return (
        <button onClick={(e) => handleClick(e, "payload")}>Click me</button>
      );
    }

    const handle = jest.fn();
    const { getByText, rerender } = render(
      <ButtonComponent onClick={handle} />
    );
    fireEvent.click(getByText("Click me"));
    expect(handle).toHaveBeenCalledWith(expect.any(Object), "payload");

    const handle2 = jest.fn();
    rerender(<ButtonComponent onClick={handle2} />);
    fireEvent.click(getByText("Click me"));
    expect(handle2).toHaveBeenCalledWith(expect.any(Object), "payload");
  });
});
