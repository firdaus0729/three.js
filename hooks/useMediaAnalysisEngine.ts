"use client";

import { useEffect, useRef } from "react";
import {
  classifyFromFeatures,
  createLiveFeatureState,
  extractSignalFeatures,
} from "@/lib/audioAnalysis";
import { useDashboardStore } from "@/store/dashboardStore";

const SAMPLE_INTERVAL_MS = 220;

export function useMediaAnalysisEngine(file: File | null) {
  const playbackRate = useDashboardStore((s) => s.playbackRate);
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const playbackOffsetMs = useDashboardStore((s) => s.playbackOffsetMs);
  const setPlaybackOffset = useDashboardStore((s) => s.setPlaybackOffset);
  const setPlaying = useDashboardStore((s) => s.setPlaying);
  const ingestExternalSample = useDashboardStore((s) => s.ingestExternalSample);
  const setAnalysisStatus = useDashboardStore((s) => s.setAnalysisStatus);
  const resetForMedia = useDashboardStore((s) => s.resetForMedia);
  const setMediaDuration = useDashboardStore((s) => s.setMediaDuration);

  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number>(-1);
  const ignoreSeekRef = useRef(false);

  useEffect(() => {
    if (!file) return;

    let disposed = false;
    const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    media.preload = "metadata";
    media.crossOrigin = "anonymous";
    media.controls = false;
    media.muted = false;
    media.volume = 1;
    media.setAttribute("playsinline", "true");
    media.style.display = "none";
    document.body.appendChild(media);

    mediaRef.current = media;
    const objectUrl = URL.createObjectURL(file);
    urlRef.current = objectUrl;
    media.src = objectUrl;

    resetForMedia(file.name, 0);

    const onLoadedMetadata = () => {
      if (disposed) return;
      const durationMs = Number.isFinite(media.duration) ? media.duration * 1000 : 0;
      setMediaDuration(durationMs);
      setAnalysisStatus("idle");
    };
    const onEnded = () => {
      setPlaying(false);
      setAnalysisStatus("completed");
    };
    const onMediaError = () => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "unknown";
      setPlaying(false);
      setAnalysisStatus(
        "error",
        `The browser cannot decode this ${extension.toUpperCase()} media stream. Try Chromium, or convert the file to WAV/MP4 and retry.`
      );
    };
    media.addEventListener("loadedmetadata", onLoadedMetadata);
    media.addEventListener("ended", onEnded);
    media.addEventListener("error", onMediaError);

    return () => {
      disposed = true;
      media.pause();
      media.removeEventListener("loadedmetadata", onLoadedMetadata);
      media.removeEventListener("ended", onEnded);
      media.removeEventListener("error", onMediaError);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
      if (gainNodeRef.current) gainNodeRef.current.disconnect();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
      sourceNodeRef.current = null;
      analyserRef.current = null;
      gainNodeRef.current = null;
      audioCtxRef.current = null;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      media.remove();
      mediaRef.current = null;
    };
  }, [file, resetForMedia, setAnalysisStatus, setMediaDuration, setPlaying]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const syncPlayState = async () => {
      try {
        if (isPlaying) {
          if (!audioCtxRef.current) {
            const ctx = new AudioContext();
            const analyser = ctx.createAnalyser();
            const silentOut = ctx.createGain();
            silentOut.gain.value = 0;
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.32;
            const source = ctx.createMediaElementSource(media);
            source.connect(analyser);
            analyser.connect(silentOut);
            silentOut.connect(ctx.destination);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
            sourceNodeRef.current = source;
            gainNodeRef.current = silentOut;
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
    };

    void syncPlayState();
  }, [isPlaying, playbackRate, setAnalysisStatus, setPlaying]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || ignoreSeekRef.current) return;
    const targetSec = playbackOffsetMs / 1000;
    if (Math.abs(media.currentTime - targetSec) > 0.75) {
      media.currentTime = targetSec;
    }
  }, [playbackOffsetMs]);

  useEffect(() => {
    if (!file) return;
    const featureState = createLiveFeatureState();
    const time = new Uint8Array(2048);
    const freq = new Uint8Array(1024);

    const loop = () => {
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
        const features = extractSignalFeatures(time, freq);
        const snapshot = {
          intensity: Math.round(features.intensity * 10) / 10,
          effort: Math.round(features.effort * 10) / 10,
        };
        const type = classifyFromFeatures(snapshot, features.tonality, featureState);
        ingestExternalSample(nowMs, snapshot, type);
        lastSampleRef.current = nowMs;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastSampleRef.current = -1;
    };
  }, [file, ingestExternalSample, setPlaybackOffset]);
}

