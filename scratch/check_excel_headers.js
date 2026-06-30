const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');
const sheet = wb.Sheets['B SỐ SÀN'];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
for (let i = 0; i < 5; i++) {
  console.log(`Row ${i}:`, data[i]);
}
