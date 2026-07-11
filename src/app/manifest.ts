import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catch Phrase",
    short_name: "Catch Phrase",
    description:
      "Pass-and-play party game: describe the phrase, beat the buzzer!",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b14",
    theme_color: "#0b0b14",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
