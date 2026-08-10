import { describe, it, expect } from 'vitest'
import { DriftError, ErrorCode, ErrorCollector } from '../errors'
import { levenshteinDistance, findClosestMatches, suggestTokens } from '../suggestions'

describe('DriftError', () => {
  it('should create a DriftError with all required fields', () => {
    const error = new DriftError({
      code: ErrorCode.PARSE_UNEXPECTED_TOKEN,
      message: 'Unexpected token',
      file: 'test.drift',
      location: {
        start: { line: 1, column: 5, offset: 4 },
        end: { line: 1, column: 10, offset: 9 },
        source: 'component Button',
      },
    })

    expect(error.code).toBe(ErrorCode.PARSE_UNEXPECTED_TOKEN)
    expect(error.message).toBe('Unexpected token')
    expect(error.file).toBe('test.drift')
    expect(error.severity).toBe('error')
  })
})
    