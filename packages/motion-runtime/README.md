# @drift/motion-runtime

Custom animation runtime for Drift using Web Animations API. This package replaces Framer Motion with a lightweight, custom solution that provides full control over animations while reducing bundle size by 50%+.

## Features

- 🎨 **Web Animations API** - Built on native browser APIs
- 🪶 **Lightweight** - ~8-10KB minified + gzipped (vs 60KB for Framer Motion)
- ⚡ **GPU Accelerated** - Uses transform and opacity for smooth 60fps animations
- 🌊 **Spring Physics** - Real spring simulations for natural, bouncy motion
- 🧲 **Magnetic Cursor** - Apple.com-style magnetic button effects
- 📜 **Parallax Scrolling** - Multi-layer depth effects
- 🔗 **Scroll-Linked** - Animations tied directly to scroll position
- ♿ **Accessible** - Automatic prefers-reduced-motion support
- 🎯 **Type Safe** - Full TypeScript support
- 🌐 **Browser Support** - Chrome 36+, Firefox 48+, Safari 13.1+, Edge 79+

## Installation

```bash
pnpm add @drift/motion-runtime
```

## Usage

### Basic Animation

```typescript
import { animate } from '@drift/motion-runtime'

const element = document.querySelector('.box')
animate(element, [
  { opacity: 0, transform: 'scale(0.95)' },
  { opacity: 1, transform: 'scale(1)' }
], {
  duration: 300,
  easing: 'spring'
})
```

### Gesture Animations

```typescript
import { gesture } from '@drift/motion-runtime'

const button = document.querySelector('button')
const cleanup = gesture(button, 'hover', [
  { transform: 'scale(1.05)' }
], {
  duration: 200
})

// Clean up when done
cleanup()
```

### Scroll Animations

```typescript
import { scroll } from '@drift/motion-runtime'

const card = document.querySelector('.card')
scroll(card, [
  { opacity: 0, transform: 'translateY(20px)' },
  { opacity: 1, transform: 'translateY(0)' }
], {
  trigger: 'enter',
  threshold: 0.5
})
```

### Staggered Animations

```typescript
import { stagger } from '@drift/motion-runtime'

const items = document.querySelectorAll('.item')
stagger(Array.from(items), [
  { opacity: 0, transform: 'translateY(20px)' },
  { opacity: 1, transform: 'translateY(0)' }
], {
  duration: 300,
  stagger: 80 // 80ms delay between each item
})
```

### Animation Sequences

```typescript
import { sequence } from '@drift/motion-runtime'

sequence([
  {
    element: logo,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 300 }
  },
  {
    element: nav,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 300 }
  }
])
```

### Spring Physics (Apple-style)

```typescript
import { spring } from '@drift/motion-runtime'

const button = document.querySelector('button')
spring(button, [
  { transform: 'scale(1.1)' }
], {
  stiffness: 300,
  damping: 20,
  mass: 1
})
```

### Magnetic Cursor (Apple.com buttons)

```typescript
import { magnetic } from '@drift/motion-runtime'

const button = document.querySelector('.cta-button')
const cleanup = magnetic(button, {
  strength: 0.3,
  radius: 120,
  speed: 0.15
})
```

### Parallax Scrolling

```typescript
import { parallax } from '@drift/motion-runtime'

const background = document.querySelector('.hero-bg')
parallax(background, {
  speed: 0.5, // Moves at half scroll speed
  direction: 'vertical',
  smooth: true
})
```

### Scroll-Linked Animations (Apple product pages)

```typescript
import { scrollLinked } from '@drift/motion-runtime'

const product = document.querySelector('.product')
scrollLinked(product, [
  { opacity: 0, transform: 'scale(0.8)' },
  { opacity: 1, transform: 'scale(1)' }
], {
  start: '0%',
  end: '50%',
  smooth: true
})
```

## Easing Curves

Drift includes custom easing curves optimized for UI animations:

- `spring` - Bouncy overshoot for buttons and cards
- `snap` - Instant start, smooth land for menus and drawers
- `exhale` - Slow out for exits and fades
- `breathe` - Symmetric in-out for loops and pulses
- `float` - Dramatic ease-out for hero entrances

```typescript
import { easings } from '@drift/motion-runtime'

animate(element, keyframes, {
  easing: easings.spring
})
```

## API Reference

See [API Documentation](./docs/api.md) for full API reference.

## License

MIT
