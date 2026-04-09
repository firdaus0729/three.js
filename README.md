# Bio-signal monitoring dashboard (React + Vite)

A **React + Vite** dashboard that supports:

- simulated real-time acoustic / respiratory metrics, and
- real client recording analysis from local audio/video files in-browser.

It renders animated gauges, a **Three.js** sphere, and an interactive timeline/classification report.

## Stack

- React 19, Vite 7, TypeScript  
- Tailwind CSS 4  
- Zustand (centralized metrics + timeline)  
- `@react-three/fiber`, `@react-three/drei`, `three`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build
npm run preview
```

## Project layout

| Path | Role |
|------|------|
| `src/` | Vite entrypoint |
| `components/` | Gauges, 3D viewport, timeline, playback UI, dashboard shell |
| `lib/` | Simulation math, shared types, semantic colors |
| `hooks/` | Simulation loop, eased gauge values, playback scrubbing |
| `store/` | Zustand store for live metrics and events |

## Real file analysis workflow

1. Start app and open dashboard.
2. In **Data source & analysis**, upload a local file (all common audio/video types, including `.wmv`).
3. Set analysis speed (recommended: `8x` or `16x` for long recordings).
4. Click **Run analysis**.
5. Watch:
   - circular gauges (`Intensity`, `Effort`)
   - 3D sphere response
   - event timeline (`Heavy snore`, `Slow snore`, `Breathing interruption`, `Normal breathing`)
6. Click any event to inspect timestamp and metric snapshot.

### Notes for 6h+ recordings

- Use Chromium-based browser for best media codec support.
- Some formats (especially legacy WMV/WMA variants) may upload but fail to decode in-browser; convert to WAV/MP4 for guaranteed playback.
- Keep the tab active while running long analysis sessions.
- This is a **POC classifier**, not a medical diagnosis system.
