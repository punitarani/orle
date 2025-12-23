---
name: UI/UX Polish Pass
overview: Comprehensive UI/UX improvements across all tool pages to create a smooth, intuitive, and visually polished experience with proper image previews, enhanced diff views, visual color tools, and full mobile responsiveness.
todos:
  - id: types-update
    content: Add new output types (image-result, color, diff) to types.ts
    status: completed
  - id: image-input-preview
    content: Add image preview thumbnail to ToolInput when image file uploaded
    status: completed
    dependencies:
      - types-update
  - id: image-tool-output
    content: Create ImageToolOutput component with before/after preview and stats
    status: completed
    dependencies:
      - types-update
  - id: dual-input
    content: Create DualInput component for side-by-side diff inputs
    status: completed
  - id: diff-output
    content: Create DiffOutput component with syntax highlighting
    status: completed
    dependencies:
      - dual-input
  - id: color-output
    content: Create ColorOutput component with visual swatches and previews
    status: completed
    dependencies:
      - types-update
  - id: tool-page-routing
    content: Update ToolPage to route to specialized output components
    status: completed
    dependencies:
      - image-tool-output
      - diff-output
      - color-output
  - id: mobile-layout
    content: Update tool-page and tool-options for mobile responsiveness
    status: completed
  - id: toast-clipboard
    content: Add toast notifications for copy actions
    status: completed
  - id: loading-empty-states
    content: Improve loading and empty states with better visuals
    status: completed
  - id: keyboard-hints
    content: Add keyboard shortcut hints to UI
    status: completed
  - id: update-image-tools
    content: Update image tool transforms to return structured data
    status: completed
    dependencies:
      - types-update
  - id: update-diff-tools
    content: Update diff tools to use dual input type
    status: completed
    dependencies:
      - dual-input
  - id: update-color-tools
    content: Update color tools to return structured color data
    status: completed
    dependencies:
      - color-output
---

# UI/UX Polish and Enhancement Plan

## Overview

This plan addresses UI/UX improvements across all 127+ tools, focusing on: (1) enhanced image tool previews, (2) better diff tool layouts, (3) visual color tools, (4) improved mobile responsiveness, and (5) general polish.---

## 1. Enhanced Image Tool Components

The current image tools output text with blob URLs. We need proper visual previews.

### Changes:

**Create [`src/components/tools/image-tool-output.tsx`](src/components/tools/image-tool-output.tsx)**

- Show input image preview when file is uploaded
- Show output image preview with download button
- Display compression stats (original size, new size, savings %)
- Side-by-side layout on desktop, stacked on mobile

**Update [`src/components/tools/tool-input.tsx`](src/components/tools/tool-input.tsx)**

- Add image preview thumbnail when an image file is uploaded
- Show file name, size, and dimensions
- Add "Remove" button overlay

**Update [`src/lib/tools/sections/images.ts`](src/lib/tools/sections/images.ts)**

- Change `outputType` from `"download"` to `"image-result"` (new type)
- Return structured data: `{ originalUrl, resultUrl, originalSize, resultSize, dimensions }`

**Update [`src/lib/tools/types.ts`](src/lib/tools/types.ts)**

- Add new `ToolOutputType`: `"image-result"` for image comparison views
- Add `ImageResult` type for structured image output

---

## 2. Dual-Input Layout for Diff Tools

Current diff tools use a `---SEPARATOR---` pattern in a single textarea. This is poor UX.

### Changes:

**Create [`src/components/tools/dual-input.tsx`](src/components/tools/dual-input.tsx)**

- Two side-by-side textareas for "Original" and "Modified"
- Stacked on mobile
- Synced scroll option for longer texts
- Labels for each side

**Update [`src/components/tools/tool-page.tsx`](src/components/tools/tool-page.tsx)**

- Detect `inputType: "dual"` and render `DualInput` component
- Pass both values to transform function

**Create [`src/components/tools/diff-output.tsx`](src/components/tools/diff-output.tsx)**

- Syntax-highlighted diff view with + (green) / - (red) / unchanged styling
- Line numbers
- Unified or split view toggle

**Update [`src/lib/tools/sections/diff.ts`](src/lib/tools/sections/diff.ts)**

- Change `inputType` to `"dual"` for all diff tools
- Update transform to accept `{ text1: string, text2: string }` or continue parsing separator for backwards compat

---

## 3. Visual Color Tool Enhancements

Color tools should show visual swatches, not just text.

### Changes:

**Create [`src/components/tools/color-output.tsx`](src/components/tools/color-output.tsx)**

- Color swatch preview component
- For contrast checker: show both colors side-by-side with sample text
- For gradients: show live gradient preview
- For box-shadow: show live preview box

**Update [`src/lib/tools/types.ts`](src/lib/tools/types.ts)**

- Add `"color"` output type
- Add `ColorResult` type: `{ hex, rgb, hsl, swatch? }`

**Update [`src/lib/tools/sections/colors.ts`](src/lib/tools/sections/colors.ts)**

- Return structured color data for visual rendering
- Keep text output as secondary (for copy)

---

## 4. Mobile Responsiveness Improvements

### Changes:

**Update [`src/components/tools/tool-page.tsx`](src/components/tools/tool-page.tsx)**

- Stack input/output vertically on mobile (`grid-cols-1 lg:grid-cols-2`)
- Make header actions wrap properly on small screens
- Options row should scroll horizontally on mobile or collapse into accordion

**Update [`src/components/tools/tool-options.tsx`](src/components/tools/tool-options.tsx)**

- Collapsible on mobile (accordion-style)
- Horizontal scroll for many options on tablet
- Add responsive widths for inputs

**Update [`src/app/globals.css`](src/app/globals.css)**

- Add custom scrollbar styling
- Improve touch target sizes (min 44px)
- Better spacing on mobile

---

## 5. General UI Polish

### Toast Notifications

**Update [`src/components/providers.tsx`](src/components/providers.tsx)**

- Ensure Sonner toast is configured

**Update [`src/hooks/use-clipboard.ts`](src/hooks/use-clipboard.ts)**

- Trigger toast on copy success/failure

### Loading States

**Update [`src/components/tools/tool-output.tsx`](src/components/tools/tool-output.tsx)**

- Better skeleton loading state
- Subtle animation for processing

### Empty States

**Update [`src/components/tools/tool-output.tsx`](src/components/tools/tool-output.tsx)**

- More inviting empty state with icon and text
- Show keyboard shortcuts hint

### Keyboard Shortcuts

**Create [`src/components/layout/keyboard-hints.tsx`](src/components/layout/keyboard-hints.tsx)**

- Show available shortcuts (Cmd+Enter, Cmd+Shift+C, Escape)
- Display in footer or as tooltip

---

## 6. Tool-Specific Improvements

### QR Code Generator

- Show live QR preview as user types
- Add dark/light color options

### Hash Generator

- Show all hash algorithms at once for comparison
- Add "compare hashes" mode

### JWT Decoder

- Highlight expired tokens in red
- Add syntax highlighting for JSON payload

### Password Generator

- Show password strength indicator
- Copy button per password when generating multiple

---

## Implementation Order

1. **Core type system updates** - Add new output types
2. **Image preview components** - `ImageToolOutput`, update `ToolInput`
3. **Diff components** - `DualInput`, `DiffOutput`
4. **Color components** - `ColorOutput` with swatches
5. **Mobile responsiveness** - Update layouts and options
6. **Polish** - Toasts, loading states, keyboard hints
7. **Tool-specific** - QR, Hash, JWT, Password enhancements

---