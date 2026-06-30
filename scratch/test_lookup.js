require('dotenv').config();
const sql = require('mssql');

async function test() {
  const poolGplx = await sql.connect({
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER_NAME.split(',')[0],
    port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
    database: 'gplx_csdt',
    options: { encrypt: false, trustServerCertificate: true }
  });

  const courseId = '79106K26B0106'; // Example MaKH without trailing spaces

  const courseRes = await poolGplx.request()
    .input('courseId', courseId)
    .query(`
      SELECT kh.TenKH, kh.MaKH, LTRIM(RTRIM(kh.MaKH)) AS MaKhoa
      FROM KhoaHoc kh
      WHERE kh.MaKH = @courseId
    `);

  console.log("Direct match results:", courseRes.recordset);
  
  const courseResTrimmed = await poolGplx.request()
    .input('courseId', courseId)
    .query(`
      SELECT kh.TenKH, kh.MaKH, LTRIM(RTRIM(kh.MaKH)) AS MaKhoa
      FROM KhoaHoc kh
      WHERE LTRIM(RTRIM(kh.MaKH)) = @courseId
    `);
    
  console.log("Trimmed match results:", courseResTrimmed.recordset);

  poolGplx.close();
}
test().catch(console.error);
