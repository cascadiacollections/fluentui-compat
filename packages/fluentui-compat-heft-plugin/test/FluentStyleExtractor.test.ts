/**
 * Basic smoke test for FluentStyleExtractor
 */

import { FluentStyleExtractor } from '../src/FluentStyleExtractor';
import { Terminal } from '@rushstack/terminal';

describe('FluentStyleExtractor', () => {
  let mockTerminal: Terminal;

  beforeEach(() => {
    const provider = {
      write: jest.fn(),
      writeError: jest.fn(),
      writeWarning: jest.fn(),
      writeVerbose: jest.fn(),
      writeLine: jest.fn(),
      writeErrorLine: jest.fn(),
      writeWarningLine: jest.fn(),
      writeVerboseLine: jest.fn(),
      eolCharacter: '\n',
      supportsColor: false,
      verboseEnabled: true,
      debugEnabled: false
    };
    
    mockTerminal = new Terminal(provider);
  });

  it('should create an instance', () => {
    const options = {
      include: ['**/*.styles.ts'],
      exclude: ['node_modules/**'],
      outputDir: 'dist',
      cssFileName: 'styles.css',
      classPrefix: 'test',
      enableSourceMaps: false,
      minifyCSS: false,
      buildFolderPath: '/test/build',
      projectFolderPath: '/test/project',
      terminal: mockTerminal
    };

    const extractor = new FluentStyleExtractor(options);
    expect(extractor).toBeDefined();
  });

  it('should have proper configuration defaults', () => {
    const options = {
      include: ['**/*.styles.ts'],
      exclude: ['node_modules/**'],
      outputDir: 'dist',
      cssFileName: 'styles.css',
      classPrefix: 'test',
      enableSourceMaps: false,
      minifyCSS: false,
      buildFolderPath: '/test/build',
      projectFolderPath: '/test/project',
      terminal: mockTerminal
    };

    const extractor = new FluentStyleExtractor(options);
    expect(extractor).toBeInstanceOf(FluentStyleExtractor);
  });
});