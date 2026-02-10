import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const workbook = XLSX.readFile('Inscrições Studio Tenaz (2).xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Timestamp Values Check:');
data.slice(0, 5).forEach((row, index) => {
    console.log(`Row ${index}: Timestamp = "${row['Timestamp']}", Type: ${typeof row['Timestamp']}`);
});
