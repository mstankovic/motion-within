import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Motion Within",
    short_name: "Motion Within",
    description: "Train. Recover. Progress. — Ponovo pronađi pokret u sebi.",
    start_url: "/calendar",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f6f2",
    theme_color: "#0f6e62",
    lang: "sr-Latn",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
