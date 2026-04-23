import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Just exploring what's inside the firebase config to fetch it directly
const firebaseCode = readFileSync('/Users/sameralhalaki/Desktop/urkio-web-test/src/firebase.ts', 'utf-8');
console.log(firebaseCode.substring(0, 500));
