const { Lexer } = require('../packages/compiler/dist/index.js');

const source = `
style Button {
  layout row center
  bg $color.ember
  pad $space.2 $space.5
  
  hover {
    bg $color.ember.dark
  }
}

render Button({ label, onClick }) {
  <button onClick={onClick}>
    {label}
  </button>
}
`;

console.log('Testing new curly-brace lexer...\n');
console.log('Source:');
console.log('='.repeat(50));
console.log(source);
console.log('='.repeat(50));

try {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  
  console.log('\nTokens:');
  console.log('='.repeat(50));
  tokens.forEach((token, i) => {
    if (token.type !== 'EOF') {
      console.log(`${i}. ${token.type.padEnd(15)} "${token.value}"`);
    }
  });
  console.log('='.repeat(50));
  console.log('\n✓ Lexer test passed! Curly-brace syntax works.');
} catch (error) {
  console.error('\n✗ Lexer test failed:');
  console.error(error.message);
  process.exit(1);
}
