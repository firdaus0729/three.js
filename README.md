# Bio-signal monitoring dashboard (demo)

A **React + Vite** dashboard that simulates real-time acoustic / respiratory signal metrics with animated gauges, a **Three.js** (`@react-three/fiber` + `drei`) sphere, and an interactive event timeline with simulated audio playback controls.

## Stack

- Vite 6, React 19, TypeScript  
- Tailwind CSS 4 (`@tailwindcss/vite`)  
- Zustand (centralized metrics + timeline)  
- `@react-three/fiber`, `@react-three/drei`, `three`

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

```bash
npm run build
npm run preview
```

## Project layout

| Path | Role |
|------|------|
| `index.html` | Vite entry |
| `src/main.tsx`, `src/App.tsx` | App bootstrap |
| `src/index.css` | Global styles + Tailwind |
| `src/components/` | Gauges, 3D viewport, timeline, playback UI, dashboard shell |
| `src/lib/` | Simulation math, shared types, semantic colors |
| `src/hooks/` | Simulation loop, eased gauge values, playback scrubbing |
| `src/store/` | Zustand store for live metrics and events |

All data is **client-side simulated**; there is no backend.

## Deploy (e.g. Vercel)

Use the **Vite** preset (or static): build command `npm run build`, output directory `dist`.
