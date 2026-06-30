const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');
const sheet = wb.Sheets['B TỰ ĐỘNG '];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
for (let i = 4; i < 9; i++) {
  console.log(`Row ${i}:`, data[i]);
}
