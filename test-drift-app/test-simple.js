const { Parser } = require('../packages/compiler/dist/index.js');
const fs = require('fs');

const source = fs.readFileSync('Button.drift', 'utf-8');

console.log('Parsing Button.drift...\n');

try {
  const parser = new Parser(source, 'Button.drift');
  const ast = parser.parse();
  console.log('Success!');
  console.log(`Found ${ast.components.length} component(s)`);
  ast.components.forEach((comp, i) => {
    console.log(`\nComponent ${i + 1}: ${comp.name}`);
    console.log(`  - Props: ${comp.props.map(p => p.name).join(', ')}`);
    console.log(`  - Base styles: ${comp.styles.base.length}`);
    comp.styles.base.forEach(rule => {
      console.log(`    - ${rule.property}: ${JSON.stringify(rule.value)}`);
    });
    console.log(`  - Variants: ${comp.styles.variants.length}`);
    comp.styles.variants.forEach(v => {
      console.log(`    - ${v.name}`);
    });
    console.log(`  - Render elements: ${comp.render.elements.length}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}
