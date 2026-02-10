import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');

const jsonPath = path.join('public', 'inscricoes.json');
const htmlPath = path.join('public', 'graficos.html');

console.log('Reading files...');
const jsonData = fs.readFileSync(jsonPath, 'utf8');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1. Inject JSON variable
console.log('Injecting JSON data...');
const jsonInjection = `
        let rawData = [];
        const embeddedData = ${jsonData}; 
`;
// Replace the declaration
htmlContent = htmlContent.replace('let rawData = [];', jsonInjection);

// 2. Replace initDashboard function
console.log('Replacing initDashboard logic...');
const newInitFunction = `
        // Init Dashboard with Embedded Data
        function initDashboard() {
            try {
                const json = embeddedData;
                
                // Set metadata
                if (json.meta && json.meta.generatedAt) {
                   const dateStr = new Date(json.meta.generatedAt).toLocaleDateString('pt-BR');
                   const el = document.getElementById('last-update');
                   if(el) el.textContent = 'Atualizado em: ' + dateStr;
                }
                
                // Store raw data
                rawData = json.records || []; 
                
                // Animate Entry
                const loader = document.getElementById('loading-screen');
                if(loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 500);
                }

                // Initial Render
                populateFilters(rawData);
                updateDashboard(rawData);

            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
`;

// We will locate the function by clear text markers
// Note: using direct string replacement is safer than regex for code blocks if we have clear markers
const startMarker = 'async function initDashboard() {';
const endMarker = '// Populate Filter Dropdowns';

const startIndex = htmlContent.indexOf(startMarker);
const endIndex = htmlContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find injection points in HTML file.');
    console.log('Start marker found:', startIndex !== -1);
    console.log('End marker found:', endIndex !== -1);
    process.exit(1);
}

const before = htmlContent.substring(0, startIndex);
const after = htmlContent.substring(endIndex);

const newHtml = before + newInitFunction + "\n        " + after;

fs.writeFileSync(htmlPath, newHtml, 'utf8');
console.log('Successfully embedded JSON into HTML');
