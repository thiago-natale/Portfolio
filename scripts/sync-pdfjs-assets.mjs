import { cp, mkdir } from "node:fs/promises";
// Keep optional non-embedded PDF fonts local, including their upstream licenses.
await mkdir("public/pdfjs", { recursive: true });
await Promise.all([
  cp("node_modules/pdfjs-dist/standard_fonts", "public/pdfjs/standard_fonts", {
    recursive: true,
  }),
  cp(
    "node_modules/pdfjs-dist/web/pdf_viewer.css",
    "public/pdfjs/pdf_viewer.css",
  ),
  cp("node_modules/pdfjs-dist/web/images", "public/pdfjs/images", {
    recursive: true,
  }),
  cp("node_modules/pdfjs-dist/LICENSE", "public/pdfjs/LICENSE"),
]);
console.log("PDF.js reader styles, graphics and standard fonts synchronized.");
