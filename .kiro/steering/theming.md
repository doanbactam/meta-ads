---
inclusion: always
---

# Theming System

This project uses **OKLCH color space** for perceptually uniform colors with CSS variables.

## Color System

All colors are defined using OKLCH (Lightness, Chroma, Hue) format in `app/globals.css`:

```css
--background: oklch(100% 0 0);  /* OKLCH format: lightness chroma hue */
```

### Why OKLCH?

- ✅ **Perceptually uniform** - Equal changes in values = equal visual changes
- ✅ **Wider color gamut** - Access to more vibrant colors
- ✅ **Better interpolation** - Smooth gradients and transitions
- ✅ **Predictable lightness** - 50% lightness looks consistently medium across all hues
- ✅ **Future-proof** - Modern CSS color space

### Usage in Components

Always use semantic color tokens, never hard-coded colors:

✅ **CORRECT:**
```tsx
<div className="bg-background text-foreground">
<span className="text-muted-foreground">
<Button variant="destructive">
```

❌ **WRONG:**
```tsx
<div className="bg-white text-black">
<span className="text-gray-500">
<span className="text-red-500">
```

## Available Color Tokens

### Base Colors
- `background` / `foreground` - Main background and text
- `card` / `card-foreground` - Card backgrounds
- `popover` / `popover-foreground` - Popover/dropdown backgrounds

### Semantic Colors
- `primary` / `primary-foreground` - Primary actions
- `secondary` / `secondary-foreground` - Secondary actions
- `muted` / `muted-foreground` - Muted/disabled states
- `accent` / `accent-foreground` - Accent highlights
- `destructive` / `destructive-foreground` - Destructive actions

### UI Elements
- `border` - Border colors
- `input` - Input field borders
- `ring` - Focus ring colors

### Charts
- `chart-1` through `chart-5` - Chart colors

## OKLCH Format

```css
oklch(L C H)
```

- **L (Lightness)**: 0% (black) to 100% (white)
- **C (Chroma)**: 0 (gray) to ~0.4 (vibrant) - varies by hue
- **H (Hue)**: 0-360 degrees (0=red, 120=green, 240=blue)

### Examples

```css
/* Neutral colors (C=0) */
--background: oklch(100% 0 0);     /* Pure white */
--foreground: oklch(9% 0 0);       /* Near black */
--muted: oklch(96.1% 0 0);         /* Light gray */

/* Colored (C>0) */
--destructive: oklch(60.2% 0.177 29.234);  /* Red */
--chart-1: oklch(61% 0.152 29);            /* Orange */
--chart-2: oklch(39% 0.116 173);           /* Cyan */
```

## Theme Switching

The app supports light/dark mode via `next-themes`:

```tsx
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
setTheme('dark'); // or 'light'
```

## Border Radius

Use semantic radius tokens:
- `rounded-lg` - Large radius (var(--radius))
- `rounded-md` - Medium radius (var(--radius) - 2px)
- `rounded-sm` - Small radius (var(--radius) - 4px)

## Customization

To customize colors, edit `app/globals.css`:

1. Modify OKLCH values in `:root` for light mode
2. Modify OKLCH values in `.dark` for dark mode
3. Colors automatically work with opacity modifiers: `bg-primary/50`

### Tips for Choosing Colors

- Keep **Lightness** consistent for similar elements
- Use **Chroma 0** for neutral grays
- Increase **Chroma** (0.1-0.2) for accent colors
- Use **Hue** to differentiate color families

### Color Palette Structure

```css
/* Light mode - High lightness */
:root {
  --background: oklch(100% 0 0);    /* L=100% - White */
  --foreground: oklch(9% 0 0);      /* L=9% - Near black */
  --muted: oklch(96.1% 0 0);        /* L=96% - Light gray */
  --border: oklch(89.8% 0 0);       /* L=90% - Border gray */
}

/* Dark mode - Low lightness */
.dark {
  --background: oklch(13% 0 0);     /* L=13% - Dark gray */
  --foreground: oklch(98% 0 0);     /* L=98% - Near white */
  --muted: oklch(20% 0 0);          /* L=20% - Muted dark */
  --border: oklch(20% 0 0);         /* L=20% - Border dark */
}
```

## Tools

- [OKLCH Color Picker](https://oklch.com/)
- [OKLCH Palette Generator](https://www.oklch.com/)
- Chrome DevTools supports OKLCH

## Browser Support

OKLCH is supported in:
- ✅ Chrome 111+
- ✅ Safari 15.4+
- ✅ Firefox 113+
- ✅ Edge 111+

For older browsers, colors will fallback gracefully.

## Reference

- Official documentation: https://ui.shadcn.com/docs/theming
- OKLCH specification: https://www.w3.org/TR/css-color-4/#ok-lab
- Color space comparison: https://bottosson.github.io/posts/oklab/
