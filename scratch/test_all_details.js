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
  
  const courseId = '79106K26B0106';
  console.log("Querying gplx...");
  const courseRes = await poolGplx.request()
      .input('courseId', courseId)
      .query(`
        SELECT kh.TenKH, kh.MaKH, LTRIM(RTRIM(kh.MaKH)) AS MaKhoa, ISNULL(hd.TenHangDT, kh.HangGPLX) AS HangXe, FORMAT(kh.NgayKG, 'dd/MM/yyyy') AS KhaiGiang
        FROM KhoaHoc kh
        LEFT JOIN DM_HangDT hd ON kh.HangDT = hd.MaHangDT
        WHERE LTRIM(RTRIM(kh.MaKH)) = @courseId OR kh.MaKH = @courseId
      `);
  console.log("Course Result:", courseRes.recordset);
  
  const poolDp = await sql.connect({
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER_NAME.split(',')[0],
    port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
    database: 'dp_system',
    options: { encrypt: false, trustServerCertificate: true }
  });

  console.log("Querying teachers...");
  const teachersRes = await poolDp.request()
      .input('courseId', '%' + courseId + '%')
      .query(`
        SELECT HoTen, HangGPLX, Khoa 
        FROM App_GiaoVien 
        WHERE Khoa LIKE @courseId
      `);
  console.log("Teachers result length:", teachersRes.recordset.length);
  
  console.log("Querying cars...");
  const carsRes = await poolDp.request()
      .input('courseId', '%' + courseId + '%')
      .query(`
        SELECT BienSo, HangXe, DangDiKhoa 
        FROM App_PhuongTien 
        WHERE DangDiKhoa LIKE @courseId
      `);
  console.log("Cars result length:", carsRes.recordset.length);
  
  console.log("Querying students...");
  const studentsRes = await poolDp.request()
      .input('courseId', courseId)
      .query(`
        SELECT HoVaTen, NgaySinh, MaDK, HangDaoTao 
        FROM App_HocVien_V2 
        WHERE MaKhoa = @courseId
        ORDER BY HoVaTen
      `);
  console.log("Students result length:", studentsRes.recordset.length);
  
  poolDp.close();
  poolGplx.close();
}
test().catch(console.error);
