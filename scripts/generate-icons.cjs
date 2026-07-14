const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const outFile = path.join(__dirname, '..', 'src', 'lib', 'iconList.ts');

if (!fs.existsSync(iconsDir)) {
  console.error('icons directory not found:', iconsDir);
  process.exit(1);
}

const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));

const content = `// Auto-generated — do not edit manually.
// Run \`node scripts/generate-icons.cjs\` to regenerate.
export const ICON_FILENAMES: string[] = ${JSON.stringify(files, null, 2)};
`;

fs.writeFileSync(outFile, content, 'utf-8');
console.log(`Generated iconList.ts with ${files.length} icons`);
