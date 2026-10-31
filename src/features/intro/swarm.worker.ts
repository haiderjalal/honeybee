import { startSwarmLoop, type SwarmViewport } from "./swarmEngine";

export interface SwarmWorkerStart {
  canvas: OffscreenCanvas;
  viewport: SwarmViewport;
}

export type SwarmWorkerEvent = "burst" | "complete";

// Minimal typing for the dedicated-worker scope (the project compiles against DOM typings).
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SwarmWorkerStart>) => void) | null;
  postMessage: (message: SwarmWorkerEvent) => void;
};

/** Renders the intro on an OffscreenCanvas so the main thread stays free for hydration and input. */
scope.onmessage = (event) => {
  const { canvas, viewport } = event.data;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    scope.postMessage("complete");
    return;
  }
  startSwarmLoop(ctx, viewport, {
    onBurst: () => scope.postMessage("burst"),
    onComplete: () => scope.postMessage("complete"),
  });
};
