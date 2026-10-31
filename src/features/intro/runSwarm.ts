import { canvasPixelRatio, startSwarmLoop, type SwarmCallbacks, type SwarmViewport } from "./swarmEngine";

import type { SwarmWorkerEvent, SwarmWorkerStart } from "./swarm.worker";

/**
 * Starts the intro on a canvas sized to its CSS box. Prefers a Web Worker with
 * OffscreenCanvas (zero main-thread cost); falls back to the main thread.
 * Returns a cancel function.
 */
export function runSwarm(canvas: HTMLCanvasElement, callbacks: SwarmCallbacks): () => void {
  const viewport: SwarmViewport = {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    devicePixelRatio: window.devicePixelRatio,
    cores: navigator.hardwareConcurrency || 4,
  };
  const dpr = canvasPixelRatio(viewport);
  const pixelWidth = Math.round(viewport.width * dpr);
  const pixelHeight = Math.round(viewport.height * dpr);

  if (typeof canvas.transferControlToOffscreen === "function" && typeof Worker === "function") {
    try {
      const offscreen = canvas.transferControlToOffscreen();
      offscreen.width = pixelWidth;
      offscreen.height = pixelHeight;
      const worker = new Worker(new URL("./swarm.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<SwarmWorkerEvent>) => {
        if (event.data === "burst") callbacks.onBurst();
        if (event.data === "complete") {
          worker.terminate();
          callbacks.onComplete();
        }
      };
      worker.onerror = () => {
        worker.terminate();
        callbacks.onComplete();
      };
      const message: SwarmWorkerStart = { canvas: offscreen, viewport };
      worker.postMessage(message, [offscreen]);
      return () => worker.terminate();
    } catch {
      // Fall through to the main-thread renderer.
    }
  }

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    callbacks.onComplete();
    return () => {};
  }
  return startSwarmLoop(ctx, viewport, callbacks);
}
