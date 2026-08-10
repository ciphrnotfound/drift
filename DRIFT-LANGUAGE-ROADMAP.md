# Drift Language Roadmap

Goal: make Drift feel like a frontend-native language, not just React plus custom style blocks.

## North Star

Drift should make the common frontend path tiny, typed, responsive, animated, accessible, and fast by default:

```drift
component Button {
  props {
    variant: "primary" | "secondary" = "primary"
    size: "sm" | "md" | "lg" = "md"
    loading?: boolean
  }

  style {
    layout: row center gap($space.2)
    pad: $space.3 $space.6

    variant {
      variant {
        primary { bg: $color.primary.600 text: white }
        secondary { bg: $color.surface text: $color.gray.900 }
      }
    }

    responsive {
      md { pad: $space.4 $space.8 }
    }
  }

  motion {
    hover { scale: 1.02 }
    press { scale: 0.98 }
  }

  render {
    <button aria-busy={loading}>{children}</button>
  }
}
```

## Priority 1: Language Feel

- Support prop defaults: `size: "sm" | "md" = "md"`.
- Support optional props with defaults and generated TypeScript defaults.
- Add `class` as an alias for `className` in render blocks.
- Add `slot` blocks for component composition: `slot icon`, `slot actions`.
- Add `if` and `each` in render blocks; the lexer already has keywords for them.

## Priority 2: Styling Power

- Support nested selectors: `.icon { ... }`, `&[data-active] { ... }`.
- Support container queries: `container md { ... }`.
- Promote layout primitives: `stack`, `cluster`, `sidebar`, `grid(auto, min: 16rem)`.
- Add state selectors: `disabled`, `checked`, `invalid`, `open`, `selected`.
- Add design-token validation so unknown tokens produce suggestions.

## Priority 3: Motion That Feels Built In

- Add named transitions: `transition: spring`, `transition: smooth`.
- Add shared motion presets: `motion use fadeUp(duration: 0.2)`.
- Respect reduced motion by default in generated components.
- Support layout animation with a single `layout` motion flag.

## Priority 4: Frontend Correctness

- Add accessibility warnings for interactive elements without labels.
- Warn when clickable non-buttons are used without keyboard support.
- Warn on invalid nesting and missing image alt text.
- Generate better source locations with real line and column numbers.

## Priority 5: Developer Experience

- Add formatter support for `.drift`.
- Add language-server diagnostics and completions.
- Make compiler errors show expected Drift syntax, not raw token names.
- Keep README examples covered by tests so docs and compiler never drift apart.
