# Testing Drift Before Publishing

This guide walks you through testing the Drift framework with a real application before publishing to npm.

## Quick Test (5 minutes)

### 1. Build All Packages

```bash
pnpm build
```

Verify all packages build successfully without errors.

### 2. Run Tests

```bash
pnpm test
```

Expected: 78/79 tests passing ✅

### 3. Test Compilation

```bash
cd test-drift-app
node test-compile.js
```

This tests the compiler with the Button.drift example.

## Full Integration Test (30 minutes)

### 1. Create Example App

```bash
cd example-app
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:5173 and verify:
- ✅ Page loads without errors
- ✅ Styles are applied correctly
- ✅ Animations work (hover effects, transitions)
- ✅ Images load properly
- ✅ Responsive design works (resize browser)
- ✅ HMR works (edit a .drift file and see instant updates)

### 3. Test Hot Module Replacement

1. Open `example-app/components/Button.drift`
2. Change a color: `background: $color.primary.500` → `background: $color.success`
3. Save the file
4. Verify the button color updates instantly without page reload

### 4. Test Token Changes

1. Open `example-app/drift.tokens`
2. Change a token: `primary.500: #3b82f6` → `primary.500: #ef4444`
3. Save the file
4. Verify all components using that token update

### 5. Build for Production

```bash
pnpm build
```

Verify:
- ✅ Build completes without errors
- ✅ Output files are generated in `dist/`
- ✅ CSS is minified
- ✅ JavaScript is bundled

### 6. Preview Production Build

```bash
pnpm preview
```

Visit the preview URL and verify everything works in production mode.

## Create a Real Website Test

Let's build a complete multi-page website to test all features:

### 1. Create New Test Project

```bash
mkdir drift-test-website
cd drift-test-website
pnpm init
```

### 2. Install Dependencies

```bash
pnpm add react react-dom framer-motion
pnpm add -D @drift/compiler @drift/vite-plugin @vitejs/plugin-react vite typescript
```

### 3. Create Project Structure

```
drift-test-website/
├── public/
│   └── images/
│       └── (add some test images)
├── src/
│   ├── components/
│   │   ├── Button.drift
│   │   ├── Card.drift
│   │   ├── Header.drift
│   │   └── Footer.drift
│   ├── pages/
│   │   ├── index.drift
│   │   ├── about.drift
│   │   └── contact.drift
│   ├── main.tsx
│   └── index.css
├── drift.tokens
├── drift.config.ts
├── vite.config.ts
├── tsconfig.json
├── index.html
└── package.json
```

### 4. Test Checklist

Create pages and components that test:

#### Styling Features
- [ ] Basic styles (colors, spacing, typography)
- [ ] Token references ($color.primary.500, $space.4, etc.)
- [ ] Variants (primary/secondary buttons, different sizes)
- [ ] Responsive breakpoints (mobile, tablet, desktop)
- [ ] Pseudo-states (hover, focus, active)
- [ ] Nested selectors (.card .title)
- [ ] CSS properties (flexbox, grid, positioning)

#### Animation Features
- [ ] Enter/exit animations
- [ ] Hover animations
- [ ] Tap/click animations
- [ ] Gesture animations (drag, if applicable)
- [ ] Transition timing and easing
- [ ] Stagger animations (multiple items)

#### Component Features
- [ ] Props with types
- [ ] Variant props (automatic type inference)
- [ ] Children content
- [ ] Component composition (importing other components)
- [ ] Conditional rendering
- [ ] Lists and mapping

#### Routing Features
- [ ] Multiple pages (/, /about, /contact)
- [ ] Navigation between pages
- [ ] Dynamic routes (/blog/[slug])
- [ ] Catch-all routes (404 page)
- [ ] Link component with hover prefetch

#### Asset Features
- [ ] Images from public directory
- [ ] External images (CDN)
- [ ] Background images
- [ ] SVG icons
- [ ] Custom fonts (Google Fonts or local)
- [ ] Font weights and families

#### Developer Experience
- [ ] TypeScript types generated correctly
- [ ] Error messages are helpful
- [ ] HMR works smoothly
- [ ] Build is fast
- [ ] Source maps work for debugging

### 5. Performance Testing

```bash
# Build for production
pnpm build

# Check bundle sizes
ls -lh dist/assets/

# Analyze bundle (optional)
pnpm add -D rollup-plugin-visualizer
```

Expected bundle sizes (approximate):
- Main JS: < 150KB (gzipped)
- CSS: < 20KB (gzipped)
- Vendor chunks: Separate React/Framer Motion bundles

### 6. Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if on Mac)

Test responsive design:
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1280px width)
- [ ] Large desktop (1920px width)

## Common Issues and Solutions

### Issue: "Cannot find module '@drift/compiler'"

**Solution**: Make sure you've built all packages first:
```bash
cd /path/to/drift-monorepo
pnpm build
```

### Issue: Styles not applying

**Solution**: 
1. Check that the Vite plugin is configured correctly
2. Verify drift.tokens file exists
3. Check browser console for errors

### Issue: HMR not working

**Solution**:
1. Restart dev server
2. Check Vite plugin configuration
3. Verify file watching is enabled

### Issue: Build fails

**Solution**:
1. Check for TypeScript errors: `pnpm type-check`
2. Verify all imports are correct
3. Check drift.config.ts syntax

### Issue: Images not loading

**Solution**:
1. Verify images are in `public/` directory
2. Use absolute paths: `/images/photo.jpg`
3. Check image URLs in props

## Automated Testing Script

Create `test-all.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Drift Framework..."

# Build packages
echo "📦 Building packages..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build successful"

# Run tests
echo "🧪 Running tests..."
pnpm test --run
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi
echo "✅ Tests passed"

# Test example app
echo "🏗️  Testing example app..."
cd example-app
pnpm install
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Example app build failed"
  exit 1
fi
echo "✅ Example app built successfully"

cd ..
echo "✅ All tests passed! Ready to publish."
```

Run it:
```bash
chmod +x test-all.sh
./test-all.sh
```

## Manual Testing Checklist

Before publishing, manually verify:

### Core Functionality
- [ ] Compiler transforms .drift files correctly
- [ ] Generated React components work
- [ ] Generated CSS is scoped and correct
- [ ] TypeScript types are generated
- [ ] Token resolution works
- [ ] Error messages are helpful

### CLI Commands
- [ ] `create-drift-app` creates a working project
- [ ] `drift dev` starts dev server
- [ ] `drift build` creates production build
- [ ] `drift export` generates static site

### Developer Experience
- [ ] Documentation is clear
- [ ] Examples work
- [ ] Error messages are helpful
- [ ] TypeScript support works
- [ ] IDE integration works (if applicable)

### Production Readiness
- [ ] Builds are optimized
- [ ] CSS is minified
- [ ] JavaScript is bundled correctly
- [ ] Source maps work
- [ ] No console errors in production

## Final Verification

Before publishing to npm:

1. **Clean install test**:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   pnpm build
   pnpm test
   ```

2. **Package test**:
   ```bash
   cd packages/compiler
   npm pack
   # Inspect the .tgz file contents
   tar -xzf drift-compiler-0.1.0.tgz
   ls -la package/
   ```

3. **Version check**:
   - All packages at 0.1.0
   - package.json metadata correct
   - LICENSE file present
   - README files complete

4. **Documentation check**:
   - README.md is comprehensive
   - CHANGELOG.md is up to date
   - Examples work
   - API documentation exists

## Success Criteria

✅ All packages build without errors  
✅ 78/79 tests passing  
✅ Example app runs in dev mode  
✅ Example app builds for production  
✅ HMR works correctly  
✅ All features tested manually  
✅ Documentation is complete  
✅ No critical bugs found  

If all criteria are met, you're ready to publish! 🚀

## Next Steps

1. Follow [PUBLISHING.md](./PUBLISHING.md) to publish to npm
2. Create GitHub release with [RELEASE-NOTES-v0.1.0.md](./RELEASE-NOTES-v0.1.0.md)
3. Share with the community
4. Gather feedback
5. Plan next release

Good luck! 🎉
