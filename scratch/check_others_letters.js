const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');

const sheet = wb.Sheets['C1'];
const data = xlsx.utils.sheet_to_json(sheet, {header: 'A'});
console.log('--- C1 ---');
for (let i = 5; i < 8; i++) {
  console.log(`Row ${i}:`, data[i]);
}

const sheet2 = wb.Sheets['B SỐ SÀN'];
const data2 = xlsx.utils.sheet_to_json(sheet2, {header: 'A'});
console.log('--- B SỐ SÀN ---');
for (let i = 4; i < 7; i++) {
  console.log(`Row ${i}:`, data2[i]);
}
