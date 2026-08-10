# @drift/ui

Drift UI is the optional component library for Drift apps. It is Drift-style first, with Tailwind as an override/composition option.

## Setup

```tsx
import '@drift/ui/styles.css'
```

```tsx
import { Button, Card, CardBody, Input, Stack } from '@drift/ui'
```

## Drift Style Mode

The default CSS uses Drift design variables and data attributes:

```tsx
<Stack gap="4">
  <Input placeholder="Email" />
  <Button variant="primary">Continue</Button>
</Stack>
```

Override the visual system with CSS variables:

```css
:root {
  --drift-ui-primary: #7c3aed;
  --drift-ui-radius-md: 10px;
}
```

## Tailwind Mode

Every component accepts `tw`, plus normal `className`. Drift classes are emitted first, so Tailwind utilities can override them when Tailwind is enabled:

```tsx
<Button tw="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg">
  Save
</Button>
```

Use Drift style for stable design-system defaults, then use Tailwind for local one-off composition.
