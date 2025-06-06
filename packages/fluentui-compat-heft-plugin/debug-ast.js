// Simple debug test case
const { parse } = require('./node_modules/@babel/parser');
const traverse = require('./node_modules/@babel/traverse').default;

const testCode = `export const getStyles = (props) => ({
  root: {
    backgroundColor: 'red',
    padding: '10px'
  }
});`;

console.log('Parsing test code...');
const ast = parse(testCode, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx', 'decorators-legacy'],
});

console.log('AST parsed successfully');

// Look for getStyles functions
let foundGetStyles = false;
traverse(ast, {
  VariableDeclarator: (path) => {
    console.log('Found VariableDeclarator:', path.node.id?.name);
    if (path.node.id?.name === 'getStyles') {
      foundGetStyles = true;
      console.log('Found getStyles variable!');
      console.log('Init type:', path.node.init?.type);
      
      if (path.node.init?.type === 'ArrowFunctionExpression') {
        console.log('Body type:', path.node.init.body?.type);
        if (path.node.init.body?.type === 'ObjectExpression') {
          console.log('Properties count:', path.node.init.body.properties?.length);
          path.node.init.body.properties?.forEach((prop, index) => {
            console.log(`Property ${index}:`, prop.key?.name);
          });
        }
      }
    }
  }
});

console.log('Found getStyles?', foundGetStyles);