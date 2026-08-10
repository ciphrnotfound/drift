const { Parser } = require('../packages/compiler/dist/index.js');

const source = `style Button {
  layout row
  bg red
}

render Button({ label, onClick }) {
  <button onClick={onClick}>
    <span>{label}</span>
  </button>
}`;

console.log('Source:');
console.log(source);
console.log('\nParsing...\n');

try {
  const parser = new Parser(source, 'test.drift');
  const ast = parser.parse();
  console.log('Success!');
  console.log(JSON.stringify(ast, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
