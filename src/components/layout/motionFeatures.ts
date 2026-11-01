/**
 * Motion feature sets, loaded on demand so each page only downloads what it animates.
 * `domAnimation` covers transforms, opacity and presence; `domMax` adds drag, which only the honey lab uses.
 */
export const loadAnimationFeatures = () => import("motion/react").then((mod) => mod.domAnimation);

export const loadDragFeatures = () => import("motion/react").then((mod) => mod.domMax);
