const { compile } = require('../packages/compiler/dist/index.js');
const fs = require('fs');
const path = require('path');

// Read the Drift file
const driftSource = fs.readFileSync(path.join(__dirname, 'Button.drift'), 'utf-8');
const tokensSource = fs.readFileSync(path.join(__dirname, 'drift.tokens'), 'utf-8');

console.log('Testing Drift Compiler...\n');
console.log('Input Drift file:');
console.log('='.repeat(50));
console.log(driftSource);
console.log('='.repeat(50));
console.log('\nCompiling...\n');

// Compile
const result = compile(driftSource, {
  filename: 'Button.drift',
  tokens: tokensSource,
  config: {
    compiler: {
      target: 'es2020',
      sourceMaps: true
    },
    styles: {
      scoping: 'component',
      optimization: 'production'
    },
    breakpoints: {
      mobile: 640,
      tablet: 768,
      desktop: 1024
    },
    motion: {
      reducedMotion: 'respect'
    }
  }
});

if (result.errors && result.errors.length > 0) {
  console.error('Compilation errors:');
  result.errors.forEach(err => {
    console.error(`  - ${err.message} at ${err.location?.line}:${err.location?.column}`);
  });
  process.exit(1);
}

console.log('Compilation successful!\n');
console.log('Generated files:');
console.log('='.repeat(50));

result.files.forEach(file => {
  console.log(`\n${file.path}:`);
  console.log('-'.repeat(50));
  console.log(file.content.substring(0, 500) + (file.content.length > 500 ? '...' : ''));
});

console.log('\n' + '='.repeat(50));
console.log('\n✓ Test passed! Drift compiler is working correctly.');
