# Bio-signal monitoring dashboard (demo)

A **Next.js App Router** dashboard that simulates real-time acoustic / respiratory signal metrics with animated gauges, a **Three.js** (`@react-three/fiber` + `drei`) sphere, and an interactive event timeline with simulated audio playback controls.

## Stack

- Next.js 15 (App Router), React 19, TypeScript  
- Tailwind CSS 4  
- Zustand (centralized metrics + timeline)  
- `@react-three/fiber`, `@react-three/drei`, `three`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Project layout

| Path | Role |
|------|------|
| `app/` | App Router entry, layout, global styles |
| `components/` | Gauges, 3D viewport, timeline, playback UI, dashboard shell |
| `lib/` | Simulation math, shared types, semantic colors |
| `hooks/` | Simulation loop, eased gauge values, playback scrubbing |
| `store/` | Zustand store for live metrics and events |

All data is **client-side simulated**; there is no backend.
