import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');

const jsonPath = path.join('public', 'inscricoes.json');
const htmlPath = path.join('public', 'graficos.html');

console.log('Reading files...');
const jsonData = fs.readFileSync(jsonPath, 'utf8');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Target the embeddedData block
const startMarker = 'const embeddedData = {';
const endMarker = 'let chartInstances = {};';

const startIndex = htmlContent.indexOf(startMarker);
const endIndex = htmlContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found!');
    console.log('Start:', startIndex, 'End:', endIndex);
    process.exit(1);
}

// Find the end of the embeddedData assignment before 'let chartInstances'
// It should look like: ... }; \n\n    let chartInstances ...
// We can just replace from startMarker up to endIndex (minus whitespace/semicolon)
// But safer to replace explicit block.

const newContent = `const embeddedData = ${jsonData};\n\n    `;

const before = htmlContent.substring(0, startIndex);
const after = htmlContent.substring(endIndex);

const finalHtml = before + newContent + after;

fs.writeFileSync(htmlPath, finalHtml, 'utf8');
console.log('Successfully injected updated JSON data!');
