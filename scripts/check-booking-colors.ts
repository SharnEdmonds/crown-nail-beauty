// Guard rail: forbid hardcoded brand-color Tailwind classes inside src/booking/.
// Run via `npm run check:booking-colors`. CI fails if any match is found.
//
// Booking-module styling MUST come from CSS vars (var(--booking-*)) supplied by
// the bookingTheme document. Tailwind layout utilities (flex, grid, padding, etc.)
// are still allowed — only color utilities for the project's brand palette are blocked.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'booking');

// Forbidden Tailwind class names (from tailwind.config.ts + globals.css).
// Using a single regex with word-boundary guards. Class names appear as
// values inside string attributes / template literals; matching `\b` is good enough.
const FORBIDDEN = [
  // Backgrounds
  'bg-marble-stone',
  'bg-clean-white',
  'bg-crown-black',
  'bg-charcoal-grey',
  'bg-stone-grey',
  'bg-warm-black',
  'bg-soft-rose',
  'bg-brushed-gold',
  // Text
  'text-marble-stone',
  'text-clean-white',
  'text-crown-black',
  'text-charcoal-grey',
  'text-stone-grey',
  'text-warm-black',
  'text-soft-rose',
  'text-brushed-gold',
  // Borders
  'border-marble-stone',
  'border-clean-white',
  'border-crown-black',
  'border-charcoal-grey',
  'border-stone-grey',
  'border-warm-black',
  'border-soft-rose',
  'border-brushed-gold',
  // Shadows / outlines / divides
  'ring-brushed-gold',
  'ring-soft-rose',
  'fill-brushed-gold',
  'stroke-brushed-gold',
];

const PATTERN = new RegExp(`\\b(${FORBIDDEN.join('|')})\\b`);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(tsx?|css|mdx?)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

let violations = 0;
const files = walk(ROOT);
for (const file of files) {
  // Don't lint ourselves
  if (file.endsWith(`${sep}check-booking-colors.ts`)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const m = line.match(PATTERN);
    if (m) {
      console.error(
        `${relative(process.cwd(), file)}:${i + 1}: forbidden brand-color class "${m[1]}". Use CSS vars from the bookingTheme document instead.`,
      );
      violations += 1;
    }
  });
}

if (violations > 0) {
  console.error(`\n${violations} hardcoded brand-color class(es) found in src/booking/.`);
  console.error('Booking surfaces must consume colors via CSS vars — see src/booking/styles/booking.css.\n');
  process.exit(1);
} else {
  console.log(`✓ No hardcoded brand-color classes in src/booking/ (${files.length} files scanned).`);
}
