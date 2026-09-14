import DecisionsClient from "./DecisionsClient";
import sql from "mssql";

export const revalidate = 0;

const dbConfig = {
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER_NAME?.split(',')[0] || '',
  port: parseInt(process.env.SQL_SERVER_NAME?.split(',')[1] || '1433'),
  options: { encrypt: false, trustServerCertificate: true }
};

export default async function DecisionsPage() {
  let courses: string[] = [];
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT DISTINCT MaKhoa
      FROM dp_system.dbo.App_HocVien_V2
      WHERE MaKhoa IS NOT NULL AND MaKhoa != ''
      ORDER BY MaKhoa DESC
    `);
    courses = result.recordset.map((r: any) => r.MaKhoa);
  } catch (error) {
    console.error("Error fetching courses for decisions:", error);
  }

  return <DecisionsClient courses={courses} />;
}
