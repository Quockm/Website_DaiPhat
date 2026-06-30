const xlsx = require('xlsx'); 
const wb = xlsx.readFile('khoa_oto.xlsx'); 
['KẾ HOẠCH', 'THEO DÕI XE', 'THEO DÕI GV'].forEach(sn => { 
  const sheet = wb.Sheets[sn]; 
  if(sheet) { 
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1}); 
    console.log('\n--- Sheet: ' + sn + ' ---'); 
    for(let i=0; i<8; i++) { 
      if(data[i]) console.log('Row ' + i + ':', data[i]); 
    } 
  } 
});
