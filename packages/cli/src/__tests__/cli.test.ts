import { describe, it, expect } from 'vitest'
import * as cli from '../index'

describe('CLI exports', () => {
  it('should export createApp function', () => {
    expect(cli.createApp).toBeDefined()
    expect(typeof cli.createApp).toBe('function')
  })

  it('should export dev function', () => {
    expect(cli.dev).toBeDefined()
    expect(typeof cli.dev).toBe('function')
  })

  it('should export build function', () => {
    expect(cli.build).toBeDefined()
    expect(typeof cli.build).toBe('function')
  })

  it('should export exportStatic function', () => {
    expect(cli.exportStatic).toBeDefined()
    expect(typeof cli.exportStatic).toBe('function')
  })
})
