# Nyan Flight

A neon arcade game that riffs on Flappy Bird energy and wraps it in cosmic cat chaos. Fly a nyan pilot through synth-drenched tunnels, chase your Best, and compete for a spot on a global Leaderboard.

## Features

- PixiJS flight loop with adaptive difficulty, rainbow exhaust trails, and buttery pause/resume
- React HUD that keeps scores, surfaces settings/accessibility controls, and never blocks the fun overlays
- Medal tiers (bronze → platinum) awarded at Score milestones for extra flair
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
