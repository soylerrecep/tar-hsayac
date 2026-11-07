import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Regular icon SVG (1:1 with rounded corners for preview / icon.svg)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="30%" stop-color="#312e81" />
      <stop offset="70%" stop-color="#4338ca" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Background Base with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Subtle Inner Border Highlight -->
  <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="url(#accentGrad)" stroke-width="4" stroke-opacity="0.4" />

  <!-- Background Ambient Glow Behind Chronometer & Car -->
  <circle cx="256" cy="256" r="140" fill="#6366f1" opacity="0.25" filter="url(#glow)" />

  <!-- Chronometer / Calendar Outer Dial Ring -->
  <circle cx="256" cy="244" r="142" fill="url(#cardGrad)" stroke="url(#accentGrad)" stroke-width="8" stroke-dasharray="14 10" filter="url(#shadow)" />
  <circle cx="256" cy="244" r="122" fill="#0f172a" fill-opacity="0.45" />

  <!-- Calendar Top Header Tabs -->
  <g fill="#93c5fd" opacity="0.9">
    <rect x="200" y="88" width="18" height="34" rx="9" />
    <rect x="294" y="88" width="18" height="34" rx="9" />
  </g>

  <!-- Speedometer / Progress Arc -->
  <path d="M 160 270 A 110 110 0 1 1 352 270" fill="none" stroke="url(#goldGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="280" stroke-dashoffset="60" filter="url(#glow)" />

  <!-- Clock Hour / Countdown Hand -->
  <line x1="256" y1="244" x2="256" y2="164" stroke="#ffffff" stroke-width="7" stroke-linecap="round" />
  <line x1="256" y1="244" x2="314" y2="218" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
  <circle cx="256" cy="244" r="11" fill="#f8fafc" stroke="#312e81" stroke-width="4" />

  <!-- Sleek Modern Sports Car Silhouette in Lower Quadrant -->
  <g transform="translate(136, 280) scale(1.0)">
    <!-- Car Body -->
    <path d="M 20 54 
             C 36 50, 52 46, 76 44 
             L 108 26 
             C 120 18, 142 16, 168 18 
             L 192 34 
             C 212 36, 224 44, 234 54 
             C 238 58, 236 68, 226 70 
             L 14 70 
             C 6 68, 8 58, 20 54 Z"
          fill="url(#accentGrad)" 
          filter="url(#shadow)" />

    <!-- Windshield & Windows -->
    <path d="M 110 29 L 84 45 L 158 45 L 158 24 C 142 22, 126 24, 110 29 Z" fill="#0f172a" fill-opacity="0.8" />
    <path d="M 166 25 L 166 45 L 194 45 L 184 32 C 178 28, 172 26, 166 25 Z" fill="#0f172a" fill-opacity="0.8" />

    <!-- Headlight Beam -->
    <ellipse cx="228" cy="56" rx="6" ry="3" fill="#fef08a" filter="url(#glow)" />
    <!-- Taillight -->
    <ellipse cx="14" cy="58" rx="4" ry="2" fill="#ef4444" filter="url(#glow)" />

    <!-- Wheels -->
    <g fill="#020617">
      <circle cx="62" cy="70" r="19" stroke="#94a3b8" stroke-width="5" />
      <circle cx="62" cy="70" r="8" fill="#38bdf8" />
      <circle cx="186" cy="70" r="19" stroke="#94a3b8" stroke-width="5" />
      <circle cx="186" cy="70" r="8" fill="#38bdf8" />
    </g>
  </g>

  <!-- Glowing Sparkle / Notification Star (Top Right) -->
  <g transform="translate(372, 100)" filter="url(#glow)">
    <path d="M 24 0 L 30 16 L 46 22 L 30 28 L 24 44 L 18 28 L 2 22 L 18 16 Z" fill="url(#goldGrad)" />
  </g>
  <g transform="translate(100, 140)" filter="url(#glow)">
    <path d="M 12 0 L 15 8 L 23 11 L 15 14 L 12 22 L 9 14 L 1 11 L 9 8 Z" fill="#38bdf8" opacity="0.85" />
  </g>
</svg>`;

// 2. Maskable SVG: full bleed background (no border radius) and 15% inner safe margin
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="30%" stop-color="#312e81" />
      <stop offset="70%" stop-color="#4338ca" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Full-bleed background for maskable (no rx) -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Centered within 78% safe area (scale: 0.78, offset: (512 - 512*0.78)/2 = 56.32) -->
  <g transform="translate(56.32, 56.32) scale(0.78)">
    <!-- Ambient Glow -->
    <circle cx="256" cy="256" r="140" fill="#6366f1" opacity="0.3" filter="url(#glow)" />

    <!-- Chronometer / Calendar Outer Dial Ring -->
    <circle cx="256" cy="244" r="142" fill="url(#cardGrad)" stroke="url(#accentGrad)" stroke-width="8" stroke-dasharray="14 10" filter="url(#shadow)" />
    <circle cx="256" cy="244" r="122" fill="#0f172a" fill-opacity="0.45" />

    <!-- Calendar Top Header Tabs -->
    <g fill="#93c5fd" opacity="0.9">
      <rect x="200" y="88" width="18" height="34" rx="9" />
      <rect x="294" y="88" width="18" height="34" rx="9" />
    </g>

    <!-- Speedometer Arc -->
    <path d="M 160 270 A 110 110 0 1 1 352 270" fill="none" stroke="url(#goldGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="280" stroke-dashoffset="60" filter="url(#glow)" />

    <!-- Clock Hour Hand -->
    <line x1="256" y1="244" x2="256" y2="164" stroke="#ffffff" stroke-width="7" stroke-linecap="round" />
    <line x1="256" y1="244" x2="314" y2="218" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
    <circle cx="256" cy="244" r="11" fill="#f8fafc" stroke="#312e81" stroke-width="4" />

    <!-- Sleek Car Silhouette -->
    <g transform="translate(136, 280) scale(1.0)">
      <path d="M 20 54 
               C 36 50, 52 46, 76 44 
               L 108 26 
               C 120 18, 142 16, 168 18 
               L 192 34 
               C 212 36, 224 44, 234 54 
               C 238 58, 236 68, 226 70 
               L 14 70 
               C 6 68, 8 58, 20 54 Z"
            fill="url(#accentGrad)" 
            filter="url(#shadow)" />

      <path d="M 110 29 L 84 45 L 158 45 L 158 24 C 142 22, 126 24, 110 29 Z" fill="#0f172a" fill-opacity="0.8" />
      <path d="M 166 25 L 166 45 L 194 45 L 184 32 C 178 28, 172 26, 166 25 Z" fill="#0f172a" fill-opacity="0.8" />
      <ellipse cx="228" cy="56" rx="6" ry="3" fill="#fef08a" filter="url(#glow)" />
      <ellipse cx="14" cy="58" rx="4" ry="2" fill="#ef4444" filter="url(#glow)" />
      <g fill="#020617">
        <circle cx="62" cy="70" r="19" stroke="#94a3b8" stroke-width="5" />
        <circle cx="62" cy="70" r="8" fill="#38bdf8" />
        <circle cx="186" cy="70" r="19" stroke="#94a3b8" stroke-width="5" />
        <circle cx="186" cy="70" r="8" fill="#38bdf8" />
      </g>
    </g>

    <!-- Star sparkles -->
    <g transform="translate(372, 100)" filter="url(#glow)">
      <path d="M 24 0 L 30 16 L 46 22 L 30 28 L 24 44 L 18 28 L 2 22 L 18 16 Z" fill="url(#goldGrad)" />
    </g>
    <g transform="translate(100, 140)" filter="url(#glow)">
      <path d="M 12 0 L 15 8 L 23 11 L 15 14 L 12 22 L 9 14 L 1 11 L 9 8 Z" fill="#38bdf8" opacity="0.85" />
    </g>
  </g>
</svg>`;

async function run() {
  console.log('Writing public/icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);

  console.log('Generating pwa-512x512.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating pwa-192x192.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating pwa-maskable-512x512.png...');
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Generating apple-touch-icon.png (180x180)...');
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating favicon.ico / favicon-32x32.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // Also write standard favicon.png
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('All icons generated successfully in /public!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
