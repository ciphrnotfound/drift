# Working with Fonts and Assets in Drift

This guide explains how to use custom fonts, images, and other assets in your Drift applications.

## Fonts

### Drift Font API

Drift now includes a `next/font`-style package:

```ts
import { localFont, googleFont, getFontCSS, renderFontLinks } from '@drift/font'

export const sans = localFont({
  family: 'Inter',
  variable: '--font-sans',
  src: [
    { path: '/fonts/inter-roman.woff2', weight: '100 900' },
    { path: '/fonts/inter-italic.woff2', weight: '100 900', style: 'italic' },
  ],
})

export const display = googleFont({
  family: 'Geist Sans',
  weights: [400, 600, 700],
  variable: '--font-display',
})
```

Use it in React:

```tsx
<main className={sans.className}>
  ...
</main>
```

Or use generated CSS variables in Drift styles:

```drift
component Heading {
  style {
    font-family: var(--font-display)
  }

  render {
    <h1>{children}</h1>
  }
}
```

For SSR or static document generation, collect generated assets:

```ts
const css = getFontCSS()
const links = renderFontLinks()
```

Configure defaults in `drift.config.ts`:

```ts
export default {
  fonts: {
    strategy: 'self-hosted',
    display: 'swap',
    preload: true,
    variablePrefix: '--font',
  },
}
```

### Using System Fonts

Define font families in your `drift.tokens` file:

```drift
typography {
  // System font stack
  family.sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
  family.serif: Georgia, Cambria, "Times New Roman", Times, serif
  family.mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace
  
  // Font weights
  weight.normal: 400
  weight.medium: 500
  weight.semibold: 600
  weight.bold: 700
}
```

Use in components:

```drift
component Text {
  style {
    font-family: $typography.family.sans
    font-weight: $typography.weight.semibold
  }
  
  render {
    <p>{children}</p>
  }
}
```

### Using Google Fonts

1. **Add to your HTML** (`index.html`):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Drift App</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

2. **Define in tokens**:

```drift
typography {
  family.sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif
  
  weight.normal: 400
  weight.medium: 500
  weight.semibold: 600
  weight.bold: 700
}
```

3. **Use in components**:

```drift
component Heading {
  style {
    font-family: $typography.family.sans
    font-weight: $typography.weight.bold
  }
  
  render {
    <h1>{children}</h1>
  }
}
```

### Using Local Fonts

1. **Add font files to your project**:

```
public/
└── fonts/
    ├── CustomFont-Regular.woff2
    ├── CustomFont-Bold.woff2
    └── CustomFont-Italic.woff2
```

2. **Create a CSS file** (`src/fonts.css`):

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/CustomFont-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

3. **Import in your main file** (`src/main.tsx`):

```typescript
import './fonts.css'
import './index.css'
```

4. **Define in tokens**:

```drift
typography {
  family.custom: "CustomFont", sans-serif
}
```

### Variable Fonts

For variable fonts (recommended for performance):

```css
@font-face {
  font-family: 'InterVariable';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

```drift
typography {
  family.sans: "InterVariable", sans-serif
  
  // Use any weight from 100-900
  weight.light: 300
  weight.normal: 400
  weight.medium: 500
  weight.semibold: 600
  weight.bold: 700
  weight.black: 900
}
```

## Images

### Using Images in Components

#### 1. Public Directory (Recommended for Static Assets)

Place images in the `public/` directory:

```
public/
└── images/
    ├── logo.svg
    ├── hero-bg.jpg
    └── avatar.png
```

Reference with absolute paths:

```drift
component Logo {
  style {
    .logo-image {
      width: 120px
      height: auto
    }
  }
  
  render {
    <img src="/images/logo.svg" alt="Logo" className="logo-image" />
  }
}
```

#### 2. Imported Images (Optimized by Vite)

Import images in your component:

```drift
// Note: This requires TypeScript/JavaScript interop
// For now, use public directory or pass as props

component Avatar {
  props {
    imageUrl: string
    name: string
  }
  
  style {
    .avatar {
      width: 48px
      height: 48px
      border-radius: $border.radius.full
      object-fit: cover
    }
  }
  
  render {
    <img src={imageUrl} alt={name} className="avatar" />
  }
}
```

#### 3. External Images (CDN, Unsplash, etc.)

```drift
component Hero {
  props {
    imageUrl: string
  }
  
  style {
    .hero-image {
      width: 100%
      height: 400px
      object-fit: cover
      border-radius: $border.radius.lg
    }
  }
  
  render {
    <img 
      src={imageUrl} 
      alt="Hero" 
      className="hero-image"
      loading="lazy"
    />
  }
}
```

### Image Optimization Techniques

#### Responsive Images

```drift
component ResponsiveImage {
  props {
    src: string
    srcSet: string
    alt: string
  }
  
  style {
    .responsive-img {
      width: 100%
      height: auto
      display: block
    }
  }
  
  render {
    <img 
      src={src}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      alt={alt}
      className="responsive-img"
      loading="lazy"
    />
  }
}
```

Usage:

```drift
<ResponsiveImage
  src="/images/photo.jpg"
  srcSet="/images/photo-400.jpg 400w, /images/photo-800.jpg 800w, /images/photo-1200.jpg 1200w"
  alt="Description"
/>
```

#### Background Images

```drift
component HeroSection {
  props {
    backgroundUrl: string
  }
  
  style {
    .hero {
      min-height: 500px
      background-image: url({backgroundUrl})
      background-size: cover
      background-position: center
      background-repeat: no-repeat
      position: relative
    }
    
    .hero-overlay {
      position: absolute
      top: 0
      left: 0
      right: 0
      bottom: 0
      background: rgba(0, 0, 0, 0.4)
    }
    
    .hero-content {
      position: relative
      z-index: 1
      color: $color.white
      padding: $space.8
    }
  }
  
  render {
    <div className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        {children}
      </div>
    </div>
  }
}
```

#### Lazy Loading

Always use `loading="lazy"` for images below the fold:

```drift
<img 
  src="/images/large-photo.jpg" 
  alt="Description"
  loading="lazy"
/>
```

## Icons

### Using SVG Icons

#### 1. Inline SVG

```drift
component CheckIcon {
  style {
    .icon {
      width: 24px
      height: 24px
      fill: currentColor
    }
  }
  
  render {
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  }
}
```

#### 2. SVG from Public Directory

```drift
component Icon {
  props {
    name: string
    size: "sm" | "md" | "lg"
  }
  
  style {
    .icon {
      display: inline-block
    }
    
    size {
      sm { width: 16px; height: 16px }
      md { width: 24px; height: 24px }
      lg { width: 32px; height: 32px }
    }
  }
  
  render {
    <img 
      src={`/icons/${name}.svg`} 
      alt={name}
      className="icon"
    />
  }
}
```

#### 3. Icon Libraries (React Icons, Heroicons, etc.)

Install an icon library:

```bash
npm install react-icons
```

Create a wrapper component:

```typescript
// src/components/Icon.tsx
import * as Icons from 'react-icons/hi'

export function Icon({ name, ...props }: { name: string; [key: string]: any }) {
  const IconComponent = Icons[name as keyof typeof Icons]
  return IconComponent ? <IconComponent {...props} /> : null
}
```

Use in Drift components:

```drift
import { Icon } from "../Icon"

component Button {
  props {
    icon: string
  }
  
  style {
    display: flex
    align-items: center
    gap: $space.2
  }
  
  render {
    <button>
      <Icon name={icon} />
      {children}
    </button>
  }
}
```

## Other Assets

### Videos

```drift
component VideoPlayer {
  props {
    src: string
    poster: string
  }
  
  style {
    .video {
      width: 100%
      height: auto
      border-radius: $border.radius.lg
    }
  }
  
  render {
    <video 
      className="video"
      src={src}
      poster={poster}
      controls
      preload="metadata"
    >
      Your browser does not support the video tag.
    </video>
  }
}
```

### Audio

```drift
component AudioPlayer {
  props {
    src: string
  }
  
  style {
    .audio {
      width: 100%
    }
  }
  
  render {
    <audio className="audio" src={src} controls preload="metadata">
      Your browser does not support the audio tag.
    </audio>
  }
}
```

### PDFs and Documents

```drift
component DocumentViewer {
  props {
    pdfUrl: string
  }
  
  style {
    .pdf-container {
      width: 100%
      height: 600px
      border: $border.width.thin solid $color.gray.200
      border-radius: $border.radius.md
    }
  }
  
  render {
    <iframe 
      className="pdf-container"
      src={pdfUrl}
      title="PDF Viewer"
    />
  }
}
```

## Best Practices

### Performance

1. **Optimize images before uploading**
   - Use WebP format when possible
   - Compress images (TinyPNG, ImageOptim)
   - Generate multiple sizes for responsive images

2. **Use lazy loading**
   - Add `loading="lazy"` to images below the fold
   - Consider intersection observer for custom lazy loading

3. **Preload critical assets**
   ```html
   <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="/images/hero.jpg" as="image">
   ```

4. **Use CDN for external assets**
   - Unsplash, Cloudinary, imgix for images
   - Google Fonts, Adobe Fonts for typography

### Accessibility

1. **Always provide alt text**
   ```drift
   <img src="/photo.jpg" alt="Descriptive text" />
   ```

2. **Use semantic HTML**
   ```drift
   <figure>
     <img src="/chart.png" alt="Sales chart" />
     <figcaption>Q4 2024 Sales Performance</figcaption>
   </figure>
   ```

3. **Provide text alternatives for icons**
   ```drift
   <button>
     <Icon name="search" aria-hidden="true" />
     <span>Search</span>
   </button>
   ```

### Organization

```
project/
├── public/
│   ├── fonts/
│   │   └── CustomFont.woff2
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero/
│   │   └── products/
│   ├── icons/
│   │   └── *.svg
│   └── videos/
├── src/
│   ├── components/
│   ├── pages/
│   └── assets/
│       └── (imported assets)
└── drift.tokens
```

## Example: Complete Image Gallery

```drift
import { Card } from "./Card.drift"

component ImageGallery {
  props {
    images: Array<{
      url: string
      alt: string
      title: string
    }>
  }
  
  style {
    .gallery {
      display: grid
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))
      gap: $space.6
    }
    
    .gallery-item {
      cursor: pointer
    }
    
    .image-wrapper {
      width: 100%
      height: 250px
      overflow: hidden
      border-radius: $border.radius.md
      margin-bottom: $space.3
    }
    
    .gallery-image {
      width: 100%
      height: 100%
      object-fit: cover
      transition: transform 0.3s $easing.smooth
    }
    
    .image-title {
      font-size: $text.base
      font-weight: $typography.weight.semibold
      color: $color.gray.900
    }
    
    hover {
      .gallery-image {
        transform: scale(1.1)
      }
    }
  }
  
  render {
    <div className="gallery">
      {images.map((image, index) => (
        <Card key={index} className="gallery-item" hoverable={true}>
          <div className="image-wrapper">
            <img 
              src={image.url} 
              alt={image.alt}
              className="gallery-image"
              loading="lazy"
            />
          </div>
          <h3 className="image-title">{image.title}</h3>
        </Card>
      ))}
    </div>
  }
}
```

## Summary

- **Fonts**: Define in tokens, use system fonts or load custom fonts via CSS
- **Images**: Use public directory for static assets, pass URLs as props
- **Icons**: Inline SVG, icon libraries, or SVG files
- **Optimization**: Lazy loading, responsive images, WebP format
- **Accessibility**: Alt text, semantic HTML, ARIA labels

For more examples, check the `example-app/` directory in the repository.
