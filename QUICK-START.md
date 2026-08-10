# Drift Quick Start Guide

Get up and running with Drift in 5 minutes.

## Installation

```bash
npx create-drift-app my-app
cd my-app
npm run dev
```

Your app is now running at http://localhost:5173

## Project Structure

```
my-app/
├── pages/
│   └── index.drift          # Home page
├── components/
│   └── Button.drift         # Example component
├── drift.tokens             # Design tokens
├── drift.config.ts          # Configuration
└── package.json
```

## Your First Component

Create `components/Button.drift`:

```drift
component Button {
  props {
    variant: "primary" | "secondary"
    size: "sm" | "md" | "lg"
  }

  style {
    display: flex
    align-items: center
    justify-content: center
    padding: $space.3 $space.6
    border-radius: $border.radius.md
    font-weight: 600
    cursor: pointer
    transition: all 0.2s $easing.smooth

    variant {
      primary {
        background: $color.blue.500
        color: $color.white
        hover {
          background: $color.blue.600
        }
      }
      secondary {
        background: $color.gray.200
        color: $color.gray.900
        hover {
          background: $color.gray.300
        }
      }
    }

    size {
      sm { 
        font-size: $text.sm
        padding: $space.2 $space.4
      }
      md { 
        font-size: $text.base
        padding: $space.3 $space.6
      }
      lg { 
        font-size: $text.lg
        padding: $space.4 $space.8
      }
    }
  }

  motion {
    hover {
      scale: 1.02
    }
    tap {
      scale: 0.98
    }
  }

  render {
    <button>{children}</button>
  }
}
```

## Design Tokens

Edit `drift.tokens`:

```drift
colors {
  blue.500: #3b82f6
  blue.600: #2563eb
  gray.200: #e5e7eb
  gray.300: #d1d5db
  gray.900: #111827
  white: #ffffff
}

spacing {
  scale: 1.5
  base: 4px
  // Generates: $space.1 (4px), $space.2 (6px), $space.3 (9px), etc.
}

typography {
  scale: 1.25
  base: 16px
  // Generates: $text.sm, $text.base, $text.lg, etc.
}

easing {
  smooth: cubic-bezier(0.4, 0, 0.2, 1)
}

borders {
  radius.md: 6px
}
```

## Using Your Component

In `pages/index.drift`:

```drift
import { Button } from "../components/Button.drift"

component HomePage {
  style {
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    min-height: 100vh
    gap: $space.4
  }

  render {
    <div>
      <h1>Welcome to Drift</h1>
      <Button variant="primary" size="md">
        Get Started
      </Button>
      <Button variant="secondary" size="sm">
        Learn More
      </Button>
    </div>
  }
}
```

## Routing

File-based routing is automatic:

```
pages/
├── index.drift              → /
├── about.drift              → /about
├── blog/
│   ├── index.drift          → /blog
│   └── [slug].drift         → /blog/:slug
└── [...catchAll].drift      → /* (404 page)
```

### Dynamic Routes

In `pages/blog/[slug].drift`:

```drift
component BlogPost {
  render {
    <div>
      <h1>Blog Post: {params.slug}</h1>
    </div>
  }
}
```

## Responsive Design

```drift
style {
  font-size: $text.sm
  padding: $space.2
  
  responsive {
    md {
      font-size: $text.base
      padding: $space.4
    }
    lg {
      font-size: $text.lg
      padding: $space.6
    }
  }
}
```

Default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Animations

```drift
motion {
  // Enter animation
  enter {
    opacity: 0
    y: -20
  }
  
  // Animate to
  animate {
    opacity: 1
    y: 0
    transition: {
      duration: 0.3
      easing: $easing.smooth
    }
  }
  
  // Exit animation
  exit {
    opacity: 0
    y: 20
  }
  
  // Gesture animations
  hover {
    scale: 1.05
  }
  
  tap {
    scale: 0.95
  }
}
```

## Configuration

Edit `drift.config.ts`:

```typescript
import { defineConfig } from '@drift/compiler'

export default defineConfig({
  compiler: {
    sourceMaps: true,
    minify: true
  },
  styles: {
    scoping: 'component',
    optimization: 'aggressive'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  },
  motion: {
    reducedMotion: 'respect'
  }
})
```

## CLI Commands

```bash
# Development server with HMR
npm run dev

# Production build
npm run build

# Static site export
npm run export

# Type checking
npm run type-check

# Run tests
npm test
```

## Next Steps

1. **Explore Examples** - Check out the `examples/` directory
2. **Read Documentation** - Visit the full documentation
3. **Join Community** - Connect with other Drift developers
4. **Build Something** - Start creating your app!

## Common Patterns

### Layout Component

```drift
component Layout {
  style {
    display: flex
    flex-direction: column
    min-height: 100vh
  }

  render {
    <div>
      <header>
        <nav>Navigation</nav>
      </header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  }
}
```

### Card Component

```drift
component Card {
  props {
    elevated: boolean
  }

  style {
    background: $color.white
    border-radius: $border.radius.lg
    padding: $space.6
    
    elevated {
      true {
        box-shadow: $shadow.lg
      }
      false {
        border: 1px solid $color.gray.200
      }
    }
  }

  render {
    <div>{children}</div>
  }
}
```

### Loading Spinner

```drift
component Spinner {
  style {
    width: 40px
    height: 40px
    border: 4px solid $color.gray.200
    border-top-color: $color.blue.500
    border-radius: 50%
  }

  motion {
    animate {
      rotate: 360
      transition: {
        duration: 1
        repeat: Infinity
        ease: "linear"
      }
    }
  }

  render {
    <div />
  }
}
```

## Tips

1. **Use tokens everywhere** - Reference design tokens with `$` for consistency
2. **Keep components small** - Break down complex UIs into smaller components
3. **Leverage variants** - Use variants for component variations instead of props
4. **Mobile-first** - Start with mobile styles, add responsive blocks for larger screens
5. **Animate wisely** - Use GPU-accelerated properties (transform, opacity) for smooth animations

## Getting Help

- **Documentation**: [Coming soon]
- **GitHub Issues**: https://github.com/drift-framework/drift/issues
- **Examples**: Check the `examples/` directory in the repo

Happy building with Drift! 🚀
