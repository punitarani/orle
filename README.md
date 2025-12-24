<p align="center">
  <a href="https://orle.dev">
    <img src="public/logo.png" alt="orle.dev logo" width="120" />
  </a>
</p>
<p align="center"><a href="https://orle.dev">orle.dev</a></p>

# orle.dev

orle.dev is a browser-first collection of developer utilities for encoding, hashing, formatting, diffing, IDs, dates, colors, images, and more. The intent is a fast, privacy-friendly toolbox where tool inputs stay on the client.

## How it works

- Tool definitions live in `src/lib/tools/sections/` and are indexed in `src/lib/tools/registry.ts` for navigation and search.
- Each tool runs client-side through a sandboxed transform executor in `src/lib/tools/safe-executor.ts`.
- Tool pages are statically generated from the registry in `src/app/tools/[slug]/page.tsx` and rendered with shared tool UI components.
- The custom tool generator at `src/app/tools/generate` calls AI endpoints in `src/app/api/tools/generate` and `src/app/api/tools/validate`, then saves tools to IndexedDB via `src/lib/tools/custom-tools-db.ts`.
- A Raycast companion extension is available under `raycast/`.

## Contributing

- Install dependencies: `npm install` (or `bun install`).
- Run locally: `npm run dev` and open `http://localhost:3000`.
- Lint/format: `npm run lint` and `npm run format`.
- For Raycast changes, use the scripts in `raycast/` (see `package.json`).

---

Mostly AI-Generated with ChatGPT 5.2 Pro as the planner and orchestrator, Cursor (Claude Opus 4.5) for initial heavy-lifting and Codex CLI (GPT 5.2 Codex) for minor revisions.

- Punit Arani
