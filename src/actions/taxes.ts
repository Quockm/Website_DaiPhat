"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";
import { revalidatePath } from "next/cache";

export type TaxRecord = {
  Id: number;
  TenHoSo: string;
  LoaiHoSo: string;
  NamTaiChinh: number;
  FileUrl: string;
  NguoiTao: string;
  GhiChu: string;
  NgayTao?: string;
  NgayCapNhat?: string;
  HanNopThue?: string;
};

export async function getTaxRecords(): Promise<TaxRecord[]> {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    const result = await pool.request().query(`
      SELECT Id, TenHoSo, LoaiHoSo, NamTaiChinh, FileUrl, NguoiTao, GhiChu, NgayTao, NgayCapNhat, HanNopThue
      FROM dp_system.dbo.App_HoSoThue
      ORDER BY NamTaiChinh DESC, NgayCapNhat DESC
    `);
    
    return result.recordset;
  } catch (err: any) {
    console.error("Error fetching tax records:", err);
    return [];
  }
}

export async function saveTaxRecord(data: Partial<TaxRecord>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    
    if (data.Id) {
      await pool.request()
        .input("Id", sql.Int, data.Id)
        .input("TenHoSo", sql.NVarChar, data.TenHoSo || "")
        .input("LoaiHoSo", sql.NVarChar, data.LoaiHoSo || "")
        .input("NamTaiChinh", sql.Int, data.NamTaiChinh || new Date().getFullYear())
        .input("FileUrl", sql.NVarChar, data.FileUrl || "")
        .input("NguoiTao", sql.NVarChar, data.NguoiTao || "")
        .input("GhiChu", sql.NVarChar, data.GhiChu || "")
        .input("HanNopThue", sql.DateTime, data.HanNopThue ? new Date(data.HanNopThue) : null)
        .query(`
          UPDATE dp_system.dbo.App_HoSoThue
          SET TenHoSo = @TenHoSo,
              LoaiHoSo = @LoaiHoSo,
              NamTaiChinh = @NamTaiChinh,
              FileUrl = @FileUrl,
              NguoiTao = @NguoiTao,
              GhiChu = @GhiChu,
              HanNopThue = @HanNopThue,
              NgayCapNhat = GETDATE()
          WHERE Id = @Id
        `);
    } else {
      await pool.request()
        .input("TenHoSo", sql.NVarChar, data.TenHoSo || "")
        .input("LoaiHoSo", sql.NVarChar, data.LoaiHoSo || "")
        .input("NamTaiChinh", sql.Int, data.NamTaiChinh || new Date().getFullYear())
        .input("FileUrl", sql.NVarChar, data.FileUrl || "")
        .input("NguoiTao", sql.NVarChar, data.NguoiTao || "")
        .input("GhiChu", sql.NVarChar, data.GhiChu || "")
        .input("HanNopThue", sql.DateTime, data.HanNopThue ? new Date(data.HanNopThue) : null)
        .query(`
          INSERT INTO dp_system.dbo.App_HoSoThue (
            TenHoSo, LoaiHoSo, NamTaiChinh, FileUrl, NguoiTao, GhiChu, HanNopThue, NgayTao, NgayCapNhat
          ) VALUES (
            @TenHoSo, @LoaiHoSo, @NamTaiChinh, @FileUrl, @NguoiTao, @GhiChu, @HanNopThue, GETDATE(), GETDATE()
          )
        `);
    }
    
    revalidatePath("/accounting/taxes");
    return { success: true };
  } catch (err: any) {
    console.error("Error saving tax record:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteTaxRecord(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM dp_system.dbo.App_HoSoThue WHERE Id = @Id`);
      
    revalidatePath("/accounting/taxes");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting tax record:", err);
    return { success: false, error: err.message };
  }
}
