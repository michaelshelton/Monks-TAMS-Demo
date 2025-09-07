# TAMS Dark Mode Implementation Guide

This guide explains how the dark mode functionality has been implemented in the VAST TAMS frontend application.

## Overview

The dark mode implementation provides:
- **Three theme modes**: Light, Dark, and Auto (follows system preference)
- **Persistent theme selection**: Saves user preference in localStorage
- **System preference detection**: Automatically detects and follows system dark mode preference
- **Comprehensive styling**: Full dark mode support for all Mantine components
- **Smooth transitions**: Animated theme switching for better UX

## Architecture

### 1. Theme Context (`src/contexts/ThemeContext.tsx`)
- Manages theme state and provides theme switching functionality
- Handles localStorage persistence
- Listens for system theme changes when in "auto" mode
- Sets data attributes on document for CSS targeting

### 2. Theme Toggle Component (`src/components/ThemeToggle.tsx`)
- Provides UI for theme switching
- Shows current theme mode with appropriate icons
- Two variants: full toggle with label and compact version

### 3. Dark Mode CSS (`src/styles/dark-mode-fixed.css`)
- Comprehensive dark mode styling for all Mantine components
- Uses CSS custom properties for consistent theming
- Targets both `data-mantine-color-scheme="dark"` and `data-theme="dark"` attributes

## Usage

### Basic Theme Toggle
```tsx
import { ThemeToggle } from './components/ThemeToggle';

// Full toggle with label
<ThemeToggle />

// Compact version
<ThemeToggleCompact />
```

### Using Theme Context
```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { colorScheme, setColorScheme, isDark, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {colorScheme}</p>
      <p>Is dark mode: {isDark ? 'Yes' : 'No'}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Theme Modes

### Light Mode
- Clean, bright interface
- High contrast text
- Light backgrounds and borders
- Standard Mantine light theme colors

### Dark Mode
- Dark backgrounds (#0d1117, #161b22, #21262d)
- Light text (#f0f6fc, #c9d1d9, #8b949e)
- Subtle borders and accents
- Optimized for low-light viewing

### Auto Mode
- Automatically follows system preference
- Updates when system theme changes
- Falls back to light mode if system preference unavailable

## CSS Custom Properties

The dark mode implementation uses CSS custom properties for consistent theming:

```css
/* Background colors */
--mantine-color-bg-0: #0d1117;  /* Primary background */
--mantine-color-bg-1: #161b22;  /* Secondary background */
--mantine-color-bg-2: #21262d;  /* Tertiary background */
--mantine-color-bg-3: #30363d;  /* Quaternary background */

/* Text colors */
--mantine-color-text-0: #f0f6fc;  /* Primary text */
--mantine-color-text-1: #c9d1d9;  /* Secondary text */
--mantine-color-text-2: #8b949e;  /* Tertiary text */
--mantine-color-text-3: #6e7681;  /* Quaternary text */

/* Border colors */
--mantine-color-border-0: #30363d;  /* Primary border */
--mantine-color-border-1: #21262d;  /* Secondary border */
--mantine-color-border-2: #161b22;  /* Tertiary border */

/* Accent colors */
--mantine-color-accent-0: #58a6ff;  /* Light accent */
--mantine-color-accent-1: #1f6feb;  /* Primary accent */
--mantine-color-accent-2: #0d419d;  /* Dark accent */
```

## Component Styling

All Mantine components are styled for dark mode:

- **Cards**: Dark backgrounds with subtle borders
- **Tables**: Alternating row colors for better readability
- **Buttons**: Proper contrast ratios for all variants
- **Inputs**: Dark backgrounds with light text
- **Modals**: Dark overlays and content areas
- **Navigation**: Dark header and menu styling
- **Badges**: Appropriate color schemes for all variants

## Custom TAMS Classes

The implementation includes custom classes for TAMS-specific components:

```css
/* Search interface */
.search-interface { /* Dark styling */ }

/* Video player */
.video-player-container { /* Dark styling */ }

/* Segment cards */
.segment-card { /* Dark styling */ }

/* CMCD panel */
.cmcd-panel { /* Dark styling */ }

/* Analytics panel */
.analytics-panel { /* Dark styling */ }
```

## Accessibility

The dark mode implementation includes:

- **High contrast ratios**: Meets WCAG AA standards
- **Focus indicators**: Visible focus states for keyboard navigation
- **Color independence**: Information not conveyed by color alone
- **Smooth transitions**: Prevents jarring theme changes

## Browser Support

- **Modern browsers**: Full support with CSS custom properties
- **Fallback support**: Graceful degradation for older browsers
- **System preference**: Uses `prefers-color-scheme` media query

## Performance

- **CSS-only transitions**: Smooth animations without JavaScript
- **Efficient selectors**: Optimized CSS for fast rendering
- **Minimal JavaScript**: Lightweight theme switching logic
- **localStorage caching**: Fast theme restoration on page load

## Testing

To test the dark mode implementation:

1. **Theme Toggle**: Click the theme toggle in the header
2. **System Preference**: Change your system theme while in "auto" mode
3. **Persistence**: Refresh the page to verify theme is saved
4. **Components**: Check all pages and components for proper dark styling
5. **Transitions**: Verify smooth theme switching animations

## Customization

To customize the dark mode theme:

1. **Update CSS variables** in `dark-mode-fixed.css`
2. **Modify color palette** in the ThemeContext
3. **Add new component styles** using the existing pattern
4. **Test across all pages** to ensure consistency

## Troubleshooting

### Theme not switching
- Check that `data-theme` attribute is set on document
- Verify CSS selectors match the data attributes
- Ensure CSS file is imported in main.tsx

### Styling inconsistencies
- Check for conflicting CSS rules
- Verify component-specific dark mode styles
- Test with browser dev tools

### Performance issues
- Check for excessive CSS transitions
- Verify efficient selector usage
- Monitor JavaScript execution time

## Future Enhancements

Potential improvements for the dark mode implementation:

- **Theme presets**: Multiple dark mode variations
- **User customization**: Allow users to adjust colors
- **Component-level theming**: More granular theme control
- **Animation preferences**: Respect user's motion preferences
- **High contrast mode**: Additional accessibility option

## Files Modified

- `src/App.tsx` - Theme provider integration
- `src/main.tsx` - CSS imports
- `src/contexts/ThemeContext.tsx` - Theme management
- `src/components/ThemeToggle.tsx` - Theme switching UI
- `src/styles/dark-mode-fixed.css` - Dark mode styles
- `src/styles/theme-demo.css` - Demo and additional styles

## Dependencies

- **Mantine**: UI component library
- **React**: Frontend framework
- **TypeScript**: Type safety
- **CSS Custom Properties**: Theme variables
