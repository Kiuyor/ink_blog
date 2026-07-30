// scripts/gen-avatar.mjs
// Rasterizes the on-brand ink avatar (SVG -> PNG) using sharp.
// Brand color: #9370DB (violet). Motif: an ink drop + calligraphic brushstroke
// + a few splash droplets, on a transparent background so it works inside the
// circular profile frame on any theme.
//
// Run: node scripts/gen-avatar.mjs
// Output: src/assets/images/ink-avatar.png (overwrites the avatar)

import sharp from "sharp";
import path from "node:path";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="ink" x1="0.15" y1="0.1" x2="0.85" y2="0.95">
      <stop offset="0" stop-color="#b794f6"/>
      <stop offset="0.55" stop-color="#9370DB"/>
      <stop offset="1" stop-color="#6d28d9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#9370DB" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#9370DB" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- soft glow -->
  <circle cx="256" cy="244" r="210" fill="url(#glow)"/>

  <!-- calligraphic brushstroke swash -->
  <path d="M78 372 C 150 312, 214 312, 300 262 C 356 230, 404 214, 446 168"
        fill="none" stroke="url(#ink)" stroke-width="34" stroke-linecap="round" opacity="0.92"/>
  <path d="M96 408 C 168 372, 232 376, 300 344"
        fill="none" stroke="url(#ink)" stroke-width="20" stroke-linecap="round" opacity="0.55"/>

  <!-- main ink drop (teardrop) -->
  <path d="M256 116 C 302 180, 332 232, 332 290 a76 76 0 0 1 -152 0 C 180 232 210 180 256 116 Z"
        fill="url(#ink)"/>

  <!-- highlight -->
  <ellipse cx="226" cy="250" rx="20" ry="30" fill="#ffffff" opacity="0.22"/>

  <!-- splash droplets -->
  <circle cx="402" cy="320" r="15" fill="#9370DB"/>
  <circle cx="372" cy="378" r="9" fill="#b794f6"/>
  <circle cx="150" cy="158" r="8" fill="#6d28d9" opacity="0.8"/>
  <circle cx="356" cy="118" r="6" fill="#9370DB" opacity="0.85"/>
</svg>`;

const out = path.resolve("src/assets/images/ink-avatar.png");
await sharp(Buffer.from(svg), { density: 384 })
	.resize(512, 512)
	.png()
	.toFile(out);

console.log(`[gen-avatar] Wrote ${out}`);
