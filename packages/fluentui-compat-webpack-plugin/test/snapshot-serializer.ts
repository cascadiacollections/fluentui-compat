/**
 * Custom Jest snapshot serializer for import rewrite transformations
 * This makes it easier to see what imports were rewritten
 */

interface ImportRewriteSnapshot {
  before: string;
  after: string;
  rewrites: Array<{
    from: string;
    to: string;
    exports: string[];
  }>;
}

export function createImportRewriteSnapshot(
  input: string,
  output: string
): ImportRewriteSnapshot {
  const rewrites: Array<{ from: string; to: string; exports: string[] }> = [];

  // Extract import statements from input
  const inputImports = extractImports(input);
  const outputImports = extractImports(output);

  // Find rewrites
  inputImports.forEach((inputImport) => {
    const matchingOutput = outputImports.find(
      (out) =>
        out.source === '@cascadiacollections/fluentui-compat' ||
        out.source === '@custom/compat'
    );

    if (matchingOutput && inputImport.source !== matchingOutput.source) {
      const rewrittenExports = inputImport.specifiers.filter((spec) =>
        matchingOutput.specifiers.some((outSpec) => outSpec === spec)
      );

      if (rewrittenExports.length > 0) {
        rewrites.push({
          from: inputImport.source,
          to: matchingOutput.source,
          exports: rewrittenExports,
        });
      }
    }
  });

  return {
    before: input.trim(),
    after: output.trim(),
    rewrites,
  };
}

function extractImports(code: string): Array<{ source: string; specifiers: string[] }> {
  const imports: Array<{ source: string; specifiers: string[] }> = [];
  const importRegex = /import\s+(?:{([^}]+)}|([^'"]+))\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const namedImports = match[1];
    const source = match[3];

    if (namedImports) {
      const specifiers = namedImports
        .split(',')
        .map((s) => s.trim())
        .map((s) => {
          // Handle aliases: "useAsync as myAsync" -> "useAsync"
          const parts = s.split(/\s+as\s+/);
          return parts[0].trim();
        })
        .filter(Boolean);

      imports.push({ source, specifiers });
    }
  }

  return imports;
}

export const importRewriteSnapshotSerializer = {
  test(val: any): boolean {
    return (
      val &&
      typeof val === 'object' &&
      'before' in val &&
      'after' in val &&
      'rewrites' in val
    );
  },

  serialize(
    val: ImportRewriteSnapshot,
    config: any,
    indentation: string,
    depth: number,
    refs: any[],
    printer: any
  ): string {
    let result = '\n';

    result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    result += '📥 BEFORE (Original Import)\n';
    result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    result += val.before + '\n\n';

    if (val.rewrites.length > 0) {
      result += '🔄 REWRITES APPLIED\n';
      result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      val.rewrites.forEach((rewrite, idx) => {
        result += `${idx + 1}. `;
        result += `"${rewrite.from}" → "${rewrite.to}"\n`;
        result += `   Exports: ${rewrite.exports.join(', ')}\n`;
      });
      result += '\n';
    } else {
      result += '✓ NO REWRITES (No matching imports found)\n\n';
    }

    result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    result += '📤 AFTER (Transformed Output)\n';
    result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    result += val.after + '\n';
    result += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    return result;
  },
};
