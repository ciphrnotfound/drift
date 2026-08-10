# Curly-Brace Syntax Migration Progress

## ✅ Completed: Lexer Migration

The lexer has been successfully updated to support curly-brace syntax:

### Changes Made:
1. **Removed indentation logic**
   - Removed `indentStack` tracking
   - Removed `INDENT` and `DEDENT` token generation
   - Removed `handleIndentation()` method

2. **Updated whitespace handling**
   - Newlines are now treated as regular whitespace (skipped)
   - No special indentation tracking

3. **Added modern syntax support**
   - `//` comments (instead of `#`)
   - `=>` arrow functions
   - Semicolons are optional (skipped if present)

4. **Exported Lexer**
   - Added `export * from './lexer'` to compiler index

### Test Results:
```
✓ Lexer successfully tokenizes curly-brace syntax
✓ All token types recognized correctly
✓ Comments, strings, numbers, token references work
✓ Braces, parentheses, brackets all work
```

## 🔄 Next: Parser Migration

The parser needs significant updates to handle curly-brace syntax:

### Required Changes:

#### 1. Update `parseComponent()` method
**Current** (expects indentation):
```typescript
// Expects INDENT/DEDENT tokens
while (!this.check(TokenType.DEDENT)) {
  // parse block content
}
```

**New** (expects braces):
```typescript
this.consume(TokenType.LBRACE, 'Expected {')
while (!this.check(TokenType.RBRACE)) {
  // parse block content
}
this.consume(TokenType.RBRACE, 'Expected }')
```

#### 2. Update `parseStyleBlock()` method
**New syntax**:
```drift
style Button {
  layout row center
  bg $color.ember
  
  hover {
    bg $color.ember.dark
  }
}
```

**Parser changes**:
- Expect `style` keyword
- Expect component name
- Expect `{`
- Parse style properties (key-value pairs, no colons)
- Parse nested blocks (hover, press, variants)
- Expect `}`

#### 3. Update `parseRenderBlock()` method
**New syntax**:
```drift
render Button({ label, onClick }) {
  <button onClick={onClick}>
    {label}
  </button>
}
```

**Parser changes**:
- Expect `render` keyword
- Expect component name
- Expect `(` parameters `)`
- Expect `{`
- Parse JSX content
- Expect `}`

#### 4. Update `parseMotionBlock()` method
**New syntax**:
```drift
motion fadeIn {
  enter fade rise(20px) float 320ms
  exit fade fall(20px) exhale 200ms
}
```

#### 5. Add support for inline styles
**New feature** (hybrid approach):
```drift
render Card({ title }) {
  <div class="col gap($space.4) pad($space.6) bg($color.surface)">
    <h2>{title}</h2>
  </div>
}
```

**Parser changes**:
- Parse `class` attribute
- Extract inline style shorthands
- Generate scoped CSS from inline styles

### Files to Update:
- `packages/compiler/src/parser.ts` - Main parser logic
- `packages/compiler/src/printer.ts` - Output formatting
- `packages/compiler/src/jsx-transformer.ts` - Handle inline class attributes
- `packages/compiler/src/__tests__/*.test.ts` - Update all tests

## 🎯 Implementation Strategy

### Phase 1: Basic Parser (Priority)
1. Update `parseStyleBlock()` for curly-brace syntax
2. Update `parseRenderBlock()` for curly-brace syntax
3. Remove all INDENT/DEDENT handling
4. Test basic component parsing

### Phase 2: Nested Blocks
1. Parse nested style blocks (hover, press, variants)
2. Parse motion blocks
3. Test complex components

### Phase 3: Inline Styles (Hybrid Feature)
1. Parse `class` attribute in JSX
2. Extract style shorthands (layout, bg, pad, etc.)
3. Generate CSS from inline styles
4. Test hybrid approach

### Phase 4: Printer & Tests
1. Update printer to output curly-brace syntax
2. Update all test files
3. Verify parse-print round trips

## 📝 Example Transformations

### Before (Indentation-based):
```drift
component Button
  props
    label: string
  
  style
    base
      padding: 12px
      background: $color.primary
    
    hover
      background: $color.primary.dark
  
  render
    <button>{label}</button>
```

### After (Curly-brace):
```drift
style Button {
  pad 12px
  bg $color.primary
  
  hover {
    bg $color.primary.dark
  }
}

render Button({ label }) {
  <button>{label}</button>
}
```

### Hybrid (Inline styles):
```drift
render Button({ label, variant }) {
  <button class="pad(12px) bg($color.primary) hover:bg($color.primary.dark)">
    {label}
  </button>
}
```

## 🚀 Ready to Continue

The lexer is complete and working. The next session should focus on updating the parser to handle the new token stream from the curly-brace lexer.

**Estimated time for parser migration**: 2-3 hours
**Estimated time for inline styles**: 1-2 hours
**Estimated time for tests**: 1 hour

**Total remaining**: ~4-6 hours to complete curly-brace migration
