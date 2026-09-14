"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

export async function getCoursesForContracts() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT DISTINCT k.MaKhoa, a.Hang as HangXe, k.NgayHoc as KhaiGiang
      FROM App_DieuChinh_Khoa k
      JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
      WHERE k.MaKhoa IS NOT NULL AND k.MaKhoa != ''
      ORDER BY k.MaKhoa DESC
    `);
    
    return result.recordset;
  } catch (err) {
    console.error("Error fetching courses for contracts:", err);
    return [];
  }
}

export async function getStudentsByCourse(maKhoa: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT 
          MaDK, HoTen, NgaySinh, CCCD, SDT, '' as DiaChi, 
          TienThu as HocPhi, '' as HoSoDaThu, MaKhoa
        FROM App_HocVien_V2
        WHERE MaKhoa = @MaKhoa
        ORDER BY HoTen ASC
      `);
      
    return result.recordset;
  } catch (err) {
    console.error("Error fetching students by course:", err);
    return [];
  }
}
