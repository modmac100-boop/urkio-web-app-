const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  [/\bml-([a-z0-9\-\[\]\.]+)\b/g, 'ms-$1'],
  [/\bmr-([a-z0-9\-\[\]\.]+)\b/g, 'me-$1'],
  [/\bpl-([a-z0-9\-\[\]\.]+)\b/g, 'ps-$1'],
  [/\bpr-([a-z0-9\-\[\]\.]+)\b/g, 'pe-$1'],
  [/\bleft-([a-z0-9\-\[\]\.]+)\b/g, 'start-$1'],
  [/\bright-([a-z0-9\-\[\]\.]+)\b/g, 'end-$1'],
  [/\btext-left\b/g, 'text-start'],
  [/\btext-right\b/g, 'text-end'],
  [/\bborder-l-([a-z0-9\-\[\]\.]+)\b/g, 'border-s-$1'],
  [/\bborder-r-([a-z0-9\-\[\]\.]+)\b/g, 'border-e-$1'],
  [/\bborder-l\b/g, 'border-s'],
  [/\bborder-r\b/g, 'border-e'],
  [/\brounded-l-([a-z0-9\-\[\]\.]+)\b/g, 'rounded-s-$1'],
  [/\brounded-r-([a-z0-9\-\[\]\.]+)\b/g, 'rounded-e-$1'],
  [/\brounded-tl-([a-z0-9\-\[\]\.]+)\b/g, 'rounded-ss-$1'],
  [/\brounded-tr-([a-z0-9\-\[\]\.]+)\b/g, 'rounded-se-$1'],
  [/\brounded-bl-([a-z0-9\-\[\]\.]+)\b/g, 'rounded-es-$1'],
  [/\brounded-br-([a-z0-9\-\[\]\.]+)\b/g, 'rounded-ee-$1'],
  [/\bright-0\b/g, 'end-0'],
  [/\bleft-0\b/g, 'start-0'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      replacements.forEach(([regex, replacement]) => {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Conversion to logical properties complete.');
