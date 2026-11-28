const manifest = {
  name: "ZipDrop",
  short_name: "ZipDrop",
  description: "Free online PDF, image and file tools — no sign-up, no watermark.",
  start_url: "/",
  display: "standalone",
  orientation: "portrait-primary",
  theme_color: "#078C91",
  background_color: "#FCFDFE",
  scope: "/",
  icons: [
    { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable any" },
    { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable any" },
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
  categories: ["utilities", "productivity", "business"],
};

export default function manifestRoute() {
  return manifest;
}

export { manifest };
