"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";
import { revalidatePath } from "next/cache";

export type InternalPayment = {
  Id: number;
  TieuDe: string;
  LoaiPhieu: string;
  SoTien: number;
  PhongBan: string;
  NguoiDeXuat: string;
  NguoiDuyet: string;
  TrangThaiDuyet: string;
  TrangThaiChi: string;
  NgayCanTien: string;
  GhiChu: string;
  FileDinhKem: string;
  NgayTao?: string;
};

export async function getInternalPayments(): Promise<InternalPayment[]> {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    const result = await pool.request().query(`
      SELECT Id, TieuDe, LoaiPhieu, SoTien, PhongBan, NguoiDeXuat, NguoiDuyet, 
             TrangThaiDuyet, TrangThaiChi, NgayCanTien, GhiChu, FileDinhKem, NgayTao
      FROM dp_system.dbo.App_ThanhToanNoiBo
      ORDER BY NgayTao DESC
    `);
    return result.recordset;
  } catch (err: any) {
    console.error("Error fetching internal payments:", err);
    return [];
  }
}

export async function saveInternalPayment(data: Partial<InternalPayment>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    
    if (data.Id) {
      await pool.request()
        .input("Id", sql.Int, data.Id)
        .input("TieuDe", sql.NVarChar, data.TieuDe || "")
        .input("LoaiPhieu", sql.NVarChar, data.LoaiPhieu || "Thanh toán")
        .input("SoTien", sql.Float, data.SoTien || 0)
        .input("PhongBan", sql.NVarChar, data.PhongBan || "")
        .input("NguoiDeXuat", sql.NVarChar, data.NguoiDeXuat || "")
        .input("NguoiDuyet", sql.NVarChar, data.NguoiDuyet || "")
        .input("TrangThaiDuyet", sql.NVarChar, data.TrangThaiDuyet || "Chờ duyệt")
        .input("TrangThaiChi", sql.NVarChar, data.TrangThaiChi || "Chưa chi")
        .input("NgayCanTien", sql.DateTime, data.NgayCanTien ? new Date(data.NgayCanTien) : null)
        .input("GhiChu", sql.NVarChar, data.GhiChu || "")
        .input("FileDinhKem", sql.NVarChar, data.FileDinhKem || "")
        .query(`
          UPDATE dp_system.dbo.App_ThanhToanNoiBo
          SET TieuDe = @TieuDe, LoaiPhieu = @LoaiPhieu, SoTien = @SoTien, PhongBan = @PhongBan,
              NguoiDeXuat = @NguoiDeXuat, NguoiDuyet = @NguoiDuyet, TrangThaiDuyet = @TrangThaiDuyet,
              TrangThaiChi = @TrangThaiChi, NgayCanTien = @NgayCanTien, GhiChu = @GhiChu, 
              FileDinhKem = @FileDinhKem, NgayCapNhat = GETDATE()
          WHERE Id = @Id
        `);
    } else {
      await pool.request()
        .input("TieuDe", sql.NVarChar, data.TieuDe || "")
        .input("LoaiPhieu", sql.NVarChar, data.LoaiPhieu || "Thanh toán")
        .input("SoTien", sql.Float, data.SoTien || 0)
        .input("PhongBan", sql.NVarChar, data.PhongBan || "")
        .input("NguoiDeXuat", sql.NVarChar, data.NguoiDeXuat || "")
        .input("NgayCanTien", sql.DateTime, data.NgayCanTien ? new Date(data.NgayCanTien) : null)
        .input("GhiChu", sql.NVarChar, data.GhiChu || "")
        .input("FileDinhKem", sql.NVarChar, data.FileDinhKem || "")
        .query(`
          INSERT INTO dp_system.dbo.App_ThanhToanNoiBo (
            TieuDe, LoaiPhieu, SoTien, PhongBan, NguoiDeXuat, NgayCanTien, GhiChu, FileDinhKem
          ) VALUES (
            @TieuDe, @LoaiPhieu, @SoTien, @PhongBan, @NguoiDeXuat, @NgayCanTien, @GhiChu, @FileDinhKem
          )
        `);
    }
    
    revalidatePath("/accounting/internal-payments");
    return { success: true };
  } catch (err: any) {
    console.error("Error saving internal payment:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteInternalPayment(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    await pool.request().input("Id", sql.Int, id).query(`DELETE FROM dp_system.dbo.App_ThanhToanNoiBo WHERE Id = @Id`);
    revalidatePath("/accounting/internal-payments");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting:", err);
    return { success: false, error: err.message };
  }
}
