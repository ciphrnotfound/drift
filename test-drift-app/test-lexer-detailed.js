const { Lexer } = require('../packages/compiler/dist/index.js');

const source = `render Button({ label, onClick }) {
  <button onClick={onClick}>
    <span>{label}</span>
  </button>
}`;

console.log('Source:');
console.log(source);
console.log('\nTokens:');

const lexer = new Lexer(source);
const tokens = lexer.tokenize();

tokens.forEach((token, i) => {
  console.log(`${i}: ${token.type.padEnd(15)} "${token.value}" at ${token.position.line}:${token.position.column}`);
});
