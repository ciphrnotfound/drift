#!/usr/bin/env node

import { Command } from 'commander'
import { dev } from './commands/dev'
import { build } from './commands/build'
import { exportStatic } from './commands/export'
import { createApp } from './commands/create-app'

const program = new Command()

program
  .name('drift')
  .description('Drift Framework CLI')
  .version('0.1.0')

program
  .command('create [name]')
  .description('Create a new Drift application')
  .option('-t, --template <template>', 'Template: minimal, default, or full', 'default')
  .option('--npm', 'Use npm')
  .option('--yarn', 'Use yarn')
  .option('--pnpm', 'Use pnpm')
  .option('--no-install', 'Skip dependency installation')
  .action(createApp)

// drift dev command
program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-p, --port <port>', 'Port to run the dev server on', '3000')
  .option('-h, --host <host>', 'Host to bind the dev server to', 'localhost')
  .option('--open', 'Open browser on server start', false)
  .option('--https', 'Use HTTPS', false)
  .action(dev)

// drift build command
program
  .command('build')
  .description('Build for production with optimizations')
  .option('--out-dir <dir>', 'Output directory', 'dist')
  .option('--sourcemap', 'Generate source maps', false)
  .option('--minify', 'Minify output', true)
  .option('--target <target>', 'Deployment target: static or vercel', 'static')
  .action(build)

// drift export command
program
  .command('export')
  .description('Export static site')
  .option('--out-dir <dir>', 'Output directory', 'out')
  .option('--base-path <path>', 'Base path for URLs', '/')
  .action(exportStatic)

program.parse()
