const xlsx = require('xlsx');
const wb = xlsx.readFile('khoa_oto.xlsx');

const sheetMappings = [
  { name: 'B SỐ SÀN', category: 'B2', nameCol: 'D', dobCol: 'E', sdtCol: 'F', dauMoiCol: 'G', startRow: 5 },
  { name: 'B TỰ ĐỘNG ', category: 'B1', nameCol: 'D', dobCol: 'E', sdtCol: 'G', dauMoiCol: 'H', startRow: 6 },
  { name: 'C1', category: 'C1', nameCol: 'D', dobCol: 'E', sdtCol: 'F', dauMoiCol: 'I', startRow: 7 }
];

function formatDob(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + val * 86400000);
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  let s = String(val).trim();
  s = s.replace(/-/g, '/');
  return s;
}

for(let m of sheetMappings) {
  const sheet = wb.Sheets[m.name];
  if (!sheet) continue;
  const data = xlsx.utils.sheet_to_json(sheet, {header: 'A'});
  
  let currentCourse = '';
  let count = 0;
  
  for(let i = m.startRow; i < data.length; i++) {
    let r = data[i];
    if(!r) continue;
    
    // Check for course header
    let isCourseHeader = false;
    for (let key in r) {
      const val = String(r[key]||'').trim().toUpperCase();
      if (val.startsWith('KHÓA') || val.startsWith('KHOÁ') || val.match(/^K\s*\d+/) || val.includes('TIẾN THÀNH') || val.includes('TUYỂN SINH')) {
        currentCourse = String(r[key]).trim();
        isCourseHeader = true;
        break;
      }
    }
    
    if (!isCourseHeader && currentCourse) {
      let sname = String(r[m.nameCol] || '').trim().toUpperCase();
      let sdob = formatDob(r[m.dobCol]);
      let sdt = String(r[m.sdtCol] || '').trim();
      let dauMoi = String(r[m.dauMoiCol] || '').trim();
      
      if (sname) {
        if (count < 3) {
          console.log(`[${m.name}] Name: ${sname}, DOB: ${sdob}, SDT: ${sdt}, DauMoi: ${dauMoi}, Course: ${currentCourse}`);
          count++;
        }
      }
    }
  }
}
