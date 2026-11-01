import type { MetadataRoute } from "next";

import { SITE } from "@/constants/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#06130e",
    theme_color: "#06130e",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
