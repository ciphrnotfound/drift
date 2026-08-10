# Drift Styling Options - Making It Even Easier

## Current Vision (Separate style block)

```drift
// components/Button.drift

style Button {
  layout   row center gap($space.2)
  bg       $color.ember
  text     $type.sm bold white
  radius   $radius.pill
  pad      $space.2 $space.5
  cursor   pointer

  hover {
    bg     $color.ember.dark
    rise   2px
  }

  sm {
    text   $type.xs
    pad    $space.1 $space.3
  }
}

render Button({ label, size, onClick }) {
  <button onClick={onClick}>
    {label}
  </button>
}
```

## Option 1: Inline Styles (Tailwind-like but with tokens)

```drift
render Button({ label, size, onClick }) {
  <button 
    class="row center gap($space.2) bg($color.ember) text($type.sm bold white) 
           radius($radius.pill) pad($space.2 $space.5) cursor(pointer)
           hover:bg($color.ember.dark) hover:rise(2px)
           sm:text($type.xs) sm:pad($space.1 $space.3)"
    onClick={onClick}
  >
    {label}
  </button>
}
```

**Pros**: 
- Everything in one place
- Very fast to write
- Familiar to Tailwind users

**Cons**:
- Can get verbose for complex components
- Harder to reuse styles
- Less separation of concerns

## Option 2: Inline Style Object (React-like but compiled)

```drift
render Button({ label, size, onClick }) {
  <button 
    style={{
      layout: "row center",
      gap: $space.2,
      bg: $color.ember,
      text: "$type.sm bold white",
      radius: $radius.pill,
      pad: "$space.2 $space.5",
      cursor: "pointer",
      
      hover: {
        bg: $color.ember.dark,
        rise: "2px"
      },
      
      [size === 'sm']: {
        text: $type.xs,
        pad: "$space.1 $space.3"
      }
    }}
    onClick={onClick}
  >
    {label}
  </button>
}
```

**Pros**:
- Familiar to React developers
- Dynamic styles with JS expressions
- Type-safe with TypeScript

**Cons**:
- More verbose than shorthand
- Requires object syntax

## Option 3: Hybrid (Best of Both Worlds) ⭐ RECOMMENDED

Keep the `style` block for reusable component styles, but allow inline overrides:

```drift
style Button {
  layout   row center gap($space.2)
  bg       $color.ember
  text     $type.sm bold white
  radius   $radius.pill
  pad      $space.2 $space.5
  cursor   pointer

  hover {
    bg     $color.ember.dark
  }
}

render Button({ label, variant, onClick }) {
  <button 
    class={variant === 'danger' ? 'bg($color.red)' : ''}
    onClick={onClick}
  >
    {label}
  </button>
}
```

**Pros**:
- Base styles in `style` block (reusable, clean)
- Dynamic overrides inline (flexible)
- Best of both worlds

## Option 4: Ultra-Minimal (One-liner components)

For simple components, allow everything inline:

```drift
export Button = ({ label, onClick }) => (
  <button 
    class="row center bg($color.ember) pad($space.2 $space.5) radius($radius.pill) 
           hover:bg($color.ember.dark) cursor(pointer)"
    onClick={onClick}
  >
    {label}
  </button>
)
```

**Pros**:
- Extremely concise
- No ceremony for simple components
- Fast prototyping

**Cons**:
- Not suitable for complex components
- Less structured

## Option 5: Layout Shorthands (From Vision Document)

The vision document has amazing layout shorthands:

```drift
render Card({ title, children }) {
  <div class="col gap($space.4) pad($space.6) bg($color.surface) radius($radius.lg)">
    <h2 class="text($type.xl bold)">{title}</h2>
    <div class="col gap($space.2)">
      {children}
    </div>
  </div>
}
```

**Built-in shorthands**:
- `row` = flex row
- `col` = flex column
- `center` = center items
- `grid(3)` = 3-column grid
- `stack` = absolute positioning
- `gap($space.2)` = gap between items
- `pad($space.4)` = padding
- `bg($color.x)` = background
- `text($type.x)` = typography

## My Recommendation: Hybrid + Shorthands

```drift
// For reusable components with variants
style Button {
  layout   row center gap($space.2)
  bg       $color.ember
  text     $type.sm bold white
  radius   $radius.pill
  pad      $space.2 $space.5
  cursor   pointer

  hover {
    bg     $color.ember.dark
    rise   2px
  }

  // Variants
  ghost {
    bg       transparent
    border   1px $color.ember
    text     $color.ember
  }

  danger {
    bg   $color.red
  }
}

render Button({ label, variant, onClick }) {
  <button onClick={onClick}>
    {label}
  </button>
}

// For simple one-off components
export Card = ({ title, children }) => (
  <div class="col gap($space.4) pad($space.6) bg($color.surface) radius($radius.lg)">
    <h2 class="text($type.xl bold)">{title}</h2>
    {children}
  </div>
)
```

## What Would You Prefer?

1. **Full inline** (Option 1) - Everything in class attribute, Tailwind-style
2. **Style object** (Option 2) - React-style inline objects
3. **Hybrid** (Option 3) - Style block + inline overrides ⭐
4. **Ultra-minimal** (Option 4) - One-liner components
5. **Keep vision** - Separate style blocks as designed

Or we could support **multiple approaches** and let developers choose based on the component complexity!

## Implementation Impact

- **Option 1-2**: Requires parser changes to handle inline styles
- **Option 3**: Already mostly supported, just need inline class parsing
- **Option 4**: Simplest, just arrow function components
- **Option 5**: Already in the vision document

What feels most natural to you?
