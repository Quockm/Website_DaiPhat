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

  try { await poolDp.query("ALTER TABLE App_HocVien_V2 ADD SDT VARCHAR(20);"); } catch(e) { console.log(e.message); }

  console.log("Done.");
  poolDp.close();
}
run().catch(console.error);
