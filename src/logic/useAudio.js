import { useRef, useEffect, useCallback } from "react";

const SOUNDS = {
  click:     { src: "/sfx/click.wav" },
  warning:   { src: "/sfx/warning.wav" },
  win:       { src: "/sfx/win.wav" },
  lose:      { src: "/sfx/lose.wav",      duration: 2 }, 
  heartGain: { src: "/sfx/heart-gain.wav" },
  heartLose: { src: "/sfx/heart-lose.wav" },
  gameOver:  { src: "/sfx/game-over.wav", duration: 2 }, 
  whoosh:    { src: "/sfx/whoosh.wav" },
};

export function useAudio() {
  const ctxRef     = useRef(null);
  const buffersRef = useRef({});
  const readyRef   = useRef(false);

  // Load all sounds on mount
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    async function loadAll() {
      await Promise.all(
        Object.entries(SOUNDS).map(async ([name, { src }]) => {
          try {
            const res    = await fetch(src);
            const arr    = await res.arrayBuffer();
            const buffer = await ctx.decodeAudioData(arr);
            buffersRef.current[name] = buffer;
          } catch (err) {
            console.warn(`Audio: failed to load ${src}`, err);
          }
        })
      );
      readyRef.current = true;
    }

    loadAll();

    return () => {
      ctx.close();
    };
  }, []);

  // Resume AudioContext on first user gesture — browser autoplay policy
  const resume = useCallback(() => {
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
  }, []);

  // Play a sound by name
  const play = useCallback((name, volume = 1) => {
    const ctx    = ctxRef.current;
    const buffer = buffersRef.current[name];

    if (!ctx || !buffer || !readyRef.current) return;

    // Resume context if suspended
    if (ctx.state === "suspended") ctx.resume();

    const source     = ctx.createBufferSource();
    const gainNode   = ctx.createGain();
    source.buffer    = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const sound    = SOUNDS[name];
    const offset   = 0;
    const duration = sound.duration ?? buffer.duration;

    source.start(0, offset, duration);
  }, []);

  return { play, resume };
}