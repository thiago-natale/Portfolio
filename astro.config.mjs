// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";
import { loadEnv } from "vite";

const { SITE_URL } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "SITE_URL",
);
const publicUrl = process.env.SITE_URL || SITE_URL;
let site;
if (publicUrl) {
  const parsed = new URL(publicUrl);
  if (
    !["https:", "http:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new Error(
      "SITE_URL deve ser a URL pública da raiz do portfólio, sem credenciais, caminho, parâmetros ou fragmento.",
    );
  }
  site = parsed.href;
}

// https://astro.build/config
export default defineConfig({
  site,
  devToolbar: { enabled: false },
  vite: {
    // Astro's build/type preparation also runs Vite. Keep it from replacing
    // optimized modules belonging to a development server that is still open.
    cacheDir:
      process.env.NODE_ENV === "production"
        ? "node_modules/.vite/production"
        : "node_modules/.vite/development",
    // Discover both lazy PDF.js entry points before the first reader request.
    optimizeDeps: {
      include: [
        "pdfjs-dist/legacy/build/pdf.mjs",
        "pdfjs-dist/legacy/web/pdf_viewer.mjs",
      ],
    },
    plugins: [tailwindcss()],
  },

  integrations: site
    ? [
        sitemap({
          filter: (page) => !new URL(page).pathname.endsWith("/robots.txt"),
        }),
      ]
    : [],
});
