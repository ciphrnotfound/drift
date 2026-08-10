import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = fileURLToPath(new URL('../example-app/dist/', import.meta.url))
const limits = {
  javascriptGzip: 120 * 1024,
  cssGzip: 16 * 1024,
  largestChunkGzip: 52 * 1024,
  totalOutput: 2 * 1024 * 1024,
}

const files = walk(root)
const assets = files.map(file => ({
  file,
  extension: extname(file),
  raw: statSync(file).size,
  gzip: ['.js', '.css'].includes(extname(file)) ? gzipSync(readFileSync(file)).byteLength : 0,
}))
const javascript = assets.filter(asset => asset.extension === '.js')
const css = assets.filter(asset => asset.extension === '.css')
const totals = {
  javascriptGzip: sum(javascript, 'gzip'),
  cssGzip: sum(css, 'gzip'),
  largestChunkGzip: Math.max(0, ...javascript.map(asset => asset.gzip)),
  totalOutput: sum(assets, 'raw'),
}

let failed = false
for (const [name, limit] of Object.entries(limits)) {
  const actual = totals[name]
  const status = actual <= limit ? 'pass' : 'FAIL'
  console.log(`[budget] ${status} ${name}: ${format(actual)} / ${format(limit)}`)
  if (actual > limit) failed = true
}

if (failed) process.exitCode = 1

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = join(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

function sum(items, key) {
  return items.reduce((total, item) => total + item[key], 0)
}

function format(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}
