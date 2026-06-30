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
  const res = await poolDp.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
  console.log("Tables in dp_system:", res.recordset.map(r => r.TABLE_NAME));
  poolDp.close();
}
test().catch(console.error);
