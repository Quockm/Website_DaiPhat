"use server";

import sql from 'mssql';
import { getDbConnection } from "@/lib/db";

export type DauMoi = {
  id: number;
  hoTen: string;
  soDienThoai: string | null;
  ghiChu: string | null;
  trangThai: number;
  ngayTao: string;
};

export async function getDauMois(): Promise<DauMoi[]> {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT Id, HoTen, SoDienThoai, GhiChu, TrangThai, NgayTao
      FROM App_DauMoi
      WHERE TrangThai = 1
      ORDER BY HoTen ASC
    `);
    
    return result.recordset.map(r => ({
      id: r.Id,
      hoTen: r.HoTen,
      soDienThoai: r.SoDienThoai,
      ghiChu: r.GhiChu,
      trangThai: r.TrangThai,
      ngayTao: r.NgayTao?.toISOString() || '',
    }));
  } catch (err: any) {
    console.error("Error fetching DauMois:", err);
    return [];
  }
}

export async function addDauMoi(hoTen: string, soDienThoai: string, ghiChu: string) {
  try {
    if (!hoTen) return { success: false, error: 'Họ tên là bắt buộc' };

    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('HoTen', sql.NVarChar, hoTen)
      .input('SoDienThoai', sql.VarChar, soDienThoai || null)
      .input('GhiChu', sql.NVarChar, ghiChu || null)
      .query(`
        INSERT INTO App_DauMoi (HoTen, SoDienThoai, GhiChu, TrangThai)
        VALUES (@HoTen, @SoDienThoai, @GhiChu, 1)
      `);
      
    return { success: true };
  } catch (err: any) {
    console.error("Error adding DauMoi:", err);
    return { success: false, error: err.message };
  }
}

export async function updateDauMoi(id: number, hoTen: string, soDienThoai: string, ghiChu: string) {
  try {
    if (!id || !hoTen) return { success: false, error: 'ID và Họ tên là bắt buộc' };

    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('Id', sql.Int, id)
      .input('HoTen', sql.NVarChar, hoTen)
      .input('SoDienThoai', sql.VarChar, soDienThoai || null)
      .input('GhiChu', sql.NVarChar, ghiChu || null)
      .query(`
        UPDATE App_DauMoi
        SET HoTen = @HoTen,
            SoDienThoai = @SoDienThoai,
            GhiChu = @GhiChu
        WHERE Id = @Id
      `);
      
    return { success: true };
  } catch (err: any) {
    console.error("Error updating DauMoi:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteDauMoi(id: number) {
  try {
    if (!id) return { success: false, error: 'ID là bắt buộc' };

    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // We do soft delete by updating TrangThai = 0
    await pool.request()
      .input('Id', sql.Int, id)
      .query(`
        UPDATE App_DauMoi
        SET TrangThai = 0
        WHERE Id = @Id
      `);
      
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting DauMoi:", err);
    return { success: false, error: err.message };
  }
}
