const sql = require('mssql');
require('dotenv').config({path: '.env'});

async function run() {
  let poolDp = await sql.connect({
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER_NAME.split(',')[0],
    port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
    database: 'dp_system',
    options: { encrypt: false, trustServerCertificate: true }
  });

  console.log("Adding columns...");
  try { await poolDp.query("ALTER TABLE App_HocVien_V2 ADD DauMoi NVARCHAR(100);"); } catch(e) { console.log(e.message); }
  try { await poolDp.query("ALTER TABLE App_GiaoVien ADD HanGPLX VARCHAR(20);"); } catch(e) { console.log(e.message); }
  try { await poolDp.query("ALTER TABLE App_PhuongTien ADD HanDangKiem VARCHAR(20);"); } catch(e) { console.log(e.message); }

  console.log("Done.");
  poolDp.close();
}
run().catch(console.error);
