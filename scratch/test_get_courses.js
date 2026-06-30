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

  const result = await poolGplx.request().query(`
      SELECT 
        kh.MaKH, 
        LTRIM(RTRIM(kh.MaKH)) AS MaKhoa, 
        kh.TenKH AS TenKhoa
      FROM KhoaHoc kh 
      LEFT JOIN DM_HangDT hd ON kh.HangDT = hd.MaHangDT 
      ORDER BY hd.TenHangDT, kh.NgayKG
  `);

  console.log("First 3 records:", result.recordset.slice(0, 3));
  poolGplx.close();
}
test().catch(console.error);
