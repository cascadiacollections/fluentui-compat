/// <reference types="jest" />
import { FluentUICompatPlugin } from "../src/index";

describe("FluentUICompatPlugin Integration", () => {
  it("should correctly rewrite multiple different import patterns", () => {
    const plugin = new FluentUICompatPlugin();

    // Test various import patterns that should be rewritten
    const testCases = [
      // Direct package import
      {
        input: "@fluentui/utilities",
        expected: "@cascadiacollections/fluentui-compat",
      },
      // Specific export
      {
        input: "@fluentui/utilities/lib/useAsync",
        expected: "@cascadiacollections/fluentui-compat",
      },
      // Deep submodule that should be preserved
      {
        input: "@fluentui/utilities/lib/SomeOtherUtility",
        expected: "@cascadiacollections/fluentui-compat/lib/SomeOtherUtility",
      },
      // Unrelated package should not be touched
      {
        input: "@some/other-package",
        expected: "@some/other-package",
      },
      // Another unrelated package
      {
        input: "react",
        expected: "react",
      },
    ];

    // Access the private rewriteRequest method for testing
    const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

    testCases.forEach(({ input, expected }) => {
      const result = rewriteRequest(input);
      expect(result).toBe(expected);
    });
  });

  it("should work with custom mapping configurations", () => {
    const plugin = new FluentUICompatPlugin({
      mappings: [
        {
          from: "@custom/ui-library",
          to: "@my/compat-library",
          exports: {
            OldComponent: "NewComponent",
          },
        },
        {
          from: "@another/package",
          to: "@another/compat-package",
        },
      ],
    });

    const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

    // Test custom mappings
    expect(rewriteRequest("@custom/ui-library")).toBe("@my/compat-library");
    expect(rewriteRequest("@custom/ui-library/OldComponent")).toBe(
      "@my/compat-library"
    );
    expect(rewriteRequest("@another/package")).toBe("@another/compat-package");
    expect(rewriteRequest("@another/package/submodule")).toBe(
      "@another/compat-package/submodule"
    );

    // Original FluentUI mappings should not exist with custom config
    expect(rewriteRequest("@fluentui/utilities")).toBe("@fluentui/utilities");
  });

  it("should handle edge cases gracefully", () => {
    const plugin = new FluentUICompatPlugin();
    const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

    // Empty string
    expect(rewriteRequest("")).toBe("");

    // Just the package name without trailing slash
    expect(rewriteRequest("@fluentui/utilities")).toBe(
      "@cascadiacollections/fluentui-compat"
    );

    // Package name with trailing slash
    expect(rewriteRequest("@fluentui/utilities/")).toBe(
      "@cascadiacollections/fluentui-compat/"
    );

    // Similar but different package name
    expect(rewriteRequest("@fluentui/utilities-extended")).toBe(
      "@fluentui/utilities-extended"
    );

    // Partial match should not rewrite
    expect(rewriteRequest("@fluentui/util")).toBe("@fluentui/util");
  });

  it("should preserve relative and absolute paths", () => {
    const plugin = new FluentUICompatPlugin();
    const rewriteRequest = (plugin as any).rewriteRequest.bind(plugin);

    // Relative paths should not be touched
    expect(rewriteRequest("./local-file")).toBe("./local-file");
    expect(rewriteRequest("../parent-file")).toBe("../parent-file");

    // Absolute paths should not be touched
    expect(rewriteRequest("/absolute/path")).toBe("/absolute/path");

    // Node core modules should not be touched
    expect(rewriteRequest("fs")).toBe("fs");
    expect(rewriteRequest("path")).toBe("path");
    expect(rewriteRequest("util")).toBe("util");
  });
});
