# Nyan Flight

A vibe-coded connection game that riffs on Flappy Bird energy and wraps it in neon cat chaos. Fly a cosmic nyan pilot through synth-drenched tunnels, sync every flap to Howler-powered beats, and unlock quirky challenge cards the moment you bump a pipe. Built for instant icebreakers, zero awkward silences, and maximum co-op energy.

## Features

- PixiJS flight loop with adaptive difficulty, rainbow exhaust trails, and buttery pause/resume
- React HUD that keeps scores, surfaces settings/accessibility controls, and never blocks the fun overlays
- Curated icebreaker deck that avoids repeats so conversations stay fresh
- Shared audio experience via Howler with autoplay guards, global volume, and SFX sweeteners
- TypeScript-first setup with ESLint, Prettier, Vitest/RTL scaffolding, and Vite hot reloads

## Getting Started

```bash
npm install
```

### Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – type-check + bundle for production
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint across the repo
- `npm run test` – execute Vitest suite once
- `npm run test:watch` – run Vitest in watch mode

## Development Notes

- Audio stays muted until the first tap/click to satisfy browser autoplay rules
- Swap in licensed sprites/sfx under `public/` before shipping to production
- Deploy anywhere Vite runs—Vercel works great: `vercel --prod` after `npm run build`
