// Test script to compile Drift files and see the output
import { compile } from '../packages/compiler/dist/index.js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read the TestButton component
const buttonSource = readFileSync(join(__dirname, 'components/TestButton.drift'), 'utf-8')
const tokensSource = readFileSync(join(__dirname, 'drift.tokens'), 'utf-8')

console.log('🚀 Compiling TestButton.drift...\n')
console.log('Source code:')
console.log('='.repeat(60))
console.log(buttonSource)
console.log('='.repeat(60))
console.log()

// Compile
const result = compile(buttonSource, {
  filename: 'TestButton.drift',
  tokens: tokensSource
})

if (result.errors.length > 0) {
  console.error('❌ Compilation errors:')
  result.errors.forEach(err => {
    console.error(`  ${err.code}: ${err.message}`)
    if (err.location) {
      console.error(`    at line ${err.location.line}, column ${err.location.column}`)
    }
  })
  process.exit(1)
}

console.log('✅ Compilation successful!\n')

// Create output directory
mkdirSync(join(__dirname, 'compiled'), { recursive: true })

// Show generated files
console.log('📦 Generated files:')
result.files.forEach(file => {
  console.log(`\n  📄 ${file.path}`)
  console.log(`  ${'='.repeat(60)}`)
  console.log(file.content)
  console.log(`  ${'='.repeat(60)}`)
  
  // Write to output directory
  const outPath = join(__dirname, 'compiled', file.path)
  writeFileSync(outPath, file.content)
  console.log(`  ✅ Written to: compiled/${file.path}`)
})

console.log('\n🎉 Drift compilation complete!')
console.log('\nYou can see:')
console.log('  - React component in: compiled/TestButton.tsx')
console.log('  - Scoped CSS in: compiled/TestButton.css')
console.log('  - TypeScript types in: compiled/TestButton.d.ts')
