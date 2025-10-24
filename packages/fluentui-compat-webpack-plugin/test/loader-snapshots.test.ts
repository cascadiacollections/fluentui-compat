/// <reference types="jest" />
import importRewriteLoader from "../src/importRewriteLoader";
import { createImportRewriteSnapshot, importRewriteSnapshotSerializer } from "./snapshot-serializer";

// Register custom snapshot serializer for better readability
expect.addSnapshotSerializer(importRewriteSnapshotSerializer);

/**
 * Snapshot tests for import rewrite transformations
 * These tests capture the exact output of the loader for regression testing
 * with clear before/after comparison showing which imports were rewritten
 */
describe("importRewriteLoader snapshots", () => {
  const loaderContext = {
    getOptions: () => ({ verbose: false })
  };

  test("should match snapshot for simple mapped import", () => {
    const input = `import { useAsync } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for multiple mapped imports", () => {
    const input = `import { useAsync, useConst } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for mixed mapped and unmapped imports", () => {
    const input = `import { useAsync, UnmappedExport } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for unmapped import only", () => {
    const input = `import { UnmappedExport } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for aliased import", () => {
    const input = `import { useAsync as myAsync } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for complex code with multiple imports", () => {
    const input = `
import React from 'react';
import { useAsync, useConst, OtherThing } from '@fluentui/utilities';
import { Button } from '@material-ui/core';

function MyComponent() {
  const async = useAsync();
  const constant = useConst(() => ({ value: 42 }));
  
  return <Button onClick={() => console.log(async, constant, OtherThing)}>Click</Button>;
}

export default MyComponent;
    `.trim();
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for TypeScript with type annotations", () => {
    const input = `
import { useAsync, useConst } from '@fluentui/utilities';

const MyComponent: React.FC = () => {
  const async = useAsync();
  const value: number = useConst(() => 42);
  
  return null;
};
    `.trim();
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for default import (no rewrite)", () => {
    const input = `import FluentUI from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for namespace import (no rewrite)", () => {
    const input = `import * as FluentUI from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for JSX transformation", () => {
    const input = `
import React from 'react';
import { useAsync } from '@fluentui/utilities';

export const MyComponent = () => {
  const async = useAsync();
  
  return (
    <div>
      <h1>Test</h1>
      <button onClick={() => async.flush()}>Flush</button>
    </div>
  );
};
    `.trim();
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for custom mapping configuration", () => {
    const customContext = {
      getOptions: () => ({
        mappings: [
          {
            from: '@custom/lib',
            to: '@custom/compat',
            exports: {
              CustomHook: 'CustomHook',
            },
          },
        ],
        verbose: false,
      }),
    };

    const input = `import { CustomHook, OtherThing } from '@custom/lib';`;
    const output = importRewriteLoader.call(customContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for multiple separate imports from same package", () => {
    const input = `
import { useAsync } from '@fluentui/utilities';
import { useConst } from '@fluentui/utilities';
import { OtherThing } from '@fluentui/utilities';
    `.trim();
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for complex real-world component", () => {
    const input = `
import React, { useState, useEffect, useCallback } from 'react';
import { useAsync, useConst, useBoolean } from '@fluentui/utilities';
import { Button, TextField } from '@fluentui/react-components';

interface Props {
  onSubmit: (data: string) => Promise<void>;
}

export const ComplexComponent: React.FC<Props> = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  const async = useAsync();
  const [isLoading, { setTrue: startLoading, setFalse: stopLoading }] = useBoolean(false);
  const initialConfig = useConst(() => ({ apiUrl: '/api/data' }));
  
  const handleSubmit = useCallback(async () => {
    startLoading();
    try {
      await onSubmit(value);
    } finally {
      stopLoading();
    }
  }, [value, onSubmit, startLoading, stopLoading]);
  
  useEffect(() => {
    return () => async.dispose();
  }, [async]);
  
  return (
    <div>
      <TextField 
        value={value} 
        onChange={(_, data) => setValue(data.value)} 
      />
      <Button 
        onClick={handleSubmit} 
        disabled={isLoading}
      >
        Submit
      </Button>
    </div>
  );
};
    `.trim();
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot when no imports need rewriting", () => {
    const input = `
import React from 'react';
import { Button } from '@material-ui/core';

const MyButton = () => <Button>Click me</Button>;

export default MyButton;
    `.trim();
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for side-effect only import", () => {
    const input = `import '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });

  test("should match snapshot for mixed default and named imports", () => {
    const input = `import Utilities, { useAsync, OtherThing } from '@fluentui/utilities';`;
    const output = importRewriteLoader.call(loaderContext, input);
    expect(createImportRewriteSnapshot(input, output)).toMatchSnapshot();
  });
});
