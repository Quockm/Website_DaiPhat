const sql = require('mssql');

async function check() {
  const poolDp = await sql.connect({
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER_NAME.split(',')[0],
    port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
    database: 'dp_system',
    options: { encrypt: false, trustServerCertificate: true }
  });
  
  const gv = await poolDp.request().query("SELECT TOP 1 * FROM App_GiaoVien");
  console.log("App_GiaoVien:", Object.keys(gv.recordset[0] || {}));
  
  const xe = await poolDp.request().query("SELECT TOP 1 * FROM App_PhuongTien");
  console.log("App_PhuongTien:", Object.keys(xe.recordset[0] || {}));

  const hv = await poolDp.request().query("SELECT TOP 1 * FROM DanhSachHocVien");
  console.log("DanhSachHocVien:", Object.keys(hv.recordset[0] || {}));

  poolDp.close();
}
check().catch(console.error);
