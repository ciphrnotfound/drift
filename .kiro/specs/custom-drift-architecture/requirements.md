# Requirements Document

## Introduction

This document defines the requirements for making Drift a fully custom and independent framework. Currently, Drift incorrectly depends on Vite for development tooling and Framer Motion for animations. The goal is to replace these dependencies with custom Drift implementations while maintaining React as the sole external UI library dependency. Drift compiles .drift files to React components, which is correct and should remain unchanged.

## Glossary

- **Drift**: A full-stack React framework with its own compiled language (.drift files)
- **Drift_Compiler**: The system that transforms .drift files into React components and CSS
- **Dev_Server**: The HTTP server that serves the application during development
- **HMR_System**: Hot Module Replacement system that updates modules without full page reload
- **Animation_Runtime**: The system that generates and executes animations in the browser
- **Module_Bundler**: The system that bundles JavaScript modules for the browser
- **Vite**: Third-party build tool currently used (to be replaced)
- **Framer_Motion**: Third-party animation library currently used (to be replaced)
- **Web_Animations_API**: Native browser API for creating animations
- **Motion_Generator**: Component that generates animation code from Drift motion blocks
- **File_Watcher**: System that monitors file changes and triggers recompilation
- **Build_System**: The system that produces production-ready output
- **esbuild**: Fast JavaScript bundler (can be used as an internal tool)

## Requirements

### Requirement 1: Custom Development Server

**User Story:** As a Drift developer, I want to run `drift dev` and get a custom Drift development server, so that Drift is independent from Vite.

#### Acceptance Criteria

1. WHEN a developer runs `drift dev`, THE Dev_Server SHALL start a custom HTTP server on the configured port
2. THE Dev_Server SHALL serve compiled React components from .drift files
3. THE Dev_Server SHALL serve static assets (HTML, CSS, images, fonts)
4. WHEN a .drift file changes, THE File_Watcher SHALL detect the change within 100ms
5. WHEN a file change is detected, THE Dev_Server SHALL trigger recompilation of affected modules
6. THE Dev_Server SHALL support HTTPS when configured
7. THE Dev_Server SHALL support custom host and port configuration
8. THE Dev_Server SHALL log server status and errors to the console
9. THE Dev_Server SHALL NOT depend on Vite's createServer API

### Requirement 2: Hot Module Replacement System

**User Story:** As a Drift developer, I want automatic hot reloading when I edit .drift files, so that I can see changes instantly without manual refresh.

#### Acceptance Criteria

1. WHEN a .drift file is modified, THE HMR_System SHALL update the module in the browser without full page reload
2. THE HMR_System SHALL preserve React component state during hot updates where possible
3. WHEN HMR fails, THE HMR_System SHALL fall back to full page reload
4. THE HMR_System SHALL establish a WebSocket connection between Dev_Server and browser
5. WHEN a module is updated, THE HMR_System SHALL send update notifications via WebSocket within 200ms
6. THE HMR_System SHALL handle circular dependencies gracefully
7. THE HMR_System SHALL update CSS without page reload
8. THE HMR_System SHALL display error overlays in the browser when compilation fails

### Requirement 3: Module Bundling System

**User Story:** As a Drift developer, I want my .drift files and dependencies bundled efficiently, so that the application loads quickly in the browser.

#### Acceptance Criteria

1. THE Module_Bundler SHALL bundle JavaScript modules for browser consumption
2. THE Module_Bundler SHALL resolve import statements in compiled React components
3. THE Module_Bundler SHALL support ES modules format
4. THE Module_Bundler SHALL handle node_modules dependencies
5. THE Module_Bundler SHALL generate source maps for debugging
6. WHERE esbuild is used as an internal tool, THE Module_Bundler SHALL wrap it in Drift's own API
7. THE Module_Bundler SHALL support code splitting for optimized loading
8. THE Module_Bundler SHALL NOT expose Vite-specific APIs to users

### Requirement 4: Web Animations API Runtime

**User Story:** As a Drift developer, I want animations defined in motion blocks to use the Web Animations API, so that Drift has no dependency on Framer Motion.

#### Acceptance Criteria

1. WHEN a motion block contains enter animations, THE Motion_Generator SHALL generate Web Animations API code
2. WHEN a motion block contains exit animations, THE Motion_Generator SHALL generate Web Animations API code
3. WHEN a motion block contains hover animations, THE Motion_Generator SHALL generate Web Animations API code
4. WHEN a motion block contains press animations, THE Motion_Generator SHALL generate Web Animations API code
5. WHEN a motion block contains scroll animations, THE Motion_Generator SHALL generate Web Animations API code
6. WHEN a motion block contains drag animations, THE Motion_Generator SHALL generate Web Animations API code
7. THE Motion_Generator SHALL NOT generate Framer Motion imports or API calls
8. THE Animation_Runtime SHALL support all easing curves defined in drift.tokens
9. THE Animation_Runtime SHALL support stagger animations for child elements
10. THE Animation_Runtime SHALL support animation sequences with delays

### Requirement 5: Automatic Reduced Motion Support

**User Story:** As an end user with motion sensitivity, I want animations to respect my prefers-reduced-motion setting, so that I can use Drift applications comfortably.

#### Acceptance Criteria

1. WHEN prefers-reduced-motion is set to reduce, THE Animation_Runtime SHALL disable complex motion animations
2. WHEN prefers-reduced-motion is set to reduce, THE Animation_Runtime SHALL preserve opacity-only transitions
3. WHEN prefers-reduced-motion is set to reduce, THE Animation_Runtime SHALL reduce animation duration to maximum 150ms
4. THE Motion_Generator SHALL automatically wrap all generated animations with prefers-reduced-motion checks
5. THE Animation_Runtime SHALL detect prefers-reduced-motion changes at runtime
6. THE Animation_Runtime SHALL update active animations when prefers-reduced-motion changes

### Requirement 6: Custom Animation Runtime Library

**User Story:** As a Drift developer, I want a custom @drift/motion package, so that I have a consistent animation API independent of third-party libraries.

#### Acceptance Criteria

1. THE Animation_Runtime SHALL be published as @drift/motion package
2. THE Animation_Runtime SHALL provide a JavaScript API for creating animations
3. THE Animation_Runtime SHALL support fade, rise, fall, shrink, grow animation shorthands
4. THE Animation_Runtime SHALL support custom transform animations
5. THE Animation_Runtime SHALL support opacity animations
6. THE Animation_Runtime SHALL support scale animations
7