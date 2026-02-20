/**
 * generate-images.mjs
 *
 * 생성 파일:
 *   public/logo-1000.png       - 1000x1000 라이트 로고
 *   public/logo-1000-dark.png  - 1000x1000 다크 로고
 *   public/thumbnail.png       - 1932x828 라이트 썸네일
 *   public/thumbnail-dark.png  - 1932x828 다크 썸네일
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const tasks = [
  // 1000x1000 로고 (SVG 리사이즈)
  {
    input: 'logo.svg',
    output: 'logo-1000.png',
    width: 1000,
    height: 1000,
  },
  {
    input: 'logo-dark.svg',
    output: 'logo-1000-dark.png',
    width: 1000,
    height: 1000,
  },
  // 1932x828 썸네일 (별도 SVG -> PNG)
  {
    input: 'thumbnail.svg',
    output: 'thumbnail.png',
    width: 1932,
    height: 828,
  },
  {
    input: 'thumbnail-dark.svg',
    output: 'thumbnail-dark.png',
    width: 1932,
    height: 828,
  },
];

for (const { input, output, width, height } of tasks) {
  const inputPath = join(publicDir, input);
  const outputPath = join(publicDir, output);

  const svgBuffer = readFileSync(inputPath);

  await sharp(svgBuffer)
    .resize(width, height)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  console.log(`[OK] ${input} (${width}x${height}) -> ${output}`);
}

console.log('\nAll images generated successfully.');
