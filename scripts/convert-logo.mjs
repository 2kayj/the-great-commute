import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const conversions = [
  { input: 'logo.svg', output: 'logo.png' },
  { input: 'logo-dark.svg', output: 'logo-dark.png' },
];

for (const { input, output } of conversions) {
  const svgBuffer = readFileSync(join(publicDir, input));
  await sharp(svgBuffer)
    .resize(600, 600)
    .png()
    .toFile(join(publicDir, output));
  console.log(`Converted ${input} -> ${output}`);
}

console.log('Done.');
