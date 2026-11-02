# Cubicle Club

A cozy office where your AI agents work, hand off folders, hit bugs and wait for your stamp.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` makes a static site in `dist/` for any free host (Cloudflare Pages, Netlify, Vercel).

## How it's organized

```
src/
  core/        Event format, data store, levels/achievements, runtime wiring
  adapters/    Data sources. Each one turns a tool's activity into OfficeEvents
    grok/      Grok Bot: self-report line format + demo team generator
  scene/       The office: characters, desks, walking/handoff choreography
  ui/          Top bar, side panel, board, approval stamp, share studio, dressing room, toasts
    posters/   Shareable images: shift report, trading card, The Daily Agent, comic
  share/       Clip recorder (GIF/video) and the data behind each shareable
  pet/         The office pet: growth (saved on this device) and behavior
  content/     Speech-bubble lines, share-page wording, agent looks
  audio/       Synthesized sound effects
  styles/      Design tokens (theme colors) and CSS
```

**Data flow:** adapter → `core/engine.ts` (updates the data) → `scene/director.ts` (performs it in the office).

To add another agent tool, write a new adapter in `src/adapters/` that implements `Adapter` and emits `OfficeEvent`s. Nothing else needs to change.

## Grok Bot today
Grok Bot has no public API for reading bot activity, so v1 runs on demo data shaped exactly like the planned self-report format (`src/adapters/grok/protocol.ts`).
