# Basic Agentic UI — System One

The original chat and color UI, powered by DiffusionGemma structured decisions.

```sh
bun install
bun run dev
```

No API key or local model required. Messages and the current color go directly to the [public endpoint](https://huggingface.co/spaces/victor/DiffusionGemma-free-endpoint).

The model selects an action and a color. The app requires action confidence >= 0.5, accepts the model’s best valid color choice, and produces confirmations locally. Color confidence is not gated because creative suggestions can have several suitable answers. All 148 CSS named colors, transparent, and explicit CSS literals (hex, RGB, HSL) are supported. System One chooses candidates in groups of at most 25, then selects the final color from the group winners. This usually requires two endpoint calls. Objects, characters, moods, and themes can suggest colors through the model. Mixtures are interpreted by System One using intuitive paint mixing (or light/RGB when requested), selecting the nearest available palette color; this is a model suggestion, not an exact numerical color calculation. Unrecognized decisions request clarification. Endpoint failures leave manual controls usable.

Optional: copy `.env.example` to `.env.local` to change the endpoint/model, then restart Vite. These settings are public browser configuration, not secrets.

```sh
bun run build
bun run lint
bun server.ts # serve the production build on port 7860
```

## Deployment

[Live Space](https://huggingface.co/spaces/harlley/basic-agentic-ui-system-one)

Push to `main` to build and publish through GitHub Actions. The repository secret `HF_TOKEN` must have write access to the Space. `SPACE.md` supplies the static Space metadata; only the built `dist` files are uploaded.
