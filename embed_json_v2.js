import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');

const jsonFilePath = 'public/inscricoes.json';

// Read the JSON file
if (!fs.existsSync(jsonFilePath)) {
    console.error('JSON file not found:', jsonFilePath);
    process.exit(1);
}
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

// Sanitize Data for Public Dashboard
// We remove PII (Name, Email, Phone, CPF, Address) and keep only aggregated/categorical data
const sensitiveFields = ['name', 'email', 'telefone', 'cpf', 'endereco', 'numero', 'complemento', 'mensagem', 'instagram', 'tiktok', 'facebook', 'youtube', 'spotify'];
const sanitizedRecords = jsonData.records.map(record => {
    const newRecord = { ...record };
    sensitiveFields.forEach(field => delete newRecord[field]);
    return newRecord;
});

const sanitizedData = {
    meta: jsonData.meta,
    stats: jsonData.stats,
    records: sanitizedRecords
};

const embeddedDataString = `const embeddedData = ${JSON.stringify(sanitizedData, null, 2)};\n`;

const targets = [
    {
        file: 'public/graficos.html',
        startMarker: 'const embeddedData = {',
        endMarker: 'let chartInstances = {};',
        type: 'data_only'
    },
    {
        file: 'public/inscritos.html',
        type: 'regex_replace',
        // Match async function initDashboard() { ... }
        // We match until the closing brace. 
        // NOTE: This basic regex assumes the function body doesn't have nested braces that confuse it, 
        // or we just match lazily. 
        // Given the placeholder is simple, we can match explicitly or just use the start marker and assume an end.
        regex: /async\s+function\s+initDashboard\s*\(\)\s*\{[\s\S]*?\}/,
        injection: `
        // Init Dashboard with Embedded Data
        ${embeddedDataString}
        
        function initDashboard() {
            console.log('Data Injected!');
            try {
                const json = embeddedData;
                startApp(json.records || []);
            } catch(e) { console.error(e); }
        }
        // Auto-run when DOM is ready (to ensure 'let' vars are initialized)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initDashboard);
        } else {
            initDashboard();
        }
        `
    }
];

targets.forEach(target => {
    try {
        console.log(`Processing ${target.file}...`);
        if (!fs.existsSync(target.file)) {
            console.error(`File not found: ${target.file}`);
            return;
        }

        let content = fs.readFileSync(target.file, 'utf-8');

        if (target.type === 'data_only') {
            const startIdx = content.indexOf(target.startMarker);
            const endIdx = content.indexOf(target.endMarker);

            if (startIdx !== -1 && endIdx !== -1) {
                const before = content.substring(0, startIdx);
                const after = content.substring(endIdx);
                const newContent = `${embeddedDataString}\n    `;
                content = before + newContent + after;
                fs.writeFileSync(target.file, content, 'utf-8');
                console.log(`Updated data in ${target.file}`);
            } else {
                console.error(`Markers not found in ${target.file}`);
            }

        } else if (target.type === 'regex_replace') {
            if (target.regex.test(content)) {
                content = content.replace(target.regex, target.injection);
                fs.writeFileSync(target.file, content, 'utf-8');
                console.log(`Injected logic into ${target.file}`);
            } else {
                console.error(`Regex not matched in ${target.file}`);
                // Fallback: Check if already injected?
                if (content.includes('const embeddedData =')) {
                    console.log('Looks like data is already there.');
                }
            }
        }

    } catch (e) {
        console.error(`Error processing ${target.file}:`, e);
    }
});
