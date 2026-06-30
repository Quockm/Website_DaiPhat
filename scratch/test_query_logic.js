require('dotenv').config();
const sql = require('mssql');

async function test() {
  const poolDp = await sql.connect({
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER_NAME.split(',')[0],
    port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
    database: 'dp_system',
    options: { encrypt: false, trustServerCertificate: true }
  });

  const courseId = '79106K26B0106'; // Try one
  console.log('Testing courseId:', courseId);

  const teachersRes = await poolDp.request()
    .input('courseId', '%' + courseId + '%')
    .query(`
      SELECT HoTen, HangGPLX, Khoa 
      FROM App_GiaoVien 
      WHERE Khoa LIKE @courseId
    `);

  console.log("SQL LIKE results:", teachersRes.recordset.length);
  
  const teachers = teachersRes.recordset
    .filter(t => t.Khoa && t.Khoa.split(',').map(k => k.trim()).includes(courseId))
    .map(t => ({ name: t.HoTen, type: t.HangGPLX || 'N/A' }));

  console.log("Filtered results:", teachers.length);
  console.log(teachers);

  poolDp.close();
}
test().catch(console.error);
