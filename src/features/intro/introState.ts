export const INTRO_DONE_EVENT = "honeybee:intro-done";
export const INTRO_SEEN_KEY = "honeybee-intro-seen";

/**
 * Runs in <head> before first paint. Decides whether the swarm intro plays, so
 * the overlay never flashes for returning visitors, crawlers or reduced-motion users.
 * Without JavaScript the attribute is never set and the overlay stays hidden.
 */
export const INTRO_GATE_SCRIPT = `(function(){var d=document.documentElement;try{var skip=location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${INTRO_SEEN_KEY}")||/bot|crawl|spider|slurp|preview/i.test(navigator.userAgent);d.dataset.intro=skip?"skip":"playing";}catch(e){d.dataset.intro="skip";}})();`;

export function finishIntro(): void {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage can be unavailable (private mode); the intro will simply replay next visit.
  }
  document.documentElement.dataset.intro = "done";
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}
