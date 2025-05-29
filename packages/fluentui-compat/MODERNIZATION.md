# Build System Modernization

This package has been modernized with the Rush Stack suite of build tools, providing enhanced TypeScript compilation and API documentation generation.

## Tools Used

### Heft Build Orchestrator

The project now uses [Heft](https://rushstack.io/pages/heft/overview/) instead of plain `tsc` for TypeScript compilation. Heft provides:

- **Modern TypeScript support** with advanced compiler options
- **Integrated linting** with ESLint during the build process  
- **Enhanced error reporting** and build performance
- **Standardized project structure** following Rush Stack conventions

### API Extractor

[API Extractor](https://api-extractor.com/) generates comprehensive API documentation:

- **API Report Generation**: Markdown documentation in `temp/fluentui-compat.api.md`
- **Type Definition Rollup**: Single `.d.ts` file at `dist/fluentui-compat.d.ts`
- **API Consistency Validation**: Ensures public API changes are intentional
- **JSON API Model**: Machine-readable API metadata in `temp/fluentui-compat.api.json`

## Build Process

The modernized build process includes:

1. **TypeScript Compilation**: Modern ES2017+ target with optimized settings
2. **ESLint Integration**: Automatic linting during compilation
3. **API Documentation**: Automatic generation of API reports and rollup types
4. **Source Maps**: Generated for both JS and declaration files

## Configuration Files

- `config/heft.json`: Heft build orchestrator configuration
- `api-extractor.json`: API Extractor configuration for documentation generation
- `tsconfig.json`: TypeScript compiler options optimized for modern development

## Scripts

- `npm run build`: Full build including TypeScript compilation and API extraction
- `npm run api-extract`: Generate API documentation and rollup types
- `npm run lint`: Run ESLint on source files
- `npm run test`: Run Jest tests through Heft

This modernization provides better developer experience, enhanced documentation, and follows Microsoft's recommended practices for TypeScript library development.