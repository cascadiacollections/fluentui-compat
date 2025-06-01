/// <reference types="jest" />

describe("Smoke Test", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    expect("hello world").toContain("world");
  });
});
