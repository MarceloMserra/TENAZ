import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const filePath = 'Inscrições Studio Tenaz (2).xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers
    const headers = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ c: C, r: range.s.r });
        if (!sheet[address]) continue;
        headers.push(sheet[address].v);
    }

    console.log('Headers found:', JSON.stringify(headers, null, 2));

} catch (error) {
    console.error('Error reading file:', error);
}
