const sql = require('mssql');

async function test() {
  const pool = await sql.connect({
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER_NAME.split(',')[0],
    port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
    database: 'gplx_csdt',
    options: { encrypt: false, trustServerCertificate: true }
  });
  
  const courseId = '79106K26B0106';
  const courseRes = await pool.request()
      .input('courseId', courseId)
      .query(`
        SELECT kh.TenKH, kh.MaKH, LTRIM(RTRIM(kh.MaKH)) AS MaKhoa, ISNULL(hd.TenHangDT, kh.HangGPLX) AS HangXe, FORMAT(kh.NgayKG, 'dd/MM/yyyy') AS KhaiGiang
        FROM KhoaHoc kh
        LEFT JOIN DM_HangDT hd ON kh.HangDT = hd.MaHangDT
        WHERE LTRIM(RTRIM(kh.MaKH)) = @courseId OR kh.MaKH = @courseId
      `);
  console.log("Result:", courseRes.recordset);
  
  // also try without OR
  const courseRes2 = await pool.request()
      .input('courseId', courseId)
      .query(`
        SELECT kh.TenKH, kh.MaKH, LTRIM(RTRIM(kh.MaKH)) AS MaKhoa
        FROM KhoaHoc kh
        WHERE kh.MaKH LIKE '%' + @courseId + '%'
      `);
  console.log("Result LIKE:", courseRes2.recordset);
  pool.close();
}
test().catch(console.error);
