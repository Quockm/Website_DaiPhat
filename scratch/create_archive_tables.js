const mssql = require('mssql');
require('dotenv').config({ path: '.env' });

const config = {
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER_NAME.split(',')[0],
  port: parseInt(process.env.SQL_SERVER_NAME.split(',')[1]),
  database: 'dp_system',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

async function createTables() {
  try {
    await mssql.connect(config);
    
    // Create App_GiaoVien_HoSo
    await mssql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='App_GiaoVien_HoSo' AND xtype='U')
      CREATE TABLE App_GiaoVien_HoSo (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        GiaoVienId INT NOT NULL,
        LoaiHoSo NVARCHAR(200) NOT NULL,
        FileUrl NVARCHAR(MAX) NOT NULL,
        UploadedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_GiaoVien_HoSo FOREIGN KEY (GiaoVienId) REFERENCES App_GiaoVien(Id)
      )
    `);
    console.log("Created App_GiaoVien_HoSo");

    // Create App_PhuongTien_HoSo
    await mssql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='App_PhuongTien_HoSo' AND xtype='U')
      CREATE TABLE App_PhuongTien_HoSo (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PhuongTienId INT NOT NULL,
        LoaiHoSo NVARCHAR(200) NOT NULL,
        FileUrl NVARCHAR(MAX) NOT NULL,
        UploadedAt DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PhuongTien_HoSo FOREIGN KEY (PhuongTienId) REFERENCES App_PhuongTien(Id)
      )
    `);
    console.log("Created App_PhuongTien_HoSo");

  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    process.exit();
  }
}

createTables();
