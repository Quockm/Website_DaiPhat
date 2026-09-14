"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";
import { revalidatePath } from "next/cache";

export type FixedCost = {
  Id: number;
  TenChiPhi: string;
  SoTien: number;
  NgayChotHangThang: number;
  NhaCungCap: string;
  TrangThaiHoatDong: boolean;
  GhiChu: string;
  HopDongUrl?: string;
  ChuKy?: string;
};

export async function getFixedCosts(): Promise<FixedCost[]> {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    const result = await pool.request().query(`
      SELECT Id, TenChiPhi, SoTien, NgayChotHangThang, NhaCungCap, TrangThaiHoatDong, GhiChu, HopDongUrl, ChuKy
      FROM dp_system.dbo.App_ChiPhiCoDinh
      ORDER BY NgayChotHangThang ASC
    `);
    
    return result.recordset;
  } catch (err: any) {
    console.error("Error fetching fixed costs:", err);
    return [];
  }
}

export async function saveFixedCost(data: Partial<FixedCost>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    
    if (data.Id) {
      await pool.request()
        .input("Id", sql.Int, data.Id)
        .input("TenChiPhi", sql.NVarChar, data.TenChiPhi || "")
        .input("SoTien", sql.Float, data.SoTien || 0)
        .input("NgayChotHangThang", sql.Int, data.NgayChotHangThang || 1)
        .input("NhaCungCap", sql.NVarChar, data.NhaCungCap || "")
        .input("TrangThaiHoatDong", sql.Bit, data.TrangThaiHoatDong === false ? 0 : 1)
        .input("GhiChu", sql.NVarChar, data.GhiChu || "")
        .input("HopDongUrl", sql.NVarChar, data.HopDongUrl || "")
        .input("ChuKy", sql.NVarChar, data.ChuKy || "Hàng tháng")
        .query(`
          UPDATE dp_system.dbo.App_ChiPhiCoDinh
          SET TenChiPhi = @TenChiPhi,
              SoTien = @SoTien,
              NgayChotHangThang = @NgayChotHangThang,
              NhaCungCap = @NhaCungCap,
              TrangThaiHoatDong = @TrangThaiHoatDong,
              GhiChu = @GhiChu,
              HopDongUrl = @HopDongUrl,
              ChuKy = @ChuKy,
              NgayCapNhat = GETDATE()
          WHERE Id = @Id
        `);
    } else {
      await pool.request()
        .input("TenChiPhi", sql.NVarChar, data.TenChiPhi || "")
        .input("SoTien", sql.Float, data.SoTien || 0)
        .input("NgayChotHangThang", sql.Int, data.NgayChotHangThang || 1)
        .input("NhaCungCap", sql.NVarChar, data.NhaCungCap || "")
        .input("TrangThaiHoatDong", sql.Bit, data.TrangThaiHoatDong === false ? 0 : 1)
        .input("GhiChu", sql.NVarChar, data.GhiChu || "")
        .input("HopDongUrl", sql.NVarChar, data.HopDongUrl || "")
        .input("ChuKy", sql.NVarChar, data.ChuKy || "Hàng tháng")
        .query(`
          INSERT INTO dp_system.dbo.App_ChiPhiCoDinh (
            TenChiPhi, SoTien, NgayChotHangThang, NhaCungCap, TrangThaiHoatDong, GhiChu, HopDongUrl, ChuKy
          ) VALUES (
            @TenChiPhi, @SoTien, @NgayChotHangThang, @NhaCungCap, @TrangThaiHoatDong, @GhiChu, @HopDongUrl, @ChuKy
          )
        `);
    }
    
    revalidatePath("/accounting/fixed-costs");
    return { success: true };
  } catch (err: any) {
    console.error("Error saving fixed cost:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteFixedCost(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM dp_system.dbo.App_ChiPhiCoDinh WHERE Id = @Id`);
      
    revalidatePath("/accounting/fixed-costs");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting fixed cost:", err);
    return { success: false, error: err.message };
  }
}
