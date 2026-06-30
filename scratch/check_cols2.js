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
  const res = await poolDp.request().query("SELECT TOP 1 * FROM App_HocVien_V2");
  console.log("Columns:", Object.keys(res.recordset[0] || {}));
  poolDp.close();
}
test().catch(console.error);
