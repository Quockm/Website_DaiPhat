const { getDbConnection } = require('./src/lib/db');

async function test() {
  const poolGplx = await getDbConnection('gplx_csdt');
  const courseId = '79106K26B0106'; // Example MaKH
  
  const courseRes = await poolGplx.request()
      .input('courseId', courseId)
      .query(`
        SELECT kh.TenKH, kh.MaKH, ISNULL(hd.TenHangDT, kh.HangGPLX) AS HangXe, FORMAT(kh.NgayKG, 'dd/MM/yyyy') AS KhaiGiang
        FROM KhoaHoc kh
        LEFT JOIN DM_HangDT hd ON kh.HangDT = hd.MaHangDT
        WHERE kh.MaKH = @courseId
      `);
      
  console.log("Result:", courseRes.recordset);
}

test().catch(console.error);
