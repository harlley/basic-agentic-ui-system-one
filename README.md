# Basic Agentic UI — System One

The original chat and color UI, powered by DiffusionGemma structured decisions.

```sh
bun install
bun run dev
```

No API key or local model required. Messages and the current color go directly to the [public endpoint](https://huggingface.co/spaces/victor/DiffusionGemma-free-endpoint).

The model selects an action and a color. The app applies validated answers with confidence >= 0.75 and produces confirmations locally. Common colors and explicit CSS literals (hex, RGB, HSL, named colors) are supported. Ambiguous or unavailable colors request clarification. Endpoint failures leave manual controls usable.

Optional: copy `.env.example` to `.env.local` to change the endpoint/model, then restart Vite. These settings are public browser configuration, not secrets.

```sh
bun run build
bun run lint
bun server.ts # serve the production build on port 7860
```

## Deployment

[Live Space](https://huggingface.co/spaces/harlley/basic-agentic-ui-system-one)

Push to `main` to build and publish through GitHub Actions. The repository secret `HF_TOKEN` must have write access to the Space. `SPACE.md` supplies the static Space metadata; only the built `dist` files are uploaded.
