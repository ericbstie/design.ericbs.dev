# @ericbs-ai/react-glass-components

Liquid-glass React components — frosted cards, buttons, forms, feedback and data displays with animated gradient blobs and light/dark glass themes. Live demo: [design.ericbs.dev](https://design.ericbs.dev).

## Install

```sh
bun add @ericbs-ai/react-glass-components
# or
npm install @ericbs-ai/react-glass-components
```

Requires React 19.

## Setup

The glass theming is driven by two attributes on `<html>`:

```html
<html data-theme="dark" data-glass="dark">
```

- `data-theme` (`dark` | `light`) sets the page base color and blob blending.
- `data-glass` (`dark` | `light`) sets the glass surfaces, rims, and text colors.

Import the stylesheet once, then use the components:

```tsx
import "@ericbs-ai/react-glass-components/styles.css";
import { Blobs, Card, Button, Toggle } from "@ericbs-ai/react-glass-components";

export function App() {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <Blobs />
      </div>
      <main>
        <Card title="Hello" subtitle="Frosted glass over animated blobs">
          <Button variant="primary">Click me</Button>
        </Card>
      </main>
    </>
  );
}
```

Glass surfaces use `backdrop-filter`, so they look best over a colorful background — `<Blobs />` provides the animated gradient backdrop from the demo site.

## Components

**Glass primitives** — `LiquidGlass`, `Rim`, `Noise`, `Blobs`, `Ripple`, `ThemeIcon`, `ThemeToggle`, `GlassCursor`

**Primitives** — `Card`, `Button`, `Toggle`, `Label`, `Tag`, `Link`, `Breadcrumb`

**Forms** — `Form`, `Field`, `Input`, `TextArea`, `Select`, `MultiSelect`, `RadioGroup`, `FileUpload`, `DatePicker`, `TimePicker`

**Feedback** — `Tooltip`, `ToastProvider`, `useToast`, `Progress`, `Skeleton`, `ChatShimmer`

**Data** — `Table`, `Tree`, `Timeline`

All components are typed; see the exported types (`Theme`, `ButtonVariant`, `TagVariant`, `ToastVariant`, `SelectOption`, `TreeNode`, `TimelineItem`, …) for the full prop surface.

## Theme switching

Flip both attributes to change theme (the `Ripple` component animates the transition on the demo site):

```ts
document.documentElement.dataset.theme = "light";
document.documentElement.dataset.glass = "light";
```

## License

MIT
