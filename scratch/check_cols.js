const { getDbConnection } = require('./src/lib/db');

async function test() {
  const poolDp = await getDbConnection('dp_system');
  const res = await poolDp.request().query("SELECT TOP 1 * FROM App_HocVien_V2");
  console.log("Columns:", Object.keys(res.recordset[0] || {}));
  poolDp.close();
}
test().catch(console.error);
