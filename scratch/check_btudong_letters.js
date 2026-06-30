const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');
const sheet = wb.Sheets['B TỰ ĐỘNG '];
const data = xlsx.utils.sheet_to_json(sheet, {header: 'A'}); // Returns object with keys A, B, C, D...
for (let i = 4; i < 9; i++) {
  console.log(`Row ${i}:`, data[i]);
}
