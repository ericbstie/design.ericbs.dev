# design.ericbs.dev
Design components

## npm package

The component library is published to the npm registry as [`@ericbs-ai/react-glass-components`](https://www.npmjs.com/package/@ericbs-ai/react-glass-components) (source in [`packages/react-glass-components`](packages/react-glass-components)).

Install it:

```sh
bun add @ericbs-ai/react-glass-components
# or
npm install @ericbs-ai/react-glass-components
```

Then import the stylesheet once and use the components (requires React 19):

```tsx
import "@ericbs-ai/react-glass-components/styles.css";
import { Card, Button } from "@ericbs-ai/react-glass-components";
```

See the [package README](packages/react-glass-components/README.md) for setup details (theme attributes, `<Blobs />` backdrop) and the full component list.

### Releasing

One-time setup: `bunx npm login` (the account must own the package's npm scope).

Then, from the repo root:

```sh
bun run publish:pkg
```

or equivalently `bun publish` from inside `packages/react-glass-components`. Publishing packs and builds `dist/` automatically via `prepublishOnly` — no separate build step needed. Bump `version` in `packages/react-glass-components/package.json` before each release.
