# Custom DocFX Theme

This directory contains custom styling for the DocFX-generated API documentation, inspired by the clean, modern design of doxygen-awesome-css.

## Structure

```
custom/
└── styles/
    └── main.css    # Custom CSS overrides
```

## Features

- **Modern Design**: Clean, minimal aesthetic with improved typography
- **Dark Mode**: Automatic dark mode support based on system preferences
- **Accessibility**: Enhanced focus styles and proper contrast ratios
- **Responsive**: Mobile-friendly layout adjustments
- **Performance**: Uses CSS custom properties for efficient theming

## Customization

To modify the theme, edit `styles/main.css`. The CSS uses custom properties (CSS variables) defined in the `:root` selector, making it easy to adjust colors and spacing throughout the theme.

### Key CSS Variables

```css
--primary-color: #0078d4;        /* Primary brand color */
--background-color: #ffffff;     /* Main background */
--surface-color: #faf9f8;        /* Surface/card background */
--border-color: #edebe9;         /* Border color */
--text-color: #323130;           /* Primary text color */
--code-background: #f3f2f1;      /* Code block background */
```

## Building Documentation

The custom theme is automatically applied when building documentation:

```bash
npm run docs
```

This will generate the documentation in the `_site` directory with the custom theme applied.

## DocFX Template System

DocFX allows custom templates to override the default theme. Our custom template:

1. Extends the default DocFX template
2. Adds custom CSS in `styles/main.css`
3. Is configured in `docfx.json` via the `template` array

For more information, see the [DocFX documentation](https://dotnet.github.io/docfx/docs/template.html).
