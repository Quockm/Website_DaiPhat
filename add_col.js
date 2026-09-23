const sql = require('mssql');

async function run() {
  try {
    const config = {
      user: 'sa',
      password: '!Quoc21101997',
      server: '14.161.44.90',
      port: 51433,
      database: 'DP_SH_System',
      options: { encrypt: false, trustServerCertificate: true }
    };
    const pool = await sql.connect(config);
    
    // Add columns if not exist
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'is_health_check'
      )
      BEGIN
        ALTER TABLE students ADD is_health_check BIT DEFAULT 0;
      END

      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'is_profile_valid'
      )
      BEGIN
        ALTER TABLE students ADD is_profile_valid BIT DEFAULT 0;
      END
    `);
    console.log("Columns added or already exist.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
