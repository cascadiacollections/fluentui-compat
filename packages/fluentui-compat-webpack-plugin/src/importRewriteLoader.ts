import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import type { ImportMapping } from "./index";

// You may want to move this to a shared config file
const DEFAULT_MAPPINGS: ImportMapping[] = [
  {
    from: "@fluentui/utilities",
    to: "@cascadiacollections/fluentui-compat",
    exports: {
      Async: "Async",
      useAsync: "useAsync",
      useConst: "useConst",
      // Add more symbol mappings here
    },
  },
];

interface LoaderOptions {
  mappings?: ImportMapping[];
  verbose?: boolean;
}

function getCompatMapping(mappings: ImportMapping[], source: string) {
  return mappings.find((m) => m.from === source);
}

export default function importRewriteLoader(this: any, source: string) {
  const options: LoaderOptions = this.getOptions ? this.getOptions() : {};
  const mappings = options.mappings || DEFAULT_MAPPINGS;
  const verbose = options.verbose || false;

  const ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
  let changed = false;

  traverse(ast, {
    ImportDeclaration(path: any) {
      const mapping = getCompatMapping(mappings, path.node.source.value);
      if (!mapping) return;
      const { to, exports: exportMap } = mapping;
      if (!exportMap) {
        // Replace whole import
        path.node.source.value = to;
        changed = true;
        if (verbose)
          console.log(
            `[import-rewrite-loader] Rewrote import: ${path.node.source.value} -> ${to}`
          );
        return;
      }
      // Split specifiers into mapped and unmapped
      const mapped: t.ImportSpecifier[] = [];
      const unmapped: (
        | t.ImportSpecifier
        | t.ImportDefaultSpecifier
        | t.ImportNamespaceSpecifier
      )[] = [];
      for (const spec of path.node.specifiers) {
        if (!t.isImportSpecifier(spec)) {
          // Default or namespace imports - keep them unmapped
          unmapped.push(spec);
          continue;
        }
        // Handle named imports
        const importedName = t.isIdentifier(spec.imported)
          ? spec.imported.name
          : spec.imported.value;
        if (exportMap[importedName]) {
          mapped.push(spec);
        } else {
          unmapped.push(spec);
        }
      }
      if (mapped.length > 0) {
        // Create new import for compat
        const compatImport = t.importDeclaration(
          mapped.map((spec) => {
            const importedName = t.isIdentifier(spec.imported)
              ? spec.imported.name
              : spec.imported.value;
            return t.importSpecifier(
              spec.local,
              t.identifier(exportMap![importedName])
            );
          }),
          t.stringLiteral(to)
        );
        path.insertBefore(compatImport);
        changed = true;
        if (verbose)
          console.log(`[import-rewrite-loader] Added compat import for: ${to}`);
      }
      if (unmapped.length > 0) {
        // Keep original import for unmapped
        path.node.specifiers = unmapped;
      } else {
        // Remove original import if all were mapped
        path.remove();
      }
    },
  });

  if (changed) {
    const output = generate(ast, {}, source);
    return output.code;
  }
  return source;
}
