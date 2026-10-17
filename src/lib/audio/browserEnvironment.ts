import type { AudioEnvironment } from "./audioEngine";
import { RETIRE_DELAY_MS, SILENT_LOOP } from "./constants";
import { createSilentWav } from "./waveforms";

/** WebKit Audio Session API (iOS/iPadOS 16.4+, Safari 17). Not in lib.dom yet. */
type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string };
};

const isIOS = (): boolean =>
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const setPlaybackSession = (): boolean => {
  const session = (navigator as NavigatorWithAudioSession).audioSession;
  if (!session) return false;
  try {
    // "playback" ignores the ring/silent switch (default "auto" obeys it).
    if (session.type !== "playback") session.type = "playback";
    return true;
  } catch {
    return false;
  }
};

let silentLoop: HTMLAudioElement | null = null;

/**
 * Older iOS: while an <audio> element plays, the whole page uses the
 * playback category, so Web Audio is heard even on silent. Skipped elsewhere
 * (on Android it would add a pointless media notification).
 */
const startSilentLoop = (): void => {
  if (!isIOS()) return;
  if (!silentLoop) {
    const wav = createSilentWav(SILENT_LOOP.sampleRate, SILENT_LOOP.durationS);
    const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
    silentLoop = new Audio(url);
    silentLoop.loop = true;
    silentLoop.setAttribute("playsinline", "");
    silentLoop.setAttribute("x-webkit-airplay", "deny");
  }
  if (silentLoop.paused) {
    silentLoop.play().catch((error: unknown) => {
      console.warn("[audio] silent-switch workaround failed", error);
    });
  }
};

export const createBrowserEnvironment = (): AudioEnvironment => ({
  createContext: () => new AudioContext({ latencyHint: "interactive" }),
  now: () => performance.now(),
  onVisibilityChange: (listener) => {
    const notify = () => listener(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", notify);
    window.addEventListener("pageshow", notify);
  },
  setPlaybackSession,
  startSilentLoop,
  retireDelayMs: RETIRE_DELAY_MS,
});
