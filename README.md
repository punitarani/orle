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
- App routes are SSG by default via `src/app/ssg-defaults.ts`; tool pages in `src/app/tools/[slug]/page.tsx` and the home page are fully pre-rendered for CDN caching.
- Custom tools render from a single static page at `/tools/custom`, loading definitions from IndexedDB using a query param `?id=...`.
- The AI tool generator at `/tools/generate` is the only dynamic page and calls `/api/tools/generate`, `/api/tools/validate`, and `/api/tools/agent` from the client; these API routes stay server-side.
- A Raycast companion extension is available under `raycast/`.

## Build & deploy notes

- Run `npm run build` (or `bun run build`) to confirm all pages except `/tools/generate` are prerendered; API routes are excluded from SSG expectations.

## Contributing

- Install dependencies: `npm install` (or `bun install`).
- Run locally: `npm run dev` and open `http://localhost:3000`.
- Lint/format: `npm run lint` and `npm run format`.
- For Raycast changes, use the scripts in `raycast/` (see `package.json`).

---

Mostly AI-Generated with ChatGPT 5.2 Pro as the planner and orchestrator, Cursor (Claude Opus 4.5) for initial heavy-lifting and Codex CLI (GPT 5.2 Codex) for minor revisions.

- Punit Arani
