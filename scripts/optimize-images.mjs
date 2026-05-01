import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

const INPUT_DIR  = './public/images';
const OUTPUT_DIR = './public/images/opt';

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const files = readdirSync(INPUT_DIR).filter(f =>
  /\.(png|jpg|jpeg)$/i.test(f) && !f.startsWith('opt')
);

console.log(`Optimizing ${files.length} images...\n`);

let savedTotal = 0;

for (const file of files) {
  const src  = join(INPUT_DIR, file);
  const name = basename(file, extname(file));
  const dest = join(OUTPUT_DIR, `${name}.webp`);

  const info = await sharp(src)
    .webp({ quality: 82, effort: 4 })
    .toFile(dest);

  const orig = (await import('fs')).statSync(src).size;
  const saved = orig - info.size;
  savedTotal += saved;

  console.log(
    `  ${file.padEnd(35)} ${(orig/1024).toFixed(0).padStart(5)} KB  →  ${(info.size/1024).toFixed(0).padStart(5)} KB   (-${((saved/orig)*100).toFixed(0)}%)`
  );
}

console.log(`\nTotal saved: ${(savedTotal/1024/1024).toFixed(2)} MB`);
