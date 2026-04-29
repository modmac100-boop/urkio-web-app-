const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /text-\[\#1b1c1a\]/g, to: 'text-msgr-on-surface' },
  { from: /bg-\[\#004e99\]/g, to: 'bg-msgr-primary' },
  { from: /text-\[\#004e99\]/g, to: 'text-msgr-primary' },
  { from: /border-\[\#004e99\]/g, to: 'border-msgr-primary' },
  { from: /shadow-\[\#004e99\]/g, to: 'shadow-msgr-primary' },
  { from: /from-\[\#004e99\]/g, to: 'from-msgr-primary' },
  { from: /ring-\[\#004e99\]/g, to: 'ring-msgr-primary' },
  
  { from: /text-\[\#c1c6d4\]/g, to: 'text-msgr-outline-variant' },
  { from: /text-\[\#414752\]/g, to: 'text-msgr-on-surface-variant' },
  { from: /placeholder-\[\#414752\]/g, to: 'placeholder-msgr-on-surface-variant' },
  { from: /placeholder:text-\[\#414752\]/g, to: 'placeholder:text-msgr-on-surface-variant' },

  { from: /bg-gradient-to-t\b/g, to: 'bg-linear-to-t' },
  { from: /bg-gradient-to-tr\b/g, to: 'bg-linear-to-tr' },
  { from: /bg-gradient-to-br\b/g, to: 'bg-linear-to-br' },
  { from: /bg-gradient-to-r\b/g, to: 'bg-linear-to-r' },
  { from: /bg-gradient-to-b\b/g, to: 'bg-linear-to-b' },

  { from: /rounded-\[2rem\]/g, to: 'rounded-4xl' },
  { from: /rounded-\[1\.5rem\]/g, to: 'rounded-3xl' },
  { from: /z-\[1001\]/g, to: 'z-1001' },
  { from: /z-\[100\]/g, to: 'z-100' },
  { from: /z-\[200\]/g, to: 'z-200' },
  { from: /z-\[60\]/g, to: 'z-60' },
  { from: /aspect-\[21\/9\]/g, to: 'aspect-21/9' },
  { from: /aspect-\[16\/6\]/g, to: 'aspect-16/6' },

  { from: /bg-\[\#050A0F\]/g, to: 'bg-ur-on-surface' },
  { from: /text-\[\#050A0F\]/g, to: 'text-ur-on-surface' },
  { from: /from-\[\#050A0F\]/g, to: 'from-ur-on-surface' },
  { from: /to-\[\#050A0F\]/g, to: 'to-ur-on-surface' },

  { from: /text-\[\#30B0D0\]/g, to: 'text-ur-primary' },
  { from: /bg-\[\#30B0D0\]/g, to: 'bg-ur-primary' },
  { from: /border-\[\#30B0D0\]/g, to: 'border-ur-primary' },
  { from: /border-t-\[\#30B0D0\]/g, to: 'border-t-ur-primary' },
  { from: /shadow-\[\#30B0D0\]/g, to: 'shadow-ur-primary' },
  { from: /from-\[\#30B0D0\]/g, to: 'from-ur-primary' },

  { from: /bg-\[size:40px_40px\]/g, to: 'bg-size-[40px_40px]' },
  { from: /text-\[\#EDE8E4\]/g, to: 'text-ur-background' },
  { from: /bg-\[\#EDE8E4\]/g, to: 'bg-ur-background' },
  
  { from: /p-\[1px\]/g, to: 'p-px' },
  { from: /h-\[1px\]/g, to: 'h-px' },
  { from: /flex-\[3\]/g, to: 'flex-3' },
  { from: /flex-\[1\]/g, to: 'flex-1' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const r of replacements) {
        if (content.match(r.from)) {
          content = content.replace(r.from, r.to);
          changed = true;
        }
      }
      // Special case for 'h-full' and 'h-screen' in ClinicalWorkstation.tsx
      if (fullPath.includes('ClinicalWorkstation.tsx')) {
        // the user error mentioned 'h-full' vs 'h-screen' applying same property
        // The error line 244 in ClinicalWorkstation.tsx has both: `h-full h-screen` maybe?
        if (content.includes('h-full h-screen')) {
           content = content.replace('h-full h-screen', 'h-screen');
           changed = true;
        } else if (content.includes('h-screen h-full')) {
           content = content.replace('h-screen h-full', 'h-screen');
           changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, '../src'));
