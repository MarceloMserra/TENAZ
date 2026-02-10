import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputFile = 'Inscrições Studio Tenaz (2).xlsx'; // Ensure this filename is correct
const outputFile = path.join('public', 'inscricoes.json');

// --- Normalization Logic ---
const normalizeString = (str) => {
    if (!str) return '';
    return str.toString().trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
};

const canonicalBairros = {
    'CEILANDIA': 'Ceilândia',
    'PSEUL': 'Ceilândia',
    'P SUL': 'Ceilândia',
    'P.SUL': 'Ceilândia',
    'P. SUL': 'Ceilândia',
    'SETOR O': 'Ceilândia',
    'SETOR P SUL': 'Ceilândia',
    'QNP': 'Ceilândia',
    'QNN': 'Ceilândia',
    'QNM': 'Ceilândia',
    'QNO': 'Ceilândia',
    'SOL NASCENTE': 'Sol Nascente',
    'SAMAMBAIA': 'Samambaia',
    'SAMAMBAIA NORTE': 'Samambaia',
    'SAMAMBAIA SUL': 'Samambaia',
    'TAGUATINGA': 'Taguatinga',
    'TAGUATINGA NORTE': 'Taguatinga',
    'TAGUATINGA SUL': 'Taguatinga',
    'SANTA MARIA': 'Santa Maria',
    'SAO SEBASTIAO': 'São Sebastião',
    'RECANTO DAS EMAS': 'Recanto das Emas',
    'PLANALTINA': 'Planaltina',
    'PLANALTINA DF': 'Planaltina',
    'AGUAS CLARAS': 'Águas Claras',
    'RIACHO FUNDO': 'Riacho Fundo',
    'RIACHO FUNDO 1': 'Riacho Fundo',
    'RIACHO FUNDO 2': 'Riacho Fundo',
    'RIACHO FUNDO II': 'Riacho Fundo',
    'GAMA': 'Gama',
    'GUARA': 'Guará',
    'GUARA 1': 'Guará',
    'GUARA 2': 'Guará',
    'GUARÁ': 'Guará',
    'SOBRADINHO': 'Sobradinho',
    'SOBRADINHO 2': 'Sobradinho',
    'SOBRADINHO II': 'Sobradinho',
    'PARANOA': 'Paranoá',
    'PARANOÁ': 'Paranoá',
    'PARANOA PARQUE': 'Paranoá',
    'ITAPOA': 'Itapoã',
    'VARJAO': 'Varjão',
    'LAGO NORTE': 'Lago Norte',
    'LAGO SUL': 'Lago Sul',
    'NUCLEO BANDEIRANTE': 'Núcleo Bandeirante',
    'CANDANGOLANDIA': 'Candangolândia',
    'ESTRUTURAL': 'Estrutural',
    'VILA ESTRUTURAL': 'Estrutural',
    'VARJAO': 'Varjão',
    // Cities around DF - Keep as City Name if Bairro matches City
    'VALPARAISO': 'Valparaíso',
    'VALPARAISO DE GOIAS': 'Valparaíso',
    'LUZIANIA': 'Luziânia',
    'AGUAS LINDAS': 'Águas Lindas',
    'AGUAS LINDAS DE GOIAS': 'Águas Lindas',
    'CIDADE OCIDENTAL': 'Cidade Ocidental',
    'NOVO GAMA': 'Novo Gama',
    'JARDIM INGA': 'Jardim Ingá',
    'PEDREGAL': 'Pedregal'
};

const processBairro = (raw) => {
    if (!raw) return 'Não Informado';
    const normalized = normalizeString(raw);

    // 1. Direct Canonical Match (Exact or Contains)
    for (const [key, val] of Object.entries(canonicalBairros)) {
        if (normalized.includes(key)) {
            return val;
        }
    }

    // 2. Fallback: Title Case for unknown bairros
    return raw.toString().trim().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

const processArea = (raw) => {
    if (!raw) return 'Outro';
    // Normalize to: Musica, Audiovisual, Comunidade, Podcast, Outro
    const norm = normalizeString(raw);
    if (norm.includes('MUSICA')) return 'Música';
    if (norm.includes('AUDIO')) return 'Audiovisual';
    if (norm.includes('COMUNIDADE') || norm.includes('PRODUCAO')) return 'Comunidade';
    if (norm.includes('PODCAST')) return 'Podcast';
    if (norm.includes('ESTUDANTE')) return 'Estudante';
    return 'Outro';
}

// --- Main Execution ---

try {
    console.log(`Reading file: ${inputFile}`);

    // Check if file exists
    if (!fs.existsSync(inputFile)) {
        // fallback for testing if user renamed file, though user provided 'Inscrições Studio Tenaz (2).xlsx'
        console.error('File not found!');
        process.exit(1);
    }

    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with Date parsing
    const rawData = XLSX.utils.sheet_to_json(sheet, { cellDates: true });
    console.log(`Found ${rawData.length} records.`);

    // Helper: Convert Excel Serial Date -> JS Date
    const excelDateToJSDate = (serial) => {
        // Excel base date: Dec 30, 1899
        // Days > 25569 correspond to dates after 1970-01-01
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        // Handle fractional day (time)
        const fractional_day = serial - Math.floor(serial) + 0.0000001;
        const total_seconds = Math.floor(86400 * fractional_day);
        const seconds = total_seconds % 60;
        const total_minutes = Math.floor(total_seconds / 60);
        const minutes = total_minutes % 60;
        const hours = Math.floor(total_minutes / 60);

        return new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate(), hours, minutes, seconds));
    }

    // Process Data
    const processedData = rawData.map((record, index) => {
        // Parse Timestamp
        let dateObj = new Date();
        const val = record.Timestamp;

        if (val) {
            if (val instanceof Date) {
                dateObj = val;
            } else if (typeof val === 'number') {
                if (index === 0) console.log('First record numerical timestamp:', val);
                // Heuristic: Excel serials for recent years are > 40000
                if (val < 100000) {
                    dateObj = excelDateToJSDate(val);
                } else {
                    dateObj = new Date(val); // Assume ms if huge
                }
            } else {
                // String fallback
                const parsed = new Date(val);
                if (!isNaN(parsed)) dateObj = parsed;
            }
        }

        return {
            ...record,
            data: dateObj.toISOString(),
            bairro: processBairro(record.bairro),
            cidade: record.cidade || 'Não informado',
            area: processArea(record.area_de_atuacao),
            interesse: record.interesse_no_studio || 'Outro',
            origem: record.como_conheceu || 'Outro',
            date_formatted: dateObj.toLocaleDateString('pt-BR')
        };
    });

    // Aggregations (for debugging or simple stats usage)
    const stats = {
        total: processedData.length,
        areas: {},
        bairros: {},
        interesses: {},
        origens: {},
        timeline: {}
    };

    processedData.forEach(item => {
        stats.areas[item.area] = (stats.areas[item.area] || 0) + 1;
        stats.bairros[item.bairro] = (stats.bairros[item.bairro] || 0) + 1;
        stats.interesses[item.interesse] = (stats.interesses[item.interesse] || 0) + 1;
        stats.origens[item.origem] = (stats.origens[item.origem] || 0) + 1;
        const dayKey = item.data.split('T')[0];
        stats.timeline[dayKey] = (stats.timeline[dayKey] || 0) + 1;
    });

    // Output structure
    const output = {
        meta: {
            generatedAt: new Date().toISOString(),
            sourceFile: inputFile
        },
        stats: stats,
        records: processedData
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`Successfully wrote data to ${outputFile}`);

} catch (error) {
    console.error('Error processing Excel:', error);
    process.exit(1);
}
