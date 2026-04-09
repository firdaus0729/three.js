(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/simulation.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createInitialSimulation",
    ()=>createInitialSimulation,
    "createSmoothedNoise",
    ()=>createSmoothedNoise,
    "simulationTick",
    ()=>simulationTick
]);
function createSmoothedNoise(seed) {
    let s = seed;
    let value = 0;
    return (alpha)=>{
        s = (s * 9301 + 49297) % 233280;
        const r = s / 233280;
        value = value * (1 - alpha) + r * alpha;
        return value;
    };
}
function createInitialSimulation() {
    let seed = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 42_069;
    return {
        t: 0,
        phase: 0,
        intensityBase: 45,
        effortBase: 40,
        noiseI: createSmoothedNoise(seed),
        noiseE: createSmoothedNoise(seed + 999),
        interruptionCooldown: 0
    };
}
function classifyEvent(intensity, effort, breathPhase, state) {
    const snoreWave = Math.sin(breathPhase * 0.8);
    const isPeak = snoreWave > 0.65;
    if (state.interruptionCooldown <= 0 && intensity < 22 && effort > 55) {
        state.interruptionCooldown = 8;
        return "breathing_interruption";
    }
    if (intensity > 72 && effort > 60 && isPeak) {
        return "heavy_snore";
    }
    if (intensity > 48 && intensity <= 72 && snoreWave > 0.2) {
        return "slow_snore";
    }
    if (intensity < 35 && effort < 45) {
        return "normal_breathing";
    }
    if (effort > 65) {
        return "heavy_snore";
    }
    if (intensity > 55) {
        return "slow_snore";
    }
    return "normal_breathing";
}
function simulationTick(state, dtMs) {
    state.t += dtMs;
    state.phase += dtMs * 0.0022;
    if (state.interruptionCooldown > 0) {
        state.interruptionCooldown -= dtMs / 700;
    }
    const breath = Math.sin(state.phase);
    const slowMod = Math.sin(state.phase * 0.37 + 1.2) * 18;
    const ripple = Math.sin(state.phase * 2.1) * 8;
    const nI = state.noiseI(0.12) * 28 - 14;
    const nE = state.noiseE(0.1) * 22 - 11;
    state.intensityBase = Math.max(0, Math.min(100, state.intensityBase + (state.noiseI(0.04) - 0.5) * 3));
    state.effortBase = Math.max(0, Math.min(100, state.effortBase + (state.noiseE(0.04) - 0.5) * 2.5));
    const breathPhase = state.phase + breath * 0.5;
    const intensity = Math.max(0, Math.min(100, state.intensityBase + breath * 22 + slowMod * 0.35 + ripple * 0.4 + nI));
    const effort = Math.max(0, Math.min(100, state.effortBase + Math.abs(breath) * 20 + slowMod * 0.25 + nE + (breath < -0.3 ? 12 : 0)));
    const type = classifyEvent(intensity, effort, breathPhase, state);
    return {
        snapshot: {
            intensity: Math.round(intensity * 10) / 10,
            effort: Math.round(effort * 10) / 10
        },
        type
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/store/dashboardStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDashboardStore",
    ()=>useDashboardStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$simulation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/simulation.ts [app-client] (ecmascript)");
"use client";
;
;
let eventId = 0;
function clampPlayback(offset, events, elapsed) {
    const max = Math.max(elapsed, 0);
    if (events.length === 0) return Math.max(0, Math.min(offset, max));
    const last = events[events.length - 1].offsetMs;
    return Math.max(0, Math.min(offset, Math.max(max, last)));
}
const useDashboardStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        sourceMode: "simulation",
        analysisStatus: "idle",
        analysisError: null,
        mediaName: null,
        mediaDurationMs: 0,
        analysisProgress: 0,
        playbackRate: 8,
        elapsedMs: 0,
        intensity: 40,
        effort: 38,
        eventType: "normal_breathing",
        events: [],
        selectedEventId: null,
        playbackOffsetMs: 0,
        isPlaying: false,
        lastTickMs: 750,
        sim: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$simulation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createInitialSimulation"])(),
        eventCounts: {
            heavy_snore: 0,
            slow_snore: 0,
            normal_breathing: 0,
            breathing_interruption: 0
        },
        tickSimulation: ()=>{
            const s = get();
            const interval = 500 + Math.random() * 500;
            const { snapshot, type } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$simulation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["simulationTick"])(s.sim, interval);
            const elapsedMs = s.elapsedMs + interval;
            const offsetMs = elapsedMs;
            const id = "evt-".concat(++eventId);
            const newEvent = {
                id,
                offsetMs,
                type,
                snapshot: {
                    ...snapshot
                }
            };
            const nextEvents = [
                ...s.events,
                newEvent
            ].slice(-2500);
            set({
                elapsedMs,
                lastTickMs: interval,
                intensity: snapshot.intensity,
                effort: snapshot.effort,
                eventType: type,
                events: nextEvents,
                eventCounts: {
                    ...s.eventCounts,
                    [type]: s.eventCounts[type] + 1
                },
                playbackOffsetMs: s.isPlaying ? clampPlayback(s.playbackOffsetMs + interval, nextEvents, elapsedMs) : s.playbackOffsetMs
            });
        },
        startSimulation: ()=>set({
                sourceMode: "simulation",
                analysisStatus: "running",
                analysisError: null,
                mediaName: null,
                mediaDurationMs: 0,
                analysisProgress: 0,
                elapsedMs: 0,
                intensity: 40,
                effort: 38,
                eventType: "normal_breathing",
                events: [],
                selectedEventId: null,
                playbackOffsetMs: 0,
                isPlaying: false,
                lastTickMs: 750,
                sim: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$simulation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createInitialSimulation"])(),
                eventCounts: {
                    heavy_snore: 0,
                    slow_snore: 0,
                    normal_breathing: 0,
                    breathing_interruption: 0
                }
            }),
        resetForMedia: (name, durationMs)=>set({
                sourceMode: "media",
                analysisStatus: "loading",
                analysisError: null,
                mediaName: name,
                mediaDurationMs: durationMs,
                analysisProgress: 0,
                elapsedMs: durationMs,
                intensity: 0,
                effort: 0,
                eventType: "normal_breathing",
                events: [],
                selectedEventId: null,
                playbackOffsetMs: 0,
                isPlaying: false,
                eventCounts: {
                    heavy_snore: 0,
                    slow_snore: 0,
                    normal_breathing: 0,
                    breathing_interruption: 0
                }
            }),
        ingestExternalSample: (offsetMs, snapshot, type)=>{
            const s = get();
            const safeOffset = Math.max(0, Math.min(offsetMs, s.mediaDurationMs || Number.MAX_SAFE_INTEGER));
            const id = "evt-".concat(++eventId);
            const newEvent = {
                id,
                offsetMs: safeOffset,
                type,
                snapshot: {
                    ...snapshot
                }
            };
            const nextEvents = [
                ...s.events,
                newEvent
            ].slice(-2500);
            set({
                intensity: snapshot.intensity,
                effort: snapshot.effort,
                eventType: type,
                events: nextEvents,
                playbackOffsetMs: safeOffset,
                analysisProgress: s.mediaDurationMs > 0 ? Math.min(1, safeOffset / s.mediaDurationMs) : 0,
                eventCounts: {
                    ...s.eventCounts,
                    [type]: s.eventCounts[type] + 1
                }
            });
        },
        setSourceMode: (mode)=>set({
                sourceMode: mode
            }),
        setAnalysisStatus: function(status) {
            let error = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
            return set({
                analysisStatus: status,
                analysisError: error
            });
        },
        setMediaDuration: (durationMs)=>set({
                mediaDurationMs: durationMs,
                elapsedMs: durationMs > 0 ? durationMs : get().elapsedMs
            }),
        setPlaybackRate: (rate)=>set({
                playbackRate: rate
            }),
        setPlaying: (playing)=>set({
                isPlaying: playing
            }),
        selectEvent: (id)=>set({
                selectedEventId: id
            }),
        jumpToEvent: (id)=>{
            const ev = get().events.find((e)=>e.id === id);
            if (!ev) return;
            set({
                selectedEventId: id,
                playbackOffsetMs: ev.offsetMs
            });
        },
        setPlaybackOffset: (ms)=>{
            const { events, elapsedMs } = get();
            set({
                playbackOffsetMs: clampPlayback(ms, events, elapsedMs)
            });
        },
        togglePlayback: ()=>{
            const playing = !get().isPlaying;
            set({
                isPlaying: playing
            });
        }
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EVENT_LABELS",
    ()=>EVENT_LABELS
]);
const EVENT_LABELS = {
    heavy_snore: "Heavy snore",
    slow_snore: "Slow snore",
    normal_breathing: "Normal breathing",
    breathing_interruption: "Breathing interruption"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/DashboardHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DashboardHeader",
    ()=>DashboardHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function formatClock(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return "".concat(String(m).padStart(2, "0"), ":").concat(String(ss).padStart(2, "0"));
}
function DashboardHeader() {
    _s();
    const eventType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardHeader.useDashboardStore[eventType]": (s)=>s.eventType
    }["DashboardHeader.useDashboardStore[eventType]"]);
    const elapsedMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardHeader.useDashboardStore[elapsedMs]": (s)=>s.elapsedMs
    }["DashboardHeader.useDashboardStore[elapsedMs]"]);
    const sourceMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardHeader.useDashboardStore[sourceMode]": (s)=>s.sourceMode
    }["DashboardHeader.useDashboardStore[sourceMode]"]);
    const analysisStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardHeader.useDashboardStore[analysisStatus]": (s)=>s.analysisStatus
    }["DashboardHeader.useDashboardStore[analysisStatus]"]);
    const analysisProgress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardHeader.useDashboardStore[analysisProgress]": (s)=>s.analysisProgress
    }["DashboardHeader.useDashboardStore[analysisProgress]"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-500/90",
                        children: "Acoustic biosignal"
                    }, void 0, false, {
                        fileName: "[project]/components/DashboardHeader.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl",
                        children: "Sleep respiration monitor"
                    }, void 0, false, {
                        fileName: "[project]/components/DashboardHeader.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 max-w-xl text-sm text-slate-500",
                        children: sourceMode === "media" ? "Client recording analysis mode with real-time feature extraction and classification." : "Simulated real-time intensity, effort, and event classification for demo purposes."
                    }, void 0, false, {
                        fileName: "[project]/components/DashboardHeader.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/DashboardHeader.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "relative flex h-2.5 w-2.5",
                                "aria-label": "Live stream active",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardHeader.tsx",
                                        lineNumber: 41,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                                    }, void 0, false, {
                                        fileName: "[project]/components/DashboardHeader.tsx",
                                        lineNumber: 42,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-medium text-slate-300",
                                children: sourceMode === "media" ? "Analyzing" : "Live"
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-mono text-xs text-slate-500",
                                children: formatClock(elapsedMs)
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardHeader.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    sourceMode === "media" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-white/[0.08] bg-[#12181f] px-4 py-2 shadow-inner",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] uppercase tracking-wider text-slate-500",
                                children: "Pipeline"
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 51,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-0.5 text-sm font-medium text-cyan-100/95",
                                children: [
                                    analysisStatus,
                                    " · ",
                                    (analysisProgress * 100).toFixed(1),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 52,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardHeader.tsx",
                        lineNumber: 50,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-white/[0.08] bg-[#12181f] px-4 py-2 shadow-inner",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] uppercase tracking-wider text-slate-500",
                                children: "Current class"
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-0.5 text-sm font-medium text-cyan-100/95",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVENT_LABELS"][eventType]
                            }, void 0, false, {
                                fileName: "[project]/components/DashboardHeader.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/DashboardHeader.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/DashboardHeader.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/DashboardHeader.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_s(DashboardHeader, "kFFUesUKLXO+a+uWG5UsSjSym0I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
_c = DashboardHeader;
var _c;
__turbopack_context__.k.register(_c, "DashboardHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/useAnimatedGaugeValue.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAnimatedGaugeValue",
    ()=>useAnimatedGaugeValue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
const EASE = 0.14;
function useAnimatedGaugeValue(target) {
    _s();
    const [display, setDisplay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(target);
    const raf = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAnimatedGaugeValue.useEffect": ()=>{
            const step = {
                "useAnimatedGaugeValue.useEffect.step": ()=>{
                    setDisplay({
                        "useAnimatedGaugeValue.useEffect.step": (prev)=>{
                            const d = target - prev;
                            if (Math.abs(d) < 0.05) return target;
                            return prev + d * EASE;
                        }
                    }["useAnimatedGaugeValue.useEffect.step"]);
                    raf.current = requestAnimationFrame(step);
                }
            }["useAnimatedGaugeValue.useEffect.step"];
            raf.current = requestAnimationFrame(step);
            return ({
                "useAnimatedGaugeValue.useEffect": ()=>{
                    if (raf.current != null) cancelAnimationFrame(raf.current);
                }
            })["useAnimatedGaugeValue.useEffect"];
        }
    }["useAnimatedGaugeValue.useEffect"], [
        target
    ]);
    return display;
}
_s(useAnimatedGaugeValue, "bCECgRmALDIfHIZSaPdsPmOe2Tg=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/colors.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Returns semantic dashboard color for a 0–100 gauge value */ __turbopack_context__.s([
    "combinedStressRgb",
    ()=>combinedStressRgb,
    "gaugeColor",
    ()=>gaugeColor
]);
function gaugeColor(value) {
    if (value < 40) {
        return {
            stroke: "#22c55e",
            glow: "rgba(34, 197, 94, 0.45)",
            label: "Normal"
        };
    }
    if (value < 70) {
        return {
            stroke: "#eab308",
            glow: "rgba(234, 179, 8, 0.45)",
            label: "Moderate"
        };
    }
    return {
        stroke: "#ef4444",
        glow: "rgba(239, 68, 68, 0.5)",
        label: "Elevated"
    };
}
function combinedStressRgb(intensity, effort) {
    const v = Math.min(1, (intensity + effort) / 200);
    const r = Math.round(30 + v * 180);
    const g = Math.round(200 - v * 160);
    const b = Math.round(120 + v * 80);
    return "rgb(".concat(r, ",").concat(g, ",").concat(b, ")");
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/CircularGauge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CircularGauge",
    ()=>CircularGauge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAnimatedGaugeValue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useAnimatedGaugeValue.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/colors.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const SIZE = 200;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
function CircularGauge(param) {
    let { label, value, className = "" } = param;
    _s();
    const filterId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])().replace(/:/g, "");
    const display = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAnimatedGaugeValue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnimatedGaugeValue"])(value);
    const pct = Math.min(1, Math.max(0, display / 100));
    const offset = C * (1 - pct);
    const colors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gaugeColor"])(display);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex flex-col items-center rounded-2xl border border-white/[0.08] bg-[#12181f]/90 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)] ".concat(className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500",
                children: label
            }, void 0, false, {
                fileName: "[project]/components/CircularGauge.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                style: {
                    width: SIZE,
                    height: SIZE
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        width: SIZE,
                        height: SIZE,
                        viewBox: "0 0 ".concat(SIZE, " ").concat(SIZE),
                        className: "-rotate-90 transform",
                        "aria-hidden": true,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("filter", {
                                    id: "glow-".concat(filterId),
                                    x: "-50%",
                                    y: "-50%",
                                    width: "200%",
                                    height: "200%",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("feGaussianBlur", {
                                            stdDeviation: "3",
                                            result: "blur"
                                        }, void 0, false, {
                                            fileName: "[project]/components/CircularGauge.tsx",
                                            lineNumber: 42,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("feMerge", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("feMergeNode", {
                                                    in: "blur"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/CircularGauge.tsx",
                                                    lineNumber: 44,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("feMergeNode", {
                                                    in: "SourceGraphic"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/CircularGauge.tsx",
                                                    lineNumber: 45,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/CircularGauge.tsx",
                                            lineNumber: 43,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/CircularGauge.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/CircularGauge.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: SIZE / 2,
                                cy: SIZE / 2,
                                r: R,
                                fill: "none",
                                stroke: "rgba(255,255,255,0.06)",
                                strokeWidth: STROKE
                            }, void 0, false, {
                                fileName: "[project]/components/CircularGauge.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            [
                                0,
                                25,
                                50,
                                75,
                                100
                            ].map((tick)=>{
                                const a = tick / 100 * 2 * Math.PI - Math.PI / 2;
                                const x1 = SIZE / 2 + (R - STROKE / 2 - 4) * Math.cos(a);
                                const y1 = SIZE / 2 + (R - STROKE / 2 - 4) * Math.sin(a);
                                const x2 = SIZE / 2 + (R + 6) * Math.cos(a);
                                const y2 = SIZE / 2 + (R + 6) * Math.sin(a);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: x1,
                                    y1: y1,
                                    x2: x2,
                                    y2: y2,
                                    stroke: "rgba(148,163,184,0.35)",
                                    strokeWidth: 1.5,
                                    className: "pointer-events-none"
                                }, tick, false, {
                                    fileName: "[project]/components/CircularGauge.tsx",
                                    lineNumber: 65,
                                    columnNumber: 15
                                }, this);
                            }),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: SIZE / 2,
                                cy: SIZE / 2,
                                r: R,
                                fill: "none",
                                stroke: colors.stroke,
                                strokeWidth: STROKE,
                                strokeLinecap: "round",
                                strokeDasharray: C,
                                strokeDashoffset: offset,
                                filter: "url(#glow-".concat(filterId, ")"),
                                style: {
                                    transition: "stroke 0.45s cubic-bezier(0.4, 0, 0.2, 1)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/CircularGauge.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/CircularGauge.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute inset-0 flex flex-col items-center justify-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-mono text-4xl font-semibold tabular-nums tracking-tight",
                                style: {
                                    color: colors.stroke,
                                    textShadow: "0 0 24px ".concat(colors.glow),
                                    transition: "color 0.45s cubic-bezier(0.4, 0, 0.2, 1)"
                                },
                                children: Math.round(display)
                            }, void 0, false, {
                                fileName: "[project]/components/CircularGauge.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "mt-0.5 text-[10px] uppercase tracking-wider text-slate-500",
                                children: colors.label
                            }, void 0, false, {
                                fileName: "[project]/components/CircularGauge.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/CircularGauge.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/CircularGauge.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/CircularGauge.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(CircularGauge, "ASGp5glPFcEOC9RmXd0jTjQFusk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAnimatedGaugeValue$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAnimatedGaugeValue"]
    ];
});
_c = CircularGauge;
var _c;
__turbopack_context__.k.register(_c, "CircularGauge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/EventTimeline.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EventTimeline",
    ()=>EventTimeline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function formatTime(offsetMs) {
    const s = Math.floor(offsetMs / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    const ms = Math.floor(offsetMs % 1000 / 10);
    return "".concat(String(m).padStart(2, "0"), ":").concat(String(ss).padStart(2, "0"), ".").concat(String(ms).padStart(2, "0"));
}
const typeStyles = {
    normal_breathing: {
        bar: "from-emerald-500/40 to-emerald-500/5",
        dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
        badge: "text-emerald-300/90 bg-emerald-500/15 border-emerald-500/25"
    },
    slow_snore: {
        bar: "from-amber-500/40 to-amber-500/5",
        dot: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]",
        badge: "text-amber-200/90 bg-amber-500/15 border-amber-500/25"
    },
    heavy_snore: {
        bar: "from-orange-500/45 to-red-500/10",
        dot: "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]",
        badge: "text-orange-200/90 bg-orange-500/15 border-orange-500/30"
    },
    breathing_interruption: {
        bar: "from-red-500/50 to-red-900/20",
        dot: "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.55)]",
        badge: "text-red-200/90 bg-red-500/15 border-red-500/30"
    }
};
function EventTimeline() {
    _s();
    const sourceMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "EventTimeline.useDashboardStore[sourceMode]": (s)=>s.sourceMode
    }["EventTimeline.useDashboardStore[sourceMode]"]);
    const events = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "EventTimeline.useDashboardStore[events]": (s)=>s.events
    }["EventTimeline.useDashboardStore[events]"]);
    const selectedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "EventTimeline.useDashboardStore[selectedId]": (s)=>s.selectedEventId
    }["EventTimeline.useDashboardStore[selectedId]"]);
    const selectEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "EventTimeline.useDashboardStore[selectEvent]": (s)=>s.selectEvent
    }["EventTimeline.useDashboardStore[selectEvent]"]);
    const jumpToEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "EventTimeline.useDashboardStore[jumpToEvent]": (s)=>s.jumpToEvent
    }["EventTimeline.useDashboardStore[jumpToEvent]"]);
    const selected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "EventTimeline.useMemo[selected]": ()=>{
            var _events_find;
            return (_events_find = events.find({
                "EventTimeline.useMemo[selected]": (e)=>e.id === selectedId
            }["EventTimeline.useMemo[selected]"])) !== null && _events_find !== void 0 ? _events_find : null;
        }
    }["EventTimeline.useMemo[selected]"], [
        events,
        selectedId
    ]);
    const reversed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "EventTimeline.useMemo[reversed]": ()=>[
                ...events
            ].reverse()
    }["EventTimeline.useMemo[reversed]"], [
        events
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-slate-200",
                                children: "Event timeline"
                            }, void 0, false, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] uppercase tracking-wider text-slate-500",
                                children: [
                                    events.length,
                                    " events"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EventTimeline.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "timeline-scroll max-h-[220px] space-y-1 overflow-y-auto pr-1",
                        children: reversed.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "py-8 text-center text-sm text-slate-500",
                            children: "Waiting for signal samples…"
                        }, void 0, false, {
                            fileName: "[project]/components/EventTimeline.tsx",
                            lineNumber: 65,
                            columnNumber: 13
                        }, this) : reversed.map((ev)=>{
                            const st = typeStyles[ev.type];
                            const active = ev.id === selectedId;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>{
                                    selectEvent(ev.id);
                                    jumpToEvent(ev.id);
                                },
                                className: "group flex w-full items-stretch gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ".concat(active ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.12)]" : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-1 shrink-0 rounded-full bg-gradient-to-b ".concat(st.bar),
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 86,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex min-w-0 flex-1 flex-col gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ".concat(st.badge),
                                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVENT_LABELS"][ev.type]
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/EventTimeline.tsx",
                                                        lineNumber: 92,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-mono text-[11px] text-slate-500",
                                                        children: [
                                                            "T+",
                                                            formatTime(ev.offsetMs)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/EventTimeline.tsx",
                                                        lineNumber: 97,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/EventTimeline.tsx",
                                                lineNumber: 91,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-3 text-[11px] text-slate-500",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: [
                                                            "I:",
                                                            " ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-mono text-slate-400",
                                                                children: ev.snapshot.intensity
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/EventTimeline.tsx",
                                                                lineNumber: 104,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/EventTimeline.tsx",
                                                        lineNumber: 102,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: [
                                                            "E:",
                                                            " ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-mono text-slate-400",
                                                                children: ev.snapshot.effort
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/EventTimeline.tsx",
                                                                lineNumber: 110,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/EventTimeline.tsx",
                                                        lineNumber: 108,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/EventTimeline.tsx",
                                                lineNumber: 101,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 90,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "h-2 w-2 rounded-full transition-transform group-hover:scale-125 ".concat(st.dot)
                                        }, void 0, false, {
                                            fileName: "[project]/components/EventTimeline.tsx",
                                            lineNumber: 115,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 114,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, ev.id, true, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 73,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/components/EventTimeline.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/EventTimeline.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-sm font-semibold text-slate-200",
                        children: "Selection detail"
                    }, void 0, false, {
                        fileName: "[project]/components/EventTimeline.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    selected ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] uppercase tracking-wider text-slate-500",
                                        children: "Event type"
                                    }, void 0, false, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 131,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-lg font-medium text-white",
                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVENT_LABELS"][selected.type]
                                    }, void 0, false, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 132,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] uppercase tracking-wider text-slate-500",
                                        children: "Timestamp"
                                    }, void 0, false, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 font-mono text-sm text-cyan-200/90",
                                        children: [
                                            "T+",
                                            formatTime(selected.offsetMs)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 138,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 136,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-lg border border-white/10 bg-black/25 p-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] uppercase text-slate-500",
                                                children: "Intensity"
                                            }, void 0, false, {
                                                fileName: "[project]/components/EventTimeline.tsx",
                                                lineNumber: 144,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 font-mono text-xl text-white",
                                                children: selected.snapshot.intensity
                                            }, void 0, false, {
                                                fileName: "[project]/components/EventTimeline.tsx",
                                                lineNumber: 145,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-lg border border-white/10 bg-black/25 p-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] uppercase text-slate-500",
                                                children: "Effort"
                                            }, void 0, false, {
                                                fileName: "[project]/components/EventTimeline.tsx",
                                                lineNumber: 150,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 font-mono text-xl text-white",
                                                children: selected.snapshot.effort
                                            }, void 0, false, {
                                                fileName: "[project]/components/EventTimeline.tsx",
                                                lineNumber: 151,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/EventTimeline.tsx",
                                        lineNumber: 149,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 142,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs leading-relaxed text-slate-500",
                                children: [
                                    "Metrics reflect the ",
                                    sourceMode === "media" ? "recording-derived" : "simulated",
                                    " snapshot at classification time. Use the player below to align the playhead with this marker."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/EventTimeline.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EventTimeline.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-6 text-sm text-slate-500",
                        children: "Click any timeline row to inspect type, time, and the metric snapshot captured for that sample."
                    }, void 0, false, {
                        fileName: "[project]/components/EventTimeline.tsx",
                        lineNumber: 162,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/EventTimeline.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/EventTimeline.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_s(EventTimeline, "1AF+lV78Vsy7TJYOzl9uN9AXCzA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
_c = EventTimeline;
var _c;
__turbopack_context__.k.register(_c, "EventTimeline");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/AudioPlaybackBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AudioPlaybackBar",
    ()=>AudioPlaybackBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function formatClock(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return "".concat(String(m).padStart(2, "0"), ":").concat(String(ss).padStart(2, "0"));
}
function AudioPlaybackBar() {
    _s();
    const sourceMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AudioPlaybackBar.useDashboardStore[sourceMode]": (s)=>s.sourceMode
    }["AudioPlaybackBar.useDashboardStore[sourceMode]"]);
    const playbackOffsetMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AudioPlaybackBar.useDashboardStore[playbackOffsetMs]": (s)=>s.playbackOffsetMs
    }["AudioPlaybackBar.useDashboardStore[playbackOffsetMs]"]);
    const elapsedMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AudioPlaybackBar.useDashboardStore[elapsedMs]": (s)=>s.elapsedMs
    }["AudioPlaybackBar.useDashboardStore[elapsedMs]"]);
    const isPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AudioPlaybackBar.useDashboardStore[isPlaying]": (s)=>s.isPlaying
    }["AudioPlaybackBar.useDashboardStore[isPlaying]"]);
    const togglePlayback = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AudioPlaybackBar.useDashboardStore[togglePlayback]": (s)=>s.togglePlayback
    }["AudioPlaybackBar.useDashboardStore[togglePlayback]"]);
    const setPlaybackOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AudioPlaybackBar.useDashboardStore[setPlaybackOffset]": (s)=>s.setPlaybackOffset
    }["AudioPlaybackBar.useDashboardStore[setPlaybackOffset]"]);
    const trackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const max = Math.max(elapsedMs, 1);
    const pct = Math.min(100, playbackOffsetMs / max * 100);
    const onTrackPointer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AudioPlaybackBar.useCallback[onTrackPointer]": (clientX)=>{
            const el = trackRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
            const ratio = rect.width > 0 ? x / rect.width : 0;
            setPlaybackOffset(ratio * elapsedMs);
        }
    }["AudioPlaybackBar.useCallback[onTrackPointer]"], [
        elapsedMs,
        setPlaybackOffset
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex flex-wrap items-center justify-between gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-sm font-semibold text-slate-200",
                        children: sourceMode === "media" ? "Recording playback & analysis timeline" : "Simulated audio review"
                    }, void 0, false, {
                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] uppercase tracking-wider text-slate-500",
                        children: sourceMode === "media" ? "Media-synced playback" : "UI-only playback"
                    }, void 0, false, {
                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AudioPlaybackBar.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4 sm:flex-row sm:items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: togglePlayback,
                        className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 bg-gradient-to-br from-cyan-500/25 to-teal-600/20 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)] transition hover:scale-105 hover:border-cyan-400/60 active:scale-95",
                        "aria-label": isPlaying ? "Pause" : "Play",
                        children: isPlaying ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "h-5 w-5",
                            fill: "currentColor",
                            viewBox: "0 0 24 24",
                            "aria-hidden": true,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M6 4h4v16H6V4zm8 0h4v16h-4V4z"
                            }, void 0, false, {
                                fileName: "[project]/components/AudioPlaybackBar.tsx",
                                lineNumber: 56,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/AudioPlaybackBar.tsx",
                            lineNumber: 55,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "ml-0.5 h-5 w-5",
                            fill: "currentColor",
                            viewBox: "0 0 24 24",
                            "aria-hidden": true,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M8 5v14l11-7L8 5z"
                            }, void 0, false, {
                                fileName: "[project]/components/AudioPlaybackBar.tsx",
                                lineNumber: 60,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/AudioPlaybackBar.tsx",
                            lineNumber: 59,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0 flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: trackRef,
                                role: "slider",
                                tabIndex: 0,
                                "aria-valuenow": Math.round(playbackOffsetMs),
                                "aria-valuemin": 0,
                                "aria-valuemax": Math.round(elapsedMs),
                                className: "group relative h-10 cursor-pointer rounded-lg border border-white/10 bg-black/30 px-1 transition hover:border-cyan-500/30",
                                onPointerDown: (e)=>{
                                    e.currentTarget.setPointerCapture(e.pointerId);
                                    onTrackPointer(e.clientX);
                                },
                                onPointerMove: (e)=>{
                                    if (e.buttons !== 1) return;
                                    onTrackPointer(e.clientX);
                                },
                                onKeyDown: (e)=>{
                                    const step = 500;
                                    if (e.key === "ArrowRight") setPlaybackOffset(Math.min(playbackOffsetMs + step, elapsedMs));
                                    if (e.key === "ArrowLeft") setPlaybackOffset(Math.max(playbackOffsetMs - step, 0));
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-y-0 left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-full rounded-full bg-gradient-to-r from-cyan-600/80 to-teal-400/90 transition-[width] duration-75",
                                            style: {
                                                width: "".concat(pct, "%")
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/AudioPlaybackBar.tsx",
                                            lineNumber: 90,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                                        lineNumber: 89,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-200 bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.5)] transition-[left] duration-75 group-hover:scale-110",
                                        style: {
                                            left: "".concat(pct, "%")
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AudioPlaybackBar.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 flex justify-between font-mono text-[11px] text-slate-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: formatClock(playbackOffsetMs)
                                    }, void 0, false, {
                                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                                        lineNumber: 101,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: formatClock(elapsedMs)
                                    }, void 0, false, {
                                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                                        lineNumber: 102,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AudioPlaybackBar.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden w-px self-stretch bg-white/10 sm:block"
                    }, void 0, false, {
                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3 text-[11px] text-slate-500 sm:flex-col sm:justify-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "rounded-md border border-white/10 bg-black/20 px-2 py-1",
                                children: isPlaying ? "Playing" : "Paused"
                            }, void 0, false, {
                                fileName: "[project]/components/AudioPlaybackBar.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden sm:inline",
                                children: "Scrub to jump in time"
                            }, void 0, false, {
                                fileName: "[project]/components/AudioPlaybackBar.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AudioPlaybackBar.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AudioPlaybackBar.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/AudioPlaybackBar.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(AudioPlaybackBar, "23zlqwyQyIOP9Ps3tuQaGyKAHzs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
_c = AudioPlaybackBar;
var _c;
__turbopack_context__.k.register(_c, "AudioPlaybackBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/AnalysisControlPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnalysisControlPanel",
    ()=>AnalysisControlPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const SPEEDS = [
    1,
    2,
    4,
    8,
    16
];
function formatDuration(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(t / 3600);
    const m = Math.floor(t % 3600 / 60);
    const s = t % 60;
    if (h > 0) return "".concat(String(h).padStart(2, "0"), ":").concat(String(m).padStart(2, "0"), ":").concat(String(s).padStart(2, "0"));
    return "".concat(String(m).padStart(2, "0"), ":").concat(String(s).padStart(2, "0"));
}
function AnalysisControlPanel(param) {
    let { onFileSelected } = param;
    _s();
    const [fileName, setFileName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const sourceMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[sourceMode]": (s)=>s.sourceMode
    }["AnalysisControlPanel.useDashboardStore[sourceMode]"]);
    const analysisStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[analysisStatus]": (s)=>s.analysisStatus
    }["AnalysisControlPanel.useDashboardStore[analysisStatus]"]);
    const analysisError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[analysisError]": (s)=>s.analysisError
    }["AnalysisControlPanel.useDashboardStore[analysisError]"]);
    const mediaName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[mediaName]": (s)=>s.mediaName
    }["AnalysisControlPanel.useDashboardStore[mediaName]"]);
    const mediaDurationMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[mediaDurationMs]": (s)=>s.mediaDurationMs
    }["AnalysisControlPanel.useDashboardStore[mediaDurationMs]"]);
    const analysisProgress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[analysisProgress]": (s)=>s.analysisProgress
    }["AnalysisControlPanel.useDashboardStore[analysisProgress]"]);
    const playbackRate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[playbackRate]": (s)=>s.playbackRate
    }["AnalysisControlPanel.useDashboardStore[playbackRate]"]);
    const eventCounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[eventCounts]": (s)=>s.eventCounts
    }["AnalysisControlPanel.useDashboardStore[eventCounts]"]);
    const elapsedMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[elapsedMs]": (s)=>s.elapsedMs
    }["AnalysisControlPanel.useDashboardStore[elapsedMs]"]);
    const isPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[isPlaying]": (s)=>s.isPlaying
    }["AnalysisControlPanel.useDashboardStore[isPlaying]"]);
    const setPlaybackRate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[setPlaybackRate]": (s)=>s.setPlaybackRate
    }["AnalysisControlPanel.useDashboardStore[setPlaybackRate]"]);
    const setPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[setPlaying]": (s)=>s.setPlaying
    }["AnalysisControlPanel.useDashboardStore[setPlaying]"]);
    const setSourceMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[setSourceMode]": (s)=>s.setSourceMode
    }["AnalysisControlPanel.useDashboardStore[setSourceMode]"]);
    const setAnalysisStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[setAnalysisStatus]": (s)=>s.setAnalysisStatus
    }["AnalysisControlPanel.useDashboardStore[setAnalysisStatus]"]);
    const startSimulation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "AnalysisControlPanel.useDashboardStore[startSimulation]": (s)=>s.startSimulation
    }["AnalysisControlPanel.useDashboardStore[startSimulation]"]);
    const totalEvents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AnalysisControlPanel.useMemo[totalEvents]": ()=>Object.values(eventCounts).reduce({
                "AnalysisControlPanel.useMemo[totalEvents]": (acc, v)=>acc + v
            }["AnalysisControlPanel.useMemo[totalEvents]"], 0)
    }["AnalysisControlPanel.useMemo[totalEvents]"], [
        eventCounts
    ]);
    const onFileChange = (e)=>{
        var _e_target_files;
        var _e_target_files_;
        const f = (_e_target_files_ = (_e_target_files = e.target.files) === null || _e_target_files === void 0 ? void 0 : _e_target_files[0]) !== null && _e_target_files_ !== void 0 ? _e_target_files_ : null;
        var _f_name;
        setFileName((_f_name = f === null || f === void 0 ? void 0 : f.name) !== null && _f_name !== void 0 ? _f_name : "");
        onFileSelected(f);
        if (f) {
            setSourceMode("media");
            setAnalysisStatus("idle");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-2xl border border-white/[0.08] bg-[#12181f]/95 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 flex flex-wrap items-start justify-between gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-slate-100",
                                children: "Data source & analysis"
                            }, void 0, false, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-xs text-slate-500",
                                children: "Upload a long audio/video recording and run in-browser classification."
                            }, void 0, false, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-400",
                        children: sourceMode === "media" ? "Real file mode" : "Simulation mode"
                    }, void 0, false, {
                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnalysisControlPanel.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "group flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-cyan-500/35 bg-cyan-500/5 px-4 py-3 transition hover:border-cyan-400/60 hover:bg-cyan-500/10",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-slate-200",
                                        children: fileName || mediaName || "Select client recording (.mp4/.wav/.mp3/.m4a/.webm)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 72,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "rounded-md border border-cyan-500/35 px-2 py-1 text-xs text-cyan-200",
                                        children: "Browse"
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 75,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        className: "hidden",
                                        accept: "audio/*,video/*",
                                        onChange: onFileChange
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 78,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setPlaying(!isPlaying),
                                        disabled: sourceMode !== "media" || !mediaName,
                                        className: "rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45",
                                        children: isPlaying ? "Pause analysis" : "Run analysis"
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            onFileSelected(null);
                                            setSourceMode("simulation");
                                            startSimulation();
                                        },
                                        className: "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10",
                                        children: "Back to simulation"
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this),
                            sourceMode === "media" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between text-[11px] text-slate-500",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "Status: ",
                                                    analysisStatus
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                                lineNumber: 111,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "Progress: ",
                                                    (analysisProgress * 100).toFixed(1),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                                lineNumber: 112,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 110,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-1.5 rounded-full bg-white/10",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-[width] duration-200",
                                            style: {
                                                width: "".concat(Math.max(0, Math.min(100, analysisProgress * 100)), "%")
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/components/AnalysisControlPanel.tsx",
                                            lineNumber: 115,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 114,
                                        columnNumber: 15
                                    }, this),
                                    analysisError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-red-300",
                                        children: analysisError
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 120,
                                        columnNumber: 32
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 109,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] uppercase tracking-wider text-slate-500",
                                children: "Analysis speed"
                            }, void 0, false, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-1",
                                children: SPEEDS.map((speed)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setPlaybackRate(speed),
                                        className: "rounded-md border px-2 py-1 text-xs transition ".concat(speed === playbackRate ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-100" : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"),
                                        children: [
                                            speed,
                                            "x"
                                        ]
                                    }, speed, true, {
                                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                                        lineNumber: 129,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnalysisControlPanel.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-white/10 bg-black/25 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] uppercase text-slate-500",
                                children: "Duration"
                            }, void 0, false, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 148,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 font-mono text-base text-slate-100",
                                children: formatDuration(sourceMode === "media" ? mediaDurationMs : elapsedMs)
                            }, void 0, false, {
                                fileName: "[project]/components/AnalysisControlPanel.tsx",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this),
                    Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVENT_LABELS"]).map((k)=>{
                        const key = k;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-lg border border-white/10 bg-black/25 p-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[10px] uppercase text-slate-500",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EVENT_LABELS"][key]
                                }, void 0, false, {
                                    fileName: "[project]/components/AnalysisControlPanel.tsx",
                                    lineNumber: 157,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 font-mono text-base text-slate-100",
                                    children: eventCounts[key]
                                }, void 0, false, {
                                    fileName: "[project]/components/AnalysisControlPanel.tsx",
                                    lineNumber: 158,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, key, true, {
                            fileName: "[project]/components/AnalysisControlPanel.tsx",
                            lineNumber: 156,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnalysisControlPanel.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-3 text-xs text-slate-500",
                children: [
                    "Total detected events: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-slate-300",
                        children: totalEvents
                    }, void 0, false, {
                        fileName: "[project]/components/AnalysisControlPanel.tsx",
                        lineNumber: 165,
                        columnNumber: 32
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnalysisControlPanel.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/AnalysisControlPanel.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_s(AnalysisControlPanel, "O9hQoRDB8DtzRu4o5/bMyR4ARdY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
_c = AnalysisControlPanel;
var _c;
__turbopack_context__.k.register(_c, "AnalysisControlPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/useSimulationEngine.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSimulationEngine",
    ()=>useSimulationEngine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function useSimulationEngine(enabled) {
    _s();
    const tick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useSimulationEngine.useDashboardStore[tick]": (s)=>s.tickSimulation
    }["useSimulationEngine.useDashboardStore[tick]"]);
    const startSimulation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useSimulationEngine.useDashboardStore[startSimulation]": (s)=>s.startSimulation
    }["useSimulationEngine.useDashboardStore[startSimulation]"]);
    const timeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSimulationEngine.useEffect": ()=>{
            if (!enabled) return;
            startSimulation();
            const schedule = {
                "useSimulationEngine.useEffect.schedule": ()=>{
                    const delay = 500 + Math.random() * 500;
                    timeoutRef.current = setTimeout({
                        "useSimulationEngine.useEffect.schedule": ()=>{
                            tick();
                            schedule();
                        }
                    }["useSimulationEngine.useEffect.schedule"], delay);
                }
            }["useSimulationEngine.useEffect.schedule"];
            tick();
            schedule();
            return ({
                "useSimulationEngine.useEffect": ()=>{
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                }
            })["useSimulationEngine.useEffect"];
        }
    }["useSimulationEngine.useEffect"], [
        enabled,
        startSimulation,
        tick
    ]);
}
_s(useSimulationEngine, "+rZO8fJkZhkOT8CtGqMmod88qmc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/usePlaybackScrubber.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePlaybackScrubber",
    ()=>usePlaybackScrubber
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function usePlaybackScrubber(enabled) {
    _s();
    const isPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "usePlaybackScrubber.useDashboardStore[isPlaying]": (s)=>s.isPlaying
    }["usePlaybackScrubber.useDashboardStore[isPlaying]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePlaybackScrubber.useEffect": ()=>{
            if (!enabled || !isPlaying) return;
            let rafId;
            let lastTs = null;
            const loop = {
                "usePlaybackScrubber.useEffect.loop": (ts)=>{
                    if (lastTs == null) lastTs = ts;
                    const dt = ts - lastTs;
                    lastTs = ts;
                    const s = __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"].getState();
                    const next = Math.min(s.playbackOffsetMs + dt, s.elapsedMs);
                    __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"].getState().setPlaybackOffset(next);
                    if (next >= s.elapsedMs) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"].setState({
                            isPlaying: false
                        });
                        return;
                    }
                    rafId = requestAnimationFrame(loop);
                }
            }["usePlaybackScrubber.useEffect.loop"];
            rafId = requestAnimationFrame(loop);
            return ({
                "usePlaybackScrubber.useEffect": ()=>cancelAnimationFrame(rafId)
            })["usePlaybackScrubber.useEffect"];
        }
    }["usePlaybackScrubber.useEffect"], [
        enabled,
        isPlaying
    ]);
}
_s(usePlaybackScrubber, "HC7wRryl9X4m0/d4BWWZYaKuAEc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/audioAnalysis.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "classifyFromFeatures",
    ()=>classifyFromFeatures,
    "createLiveFeatureState",
    ()=>createLiveFeatureState,
    "extractSignalFeatures",
    ()=>extractSignalFeatures
]);
"use client";
function createLiveFeatureState() {
    return {
        smoothedRms: 0,
        smoothedFlux: 0,
        prevRms: 0,
        apneaCooldown: 0
    };
}
function clamp01(v) {
    return Math.max(0, Math.min(1, v));
}
function extractSignalFeatures(timeDomain, freqDomain) {
    let sumSq = 0;
    let zcr = 0;
    let prev = 128;
    for(let i = 0; i < timeDomain.length; i += 1){
        const v = (timeDomain[i] - 128) / 128;
        sumSq += v * v;
        if ((timeDomain[i] - 128) * (prev - 128) < 0) zcr += 1;
        prev = timeDomain[i];
    }
    const rms = Math.sqrt(sumSq / timeDomain.length);
    const zcrNorm = clamp01(zcr / (timeDomain.length * 0.5));
    let low = 0;
    let mid = 0;
    let high = 0;
    const lowMax = Math.floor(freqDomain.length * 0.08);
    const midMax = Math.floor(freqDomain.length * 0.32);
    for(let i = 0; i < freqDomain.length; i += 1){
        const p = freqDomain[i] / 255;
        if (i < lowMax) low += p;
        else if (i < midMax) mid += p;
        else high += p;
    }
    const total = low + mid + high + 1e-6;
    const lowRatio = low / total;
    const highRatio = high / total;
    const tonalRatio = clamp01((lowRatio * 1.2 + (1 - highRatio) * 0.6) / 1.8);
    const intensity = clamp01(rms * 3.8 + lowRatio * 0.55 + (1 - zcrNorm) * 0.2) * 100;
    const effort = clamp01(rms * 2.3 + zcrNorm * 0.55 + (1 - lowRatio) * 0.25) * 100;
    return {
        intensity,
        effort,
        tonality: tonalRatio
    };
}
function classifyFromFeatures(snapshot, tonality, state) {
    const i = snapshot.intensity;
    const e = snapshot.effort;
    const flux = Math.abs(i - state.prevRms);
    state.smoothedFlux = state.smoothedFlux * 0.8 + flux * 0.2;
    state.prevRms = i;
    if (state.apneaCooldown > 0) state.apneaCooldown -= 1;
    const apneaLike = i < 18 && e > 45 && tonality < 0.55 && state.smoothedFlux < 3.8 && state.apneaCooldown <= 0;
    if (apneaLike) {
        state.apneaCooldown = 8;
        return "breathing_interruption";
    }
    if (i > 70 && e > 52 && tonality > 0.5) return "heavy_snore";
    if (i > 42 && tonality > 0.45) return "slow_snore";
    return "normal_breathing";
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/useMediaAnalysisEngine.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMediaAnalysisEngine",
    ()=>useMediaAnalysisEngine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audioAnalysis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/audioAnalysis.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const SAMPLE_INTERVAL_MS = 700;
function useMediaAnalysisEngine(file) {
    _s();
    const playbackRate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[playbackRate]": (s)=>s.playbackRate
    }["useMediaAnalysisEngine.useDashboardStore[playbackRate]"]);
    const isPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[isPlaying]": (s)=>s.isPlaying
    }["useMediaAnalysisEngine.useDashboardStore[isPlaying]"]);
    const playbackOffsetMs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[playbackOffsetMs]": (s)=>s.playbackOffsetMs
    }["useMediaAnalysisEngine.useDashboardStore[playbackOffsetMs]"]);
    const setPlaybackOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[setPlaybackOffset]": (s)=>s.setPlaybackOffset
    }["useMediaAnalysisEngine.useDashboardStore[setPlaybackOffset]"]);
    const setPlaying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[setPlaying]": (s)=>s.setPlaying
    }["useMediaAnalysisEngine.useDashboardStore[setPlaying]"]);
    const ingestExternalSample = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[ingestExternalSample]": (s)=>s.ingestExternalSample
    }["useMediaAnalysisEngine.useDashboardStore[ingestExternalSample]"]);
    const setAnalysisStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[setAnalysisStatus]": (s)=>s.setAnalysisStatus
    }["useMediaAnalysisEngine.useDashboardStore[setAnalysisStatus]"]);
    const resetForMedia = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[resetForMedia]": (s)=>s.resetForMedia
    }["useMediaAnalysisEngine.useDashboardStore[resetForMedia]"]);
    const setMediaDuration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "useMediaAnalysisEngine.useDashboardStore[setMediaDuration]": (s)=>s.setMediaDuration
    }["useMediaAnalysisEngine.useDashboardStore[setMediaDuration]"]);
    const mediaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const audioCtxRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const analyserRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sourceNodeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const urlRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const rafRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastSampleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(-1);
    const ignoreSeekRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMediaAnalysisEngine.useEffect": ()=>{
            if (!file) return;
            let disposed = false;
            const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
            media.preload = "metadata";
            media.crossOrigin = "anonymous";
            media.controls = false;
            media.muted = true;
            media.setAttribute("playsinline", "true");
            media.style.display = "none";
            document.body.appendChild(media);
            mediaRef.current = media;
            const objectUrl = URL.createObjectURL(file);
            urlRef.current = objectUrl;
            media.src = objectUrl;
            resetForMedia(file.name, 0);
            const onLoadedMetadata = {
                "useMediaAnalysisEngine.useEffect.onLoadedMetadata": ()=>{
                    if (disposed) return;
                    const durationMs = Number.isFinite(media.duration) ? media.duration * 1000 : 0;
                    setMediaDuration(durationMs);
                    setAnalysisStatus("idle");
                }
            }["useMediaAnalysisEngine.useEffect.onLoadedMetadata"];
            const onEnded = {
                "useMediaAnalysisEngine.useEffect.onEnded": ()=>{
                    setPlaying(false);
                    setAnalysisStatus("completed");
                }
            }["useMediaAnalysisEngine.useEffect.onEnded"];
            media.addEventListener("loadedmetadata", onLoadedMetadata);
            media.addEventListener("ended", onEnded);
            return ({
                "useMediaAnalysisEngine.useEffect": ()=>{
                    disposed = true;
                    media.pause();
                    media.removeEventListener("loadedmetadata", onLoadedMetadata);
                    media.removeEventListener("ended", onEnded);
                    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
                    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
                    if (analyserRef.current) analyserRef.current.disconnect();
                    if (audioCtxRef.current) {
                        void audioCtxRef.current.close();
                    }
                    sourceNodeRef.current = null;
                    analyserRef.current = null;
                    audioCtxRef.current = null;
                    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
                    urlRef.current = null;
                    media.remove();
                    mediaRef.current = null;
                }
            })["useMediaAnalysisEngine.useEffect"];
        }
    }["useMediaAnalysisEngine.useEffect"], [
        file,
        resetForMedia,
        setAnalysisStatus,
        setMediaDuration,
        setPlaying
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMediaAnalysisEngine.useEffect": ()=>{
            const media = mediaRef.current;
            if (!media) return;
            media.playbackRate = playbackRate;
        }
    }["useMediaAnalysisEngine.useEffect"], [
        playbackRate
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMediaAnalysisEngine.useEffect": ()=>{
            const media = mediaRef.current;
            if (!media) return;
            const syncPlayState = {
                "useMediaAnalysisEngine.useEffect.syncPlayState": async ()=>{
                    try {
                        if (isPlaying) {
                            if (!audioCtxRef.current) {
                                const ctx = new AudioContext();
                                const analyser = ctx.createAnalyser();
                                analyser.fftSize = 2048;
                                analyser.smoothingTimeConstant = 0.68;
                                const source = ctx.createMediaElementSource(media);
                                source.connect(analyser);
                                analyser.connect(ctx.destination);
                                audioCtxRef.current = ctx;
                                analyserRef.current = analyser;
                                sourceNodeRef.current = source;
                            }
                            if (audioCtxRef.current.state === "suspended") {
                                await audioCtxRef.current.resume();
                            }
                            media.playbackRate = playbackRate;
                            await media.play();
                            setAnalysisStatus("running");
                        } else {
                            media.pause();
                        }
                    } catch (error) {
                        const message = error instanceof Error ? error.message : "Failed to start media analysis.";
                        setAnalysisStatus("error", message);
                        setPlaying(false);
                    }
                }
            }["useMediaAnalysisEngine.useEffect.syncPlayState"];
            void syncPlayState();
        }
    }["useMediaAnalysisEngine.useEffect"], [
        isPlaying,
        playbackRate,
        setAnalysisStatus,
        setPlaying
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMediaAnalysisEngine.useEffect": ()=>{
            const media = mediaRef.current;
            if (!media || ignoreSeekRef.current) return;
            const targetSec = playbackOffsetMs / 1000;
            if (Math.abs(media.currentTime - targetSec) > 0.75) {
                media.currentTime = targetSec;
            }
        }
    }["useMediaAnalysisEngine.useEffect"], [
        playbackOffsetMs
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMediaAnalysisEngine.useEffect": ()=>{
            if (!file) return;
            const featureState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audioAnalysis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createLiveFeatureState"])();
            const time = new Uint8Array(2048);
            const freq = new Uint8Array(1024);
            const loop = {
                "useMediaAnalysisEngine.useEffect.loop": ()=>{
                    const media = mediaRef.current;
                    const analyser = analyserRef.current;
                    if (!media || !analyser) {
                        rafRef.current = requestAnimationFrame(loop);
                        return;
                    }
                    const nowMs = media.currentTime * 1000;
                    ignoreSeekRef.current = true;
                    setPlaybackOffset(nowMs);
                    ignoreSeekRef.current = false;
                    if (nowMs - lastSampleRef.current >= SAMPLE_INTERVAL_MS) {
                        analyser.getByteTimeDomainData(time);
                        analyser.getByteFrequencyData(freq);
                        const features = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audioAnalysis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["extractSignalFeatures"])(time, freq);
                        const snapshot = {
                            intensity: Math.round(features.intensity * 10) / 10,
                            effort: Math.round(features.effort * 10) / 10
                        };
                        const type = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audioAnalysis$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classifyFromFeatures"])(snapshot, features.tonality, featureState);
                        ingestExternalSample(nowMs, snapshot, type);
                        lastSampleRef.current = nowMs;
                    }
                    rafRef.current = requestAnimationFrame(loop);
                }
            }["useMediaAnalysisEngine.useEffect.loop"];
            rafRef.current = requestAnimationFrame(loop);
            return ({
                "useMediaAnalysisEngine.useEffect": ()=>{
                    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
                    lastSampleRef.current = -1;
                }
            })["useMediaAnalysisEngine.useEffect"];
        }
    }["useMediaAnalysisEngine.useEffect"], [
        file,
        ingestExternalSample,
        setPlaybackOffset
    ]);
}
_s(useMediaAnalysisEngine, "16cWsaa6yN2iAMQ7R7yfEBOGS/4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Dashboard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dashboard",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DashboardHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/DashboardHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$CircularGauge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/CircularGauge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$EventTimeline$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/EventTimeline.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AudioPlaybackBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/AudioPlaybackBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AnalysisControlPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/AnalysisControlPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useSimulationEngine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useSimulationEngine.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$usePlaybackScrubber$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/usePlaybackScrubber.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useMediaAnalysisEngine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useMediaAnalysisEngine.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/store/dashboardStore.ts [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
const SphereViewport = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/SphereViewport.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.SphereViewport
        })), {
    loadableGenerated: {
        modules: [
            "[project]/components/SphereViewport.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SphereLoading, {}, void 0, false, {
            fileName: "[project]/components/Dashboard.tsx",
            lineNumber: 20,
            columnNumber: 32
        }, ("TURBOPACK compile-time value", void 0))
});
_c = SphereViewport;
function SphereLoading() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-[300px] items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0d1218]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400"
        }, void 0, false, {
            fileName: "[project]/components/Dashboard.tsx",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/Dashboard.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_c1 = SphereLoading;
function DashboardBody() {
    _s();
    const [selectedFile, setSelectedFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const intensity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardBody.useDashboardStore[intensity]": (s)=>s.intensity
    }["DashboardBody.useDashboardStore[intensity]"]);
    const effort = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardBody.useDashboardStore[effort]": (s)=>s.effort
    }["DashboardBody.useDashboardStore[effort]"]);
    const sourceMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"])({
        "DashboardBody.useDashboardStore[sourceMode]": (s)=>s.sourceMode
    }["DashboardBody.useDashboardStore[sourceMode]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useSimulationEngine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationEngine"])(sourceMode === "simulation");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$usePlaybackScrubber$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlaybackScrubber"])(sourceMode === "simulation");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useMediaAnalysisEngine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMediaAnalysisEngine"])(sourceMode === "media" ? selectedFile : null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DashboardHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DashboardHeader"], {}, void 0, false, {
                fileName: "[project]/components/Dashboard.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AnalysisControlPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnalysisControlPanel"], {
                    onFileSelected: setSelectedFile
                }, void 0, false, {
                    fileName: "[project]/components/Dashboard.tsx",
                    lineNumber: 45,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/Dashboard.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center lg:col-span-3 lg:justify-end",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$CircularGauge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CircularGauge"], {
                            label: "Intensity",
                            value: intensity,
                            className: "w-full max-w-[240px]"
                        }, void 0, false, {
                            fileName: "[project]/components/Dashboard.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/Dashboard.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SphereViewport, {}, void 0, false, {
                            fileName: "[project]/components/Dashboard.tsx",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/Dashboard.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center lg:col-span-3 lg:justify-start",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$CircularGauge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CircularGauge"], {
                            label: "Effort",
                            value: effort,
                            className: "w-full max-w-[240px]"
                        }, void 0, false, {
                            fileName: "[project]/components/Dashboard.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/Dashboard.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/Dashboard.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-8 space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AudioPlaybackBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AudioPlaybackBar"], {}, void 0, false, {
                        fileName: "[project]/components/Dashboard.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$EventTimeline$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EventTimeline"], {}, void 0, false, {
                        fileName: "[project]/components/Dashboard.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/Dashboard.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/Dashboard.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_s(DashboardBody, "C3aJddI7mnzrZJdfel4cTmixt9M=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$store$2f$dashboardStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboardStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useSimulationEngine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSimulationEngine"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$usePlaybackScrubber$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePlaybackScrubber"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useMediaAnalysisEngine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMediaAnalysisEngine"]
    ];
});
_c2 = DashboardBody;
function Dashboard() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen bg-[#0a0e14] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.06),transparent)]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DashboardBody, {}, void 0, false, {
            fileName: "[project]/components/Dashboard.tsx",
            lineNumber: 71,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/Dashboard.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
_c3 = Dashboard;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "SphereViewport");
__turbopack_context__.k.register(_c1, "SphereLoading");
__turbopack_context__.k.register(_c2, "DashboardBody");
__turbopack_context__.k.register(_c3, "Dashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_92a3d75c._.js.map