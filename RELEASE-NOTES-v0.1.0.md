# Drift Framework v0.1.0 - Initial Release 🚀

We're excited to announce the first release of Drift - a full-stack React framework with a unified language for styling, animation, and structure.

## What is Drift?

Drift lets you write `.drift` files that compile into optimized React components, CSS, and TypeScript definitions. Instead of juggling multiple tools and syntaxes, you write everything in one expressive language.

## Highlights

### 🎨 Unified Language
Write components, styles, animations, and routing in a single, cohesive syntax:

```drift
component Button {
  props {
    variant: "primary" | "secondary"
  }

  style {
    padding: $space.3 $space.6
    border-radius: $border.radius.md
    
    variant {
      primary { background: $color.blue.500 }
      secondary { background: $color.gray.200 }
    }
  }

  motion {
    hover { scale: 1.05 }
    tap { scale: 0.95 }
  }

  render {
    <button>{children}</button>
  }
}
```

### 🎯 Design Tokens First
Define your design system once, use it everywhere:

```drift
colors {
  blue.500: #3b82f6
}

spacing {
  scale: 1.5
  base: 4px
}
```

Reference with `$color.blue.500`, `$space.3` - fully typed and validated.

### ⚡ Zero Configuration
```bash
npx create-drift-app my-app
cd my-app
npm run dev
```

That's it. No webpack config, no babel setup, no CSS-in-JS configuration.

### 🎭 Powerful Animations
Declarative animations powered by Framer Motion:

```drift
motion {
  enter { opacity: 0, y: -20 }
  animate { opacity: 1, y: 0 }
  hover { scale: 1.05 }
}
```

### 🗺️ File-Based Routing
Drop files in `pages/`, get routes automatically:

```
pages/
├── index.drift          → /
├── about.drift          → /about
└── blog/[slug].drift    → /blog/:slug
```

### 📱 Responsive by Default
Mobile-first responsive design built in:

```drift
style {
  font-size: $text.sm
  
  responsive {
    md { font-size: $text.base }
    lg { font-size: $text.lg }
  }
}
```

### 🔧 Full TypeScript Support
Automatic type generation for:
- Component props (from variants)
- Design tokens
- Route parameters
- Data loaders

### 🔥 Hot Module Replacement
Instant updates in development - change your `.drift` files and see results immediately.

## What's Included

### Packages
- `@drift/cli` - Command-line tools
- `@drift/compiler` - Core compilation pipeline
- `@drift/tokens` - Token system
- `@drift/style` - Style engine
- `@drift/motion` - Animation engine
- `@drift/router` - File-based routing
- `@drift/vite-plugin` - Vite integration
- `@drift/types` - TypeScript types
- `@drift/ui` - Base components (coming soon)

### CLI Commands
- `create-drift-app` - Project scaffolding
- `drift dev` - Development server
- `drift build` - Production build
- `drift export` - Static site generation

### Features
- ✅ Curly-brace syntax
- ✅ Design token system with scales
- ✅ Scoped CSS generation
- ✅ Variant system with type inference
- ✅ Responsive breakpoints
- ✅ Animation lifecycle (enter/exit)
- ✅ Gesture animations (hover/tap/focus)
- ✅ File-based routing
- ✅ Dynamic routes
- ✅ Layout hierarchy
- ✅ Component composition
- ✅ Error handling with suggestions
- ✅ Source maps
- ✅ HMR support
- ✅ TypeScript throughout

## Installation

```bash
# Create new app
npx create-drift-app my-app

# Or install packages individually
npm install @drift/cli @drift/compiler @drift/vite-plugin
```

## Quick Start

See [QUICK-START.md](./QUICK-START.md) for a comprehensive guide.

## Documentation

- [README.md](./README.md) - Overview and architecture
- [QUICK-START.md](./QUICK-START.md) - Get started in 5 minutes
- [PUBLISHING.md](./PUBLISHING.md) - Publishing guide
- [CHANGELOG.md](./CHANGELOG.md) - Detailed changelog

## Testing

This release includes:
- 78/79 tests passing ✅
- Unit tests with vitest
- Property-based testing infrastructure
- Integration tests

## Known Limitations

This is an initial release. Some features are not yet implemented:
- Rest parameters in props
- Default values with types in props
- AI primitives from vision document
- Visual regression testing
- Token-aware linting
- VS Code extension
- Drift Studio (visual token editor)

See [CHANGELOG.md](./CHANGELOG.md) for the full list of planned features.

## Performance

Drift is designed for performance:
- Scoped CSS with minimal overhead
- GPU-accelerated animations
- Code splitting support
- Tree-shaking friendly
- Optimized production builds

## Browser Support

Drift targets modern browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)

## Contributing

We welcome contributions! This project is in active development.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## Community

- **GitHub**: https://github.com/drift-framework/drift
- **Issues**: https://github.com/drift-framework/drift/issues
- **Discussions**: Coming soon

## License

MIT © 2024

See [LICENSE](./LICENSE) for details.

## Acknowledgments

Drift is built on the shoulders of giants:
- React - UI library
- Framer Motion - Animation library
- Vite - Build tool
- TypeScript - Type system
- pnpm - Package manager

## What's Next?

We're working on:
- Example projects and templates
- Comprehensive documentation site
- VS Code extension
- ESLint plugin
- Additional UI components
- Performance optimizations
- Community building

## Feedback

We'd love to hear from you! Please:
- Report bugs on GitHub Issues
- Share your projects built with Drift
- Suggest features and improvements
- Contribute to the codebase

## Thank You

Thank you for trying Drift! We're excited to see what you build.

Happy coding! 🎉

---

**Version**: 0.1.0  
**Release Date**: January 2024  
**License**: MIT
