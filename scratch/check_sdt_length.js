const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');

const sheetMappings = [
  { name: 'B SỐ SÀN', category: 'B2', nameCol: 'D', dobCol: 'E', sdtCol: 'F', dauMoiCol: 'G', startRow: 5 },
  { name: 'B TỰ ĐỘNG ', category: 'B1', nameCol: 'D', dobCol: 'E', sdtCol: 'G', dauMoiCol: 'H', startRow: 6 },
  { name: 'C1', category: 'C1', nameCol: 'D', dobCol: 'E', sdtCol: 'F', dauMoiCol: 'I', startRow: 7 }
];

let maxLength = 0;
let maxStr = '';

for(let m of sheetMappings) {
  const sheet = wb.Sheets[m.name];
  if (!sheet) continue;
  const data = xlsx.utils.sheet_to_json(sheet, {header: 'A'});
  
  for(let i = m.startRow; i < data.length; i++) {
    let r = data[i];
    if(!r) continue;
    let sdt = String(r[m.sdtCol] || '').trim();
    if (sdt.length > maxLength) {
      maxLength = sdt.length;
      maxStr = sdt;
    }
  }
}
console.log("Max SDT length:", maxLength, "Str:", maxStr);
