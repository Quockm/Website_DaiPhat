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
  
  const gv = await poolDp.request().query("SELECT TOP 1 * FROM DanhSachGiaoVien");
  console.log("DanhSachGiaoVien:", Object.keys(gv.recordset[0] || {}));
  
  poolDp.close();
}
check().catch(console.error);
