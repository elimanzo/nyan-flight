# Nyan Flight

Zero-cost Flappy Bird–style experience built with React, TypeScript, PixiJS, and Tailwind. Guide a nyan-inspired cat through procedural pipes, keep the soundtrack playing via Howler, and surface playful challenge cards every time you crash.

## Features
- PixiJS canvas gameplay with adaptive difficulty, rainbow trails, and pause/resume handling
- React HUD with score/best tracking, settings modal, accessibility notice, and challenge overlays
- Icebreaker question deck that avoids repeats until the full list is used
- Howler-based audio manager with autoplay safeguards and persistent volume settings
- Strict TypeScript config, ESLint + Prettier ready, Vitest/RTL scaffolding for tests

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
- Audio starts after the first user interaction to satisfy browser autoplay rules
- Add actual Nyan Cat sprite/sound assets under `public/` for production use
- Deploy easily to Vercel: `vercel --prod` after running `npm run build`
