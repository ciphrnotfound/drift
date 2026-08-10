#!/usr/bin/env node

import { Command } from 'commander'
import { createApp } from './commands/create-app'

const program = new Command()

program
  .name('create-drift-app')
  .description('Create a new Drift application')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Template to use (minimal, default, full)', 'default')
  .option('--npm', 'Use npm as package manager')
  .option('--yarn', 'Use yarn as package manager')
  .option('--pnpm', 'Use pnpm as package manager')
  .option('--no-install', 'Skip dependency installation')
  .action(createApp)

program.parse()
