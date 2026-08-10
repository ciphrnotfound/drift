# Custom Drift Animation Runtime - Requirements

## Overview
Replace Framer Motion with a custom animation runtime built on Web Animations API. This makes Drift's animations truly custom, reduces bundle size, and gives complete control over animation behavior. Keep Vite for now as it's battle-tested and fast.

## Goals
- Remove Framer Motion dependency completely
- Build custom animation runtime using Web Animations API
- Create @drift/motion-runtime package for runtime helpers
- Update motion code generator to output Web Animations API code
- Create @drift/ui package with custom components
- Keep Vite (pragmatic choice - can replace later if needed)
- **Enable Apple/Stripe/Linear-level animations** - smooth, polished, professional
- Support advanced effects: parallax, magnetic cursor, scroll-linked, inertia

---

## R1: Web Animations API Runtime

**Priority**: Critical  
**Description**: Replace Framer Motion with a custom animation runtime built on the Web Animations API, supporting all Drift motion features.

### Acceptance Criteria
- [ ] Generates Web Animations API code instead of Framer Motion
- [ ] Supports enter/exit animations (fade, rise, fall, shrink, grow)
- [ ] Supports gesture animations (hover, press, focus, drag)
- [ ] Supports scroll-triggered animations
- [ ] Supports animation sequences and staggering
- [ ] Automatic prefers-reduced-motion support
- [ ] GPU-accelerated transforms (translateX/Y, scale, opacity)
- [ ] Easing curve support (spring, snap, exhale, breathe, float)
- [ ] **Parallax scrolling effects** (elements move at different speeds)
- [ ] **Magnetic cursor effects** (elements follow cursor with spring physics)
- [ ] **Inertia/momentum** (drag with realistic physics)
- [ ] **Scroll-linked animations** (animation progress tied to scroll position)
- [ ] **Blur on scroll** (background blur as you scroll)
- [ ] **3D transforms** (rotateX, rotateY, perspective)

### Correctness Properties
- **P1.1**: All animations use Web Animations API, not Framer Motion
- **P1.2**: Animations respect prefers-reduced-motion setting
- **P1.3**: Transform animations use GPU acceleration (transform, opacity)
- **P1.4**: Animation timing matches specified duration and easing

---

## R2: Animation Runtime Package (@drift/motion-runtime)

**Priority**: Critical  
**Description**: Create a runtime package that provides helper functions and utilities for animations at runtime.

### Acceptance Criteria
- [ ] `animate()` function for imperative animations
- [ ] `sequence()` function for animation sequences
- [ ] `stagger()` function for staggered animations
- [ ] `scroll()` function for scroll-triggered animations
- [ ] `gesture()` function for gesture-based animations
- [ ] **`parallax()` function for parallax scrolling**
- [ ] **`magnetic()` function for magnetic cursor effects**
- [ ] **`inertia()` function for drag with momentum**
- [ ] **`scrollLinked()` function for scroll-progress animations**
- [ ] **`spring()` function for real spring physics**
- [ ] Easing curve implementations (cubic-bezier functions)
- [ ] Animation state management (play, pause, cancel, reverse)
- [ ] Performance monitoring and optimization
- [ ] TypeScript types for all functions
- [ ] Works in all modern browsers

### Correctness Properties
- **P2.1**: Runtime functions work in all modern browsers
- **P2.2**: Animations can be controlled (play, pause, cancel)
- **P2.3**: Scroll animations trigger at correct scroll positions
- **P2.4**: Stagger delays are evenly distributed

---

## R3: Motion Code Generator Updates

**Priority**: Critical  
**Description**: Update the motion code generator to output Web Animations API code instead of Framer Motion props.

### Acceptance Criteria
- [ ] Generates `element.animate()` calls instead of Framer Motion props
- [ ] Converts Drift motion syntax to Web Animations API keyframes
- [ ] Generates proper timing options (duration, delay, easing)
- [ ] Handles composite animations (multiple properties)
- [ ] Generates scroll observers for scroll-triggered animations
- [ ] Generates event listeners for gesture animations
- [ ] No Framer Motion imports in generated code
- [ ] Generated code uses @drift/motion-runtime helpers

### Correctness Properties
- **P3.1**: Generated code uses only Web Animations API
- **P3.2**: Keyframes correctly represent from/to values
- **P3.3**: Timing options match Drift motion block specifications
- **P3.4**: Generated code is valid TypeScript

---

## R4: Custom UI Library (@drift/ui)

**Priority**: High  
**Description**: Create a headless UI component library with common components pre-styled using Drift syntax.

### Acceptance Criteria
- [ ] Button component with variants (primary, secondary, ghost, danger)
- [ ] Card component with elevation and hover effects
- [ ] Input component with validation states
- [ ] Modal/Dialog component with animations
- [ ] Dropdown/Select component
- [ ] Tabs component
- [ ] Tooltip component
- [ ] All components are headless (unstyled by default)
- [ ] All components have Drift style examples
- [ ] Full TypeScript support with prop types
- [ ] Animations use @drift/motion-runtime

### Correctness Properties
- **P4.1**: All components are accessible (ARIA attributes)
- **P4.2**: Components work without JavaScript (progressive enhancement where possible)
- **P4.3**: Components are tree-shakeable
- **P4.4**: All components have proper TypeScript types

---

## R5: Remove Framer Motion Dependencies

**Priority**: High  
**Description**: Remove all Framer Motion dependencies and replace with custom animation runtime.

### Acceptance Criteria
- [ ] Remove framer-motion from all package.json files
- [ ] Update motion generator to use Web Animations API
- [ ] Create @drift/motion-runtime package
- [ ] Update example components to use new animation system
- [ ] Update documentation to remove Framer Motion references
- [ ] All animation tests pass with new runtime
- [ ] No Framer Motion imports anywhere in codebase

### Correctness Properties
- **P5.1**: No Framer Motion imports remain in codebase
- **P5.2**: All animations work with Web Animations API
- **P5.3**: Animation performance is equal or better than Framer Motion
- **P5.4**: Generated code is smaller without Framer Motion

---

## R6: Update Example App

**Priority**: Medium  
**Description**: Create example components and demo app showcasing the new Web Animations API runtime.

### Acceptance Criteria
- [ ] Update example-app components to use new animation system
- [ ] Create animated button with hover/press effects
- [ ] Create card with enter animation
- [ ] Create hero section with staggered animations
- [ ] Demo shows smooth 60fps animations
- [ ] All examples work in modern browsers
- [ ] Example shows bundle size reduction

### Correctness Properties
- **P6.1**: All example animations run at 60fps
- **P6.2**: Examples work without Framer Motion
- **P6.3**: Generated code is clean and readable
- **P6.4**: Examples demonstrate all animation features

---

## R7: Documentation Updates

**Priority**: Medium  
**Description**: Update all documentation to reflect the custom animation runtime and remove references to Framer Motion.

### Acceptance Criteria
- [ ] Update README.md with custom animation runtime information
- [ ] Update QUICK-START.md with animation examples
- [ ] Create ANIMATION-GUIDE.md explaining Web Animations API usage
- [ ] Update API documentation for @drift/motion-runtime
- [ ] Create migration guide from Framer Motion (if needed)
- [ ] Update vision document to reflect implementation
- [ ] Document performance benefits

### Correctness Properties
- **P7.1**: Documentation accurately describes current implementation
- **P7.2**: All code examples work with custom runtime
- **P7.3**: No broken links or outdated references
- **P7.4**: Documentation is clear and beginner-friendly

---

## Non-Functional Requirements

### Performance
- Animation frame rate: 60fps for all animations
- Bundle size reduction: 50%+ smaller without Framer Motion
- Animation startup latency: < 16ms (one frame)
- Memory usage: Minimal overhead for animation state

### Compatibility
- Node.js: >= 18.0.0
- Browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Operating Systems: Windows, macOS, Linux
- Web Animations API support required

### Scalability
- Supports 100+ simultaneous animations
- Efficient animation cleanup (no memory leaks)
- Handles complex animation sequences

---

## Success Metrics

1. **Independence**: Zero dependencies on Framer Motion
2. **Performance**: Animations as smooth as Framer Motion (60fps)
3. **Bundle Size**: 50%+ reduction in animation code size
4. **Developer Experience**: Simple API, clear errors, good documentation
5. **Feature Parity**: All Drift motion features work with Web Animations API

---

## Out of Scope (Future Versions)

- Custom dev server (keeping Vite for now)
- Custom bundler (keeping Vite's esbuild integration)
- Server-side rendering (SSR)
- Edge runtime support
- Visual regression testing
- Drift Studio (visual token editor)
- AI primitives (ai: blocks)

---

## Why Keep Vite?

Vite is battle-tested, extremely fast, and handles all the hard parts of dev tooling (HMR, source maps, module resolution, etc.). Building a custom dev server would take 3-6 months and might not be as good. We can always replace it later if needed, but for now it's the pragmatic choice that lets us focus on what makes Drift unique: the language, compiler, and animation system.
