const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');

const sheetMappings = [
  { name: 'B SỐ SÀN', category: 'B2' },
  { name: 'B TỰ ĐỘNG ', category: 'B1' },
  { name: 'C1', category: 'C1' }
];

for(let m of sheetMappings) {
  const sheet = wb.Sheets[m.name];
  if (!sheet) continue;
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
  console.log(`\n--- Sheet: ${m.name} ---`);
  for (let i = 4; i < 7; i++) {
    console.log(`Row ${i}:`, data[i]);
  }
}
