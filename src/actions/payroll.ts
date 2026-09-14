"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from "next/cache";

export type ChamCongData = {
  Id?: number;
  KyChamCong: string;
  NhanSuId: number;
  NgayCongChuan: number;
  ChiTietNgay: string; // JSON string
  TongDiLam: number;
  TongNuaNgay: number;
  TongNghiPhep: number;
  TongKhongLuong: number;
  TongTangCa: number;
  TongThaiSan: number;
};

export type BangLuongData = {
  Id?: number;
  KyLuong: string;
  NhanSuId: number;
  LuongCoBan: number;
  NgayCongThucTe: number;
  LuongThucTe: number;
  PhuCapAn: number;
  PhuCapDienThoai: number;
  PhuCapXangXe: number;
  PhuCapHQCV: number;
  TienTangCa: number;
  KhauTru_BHXH: number;
  KhauTru_BHYT: number;
  KhauTru_BHTN: number;
  ThueTNCN: number;
  SoNguoiPhuThuoc: number;
  GiamTruGiaCanh: number;
  ThuNhapChiuThue: number;
  ThucNhan: number;
  Cty_BHXH: number;
  Cty_BHYT: number;
  Cty_BHTN: number;
  Cty_KPCD: number;
  TrangThaiThanhToan: string;
};

export async function initDatabasePayroll() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dp_system.dbo.App_ChamCong]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[dp_system.dbo.App_ChamCong] (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          KyChamCong NVARCHAR(20) NOT NULL,
          NhanSuId INT NOT NULL,
          NgayCongChuan INT DEFAULT 26,
          ChiTietNgay NVARCHAR(MAX),
          TongDiLam FLOAT DEFAULT 0,
          TongNuaNgay FLOAT DEFAULT 0,
          TongNghiPhep FLOAT DEFAULT 0,
          TongKhongLuong FLOAT DEFAULT 0,
          TongTangCa FLOAT DEFAULT 0,
          TongThaiSan FLOAT DEFAULT 0,
          NgayTao DATETIME DEFAULT GETDATE(),
          NgayCapNhat DATETIME DEFAULT GETDATE(),
          CONSTRAINT UQ_ChamCong UNIQUE (KyChamCong, NhanSuId)
        );
      END
      
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dp_system.dbo.App_BangLuong]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[dp_system.dbo.App_BangLuong] (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          KyLuong NVARCHAR(20) NOT NULL,
          NhanSuId INT NOT NULL,
          LuongCoBan FLOAT DEFAULT 0,
          NgayCongThucTe FLOAT DEFAULT 0,
          LuongThucTe FLOAT DEFAULT 0,
          PhuCapAn FLOAT DEFAULT 0,
          PhuCapDienThoai FLOAT DEFAULT 0,
          PhuCapXangXe FLOAT DEFAULT 0,
          PhuCapHQCV FLOAT DEFAULT 0,
          TienTangCa FLOAT DEFAULT 0,
          KhauTru_BHXH FLOAT DEFAULT 0,
          KhauTru_BHYT FLOAT DEFAULT 0,
          KhauTru_BHTN FLOAT DEFAULT 0,
          ThueTNCN FLOAT DEFAULT 0,
          SoNguoiPhuThuoc INT DEFAULT 0,
          GiamTruGiaCanh FLOAT DEFAULT 0,
          ThuNhapChiuThue FLOAT DEFAULT 0,
          ThucNhan FLOAT DEFAULT 0,
          Cty_BHXH FLOAT DEFAULT 0,
          Cty_BHYT FLOAT DEFAULT 0,
          Cty_BHTN FLOAT DEFAULT 0,
          Cty_KPCD FLOAT DEFAULT 0,
          TrangThaiThanhToan NVARCHAR(50) DEFAULT N'Chưa thanh toán',
          NgayTao DATETIME DEFAULT GETDATE(),
          NgayCapNhat DATETIME DEFAULT GETDATE(),
          CONSTRAINT UQ_BangLuong UNIQUE (KyLuong, NhanSuId)
        );
      END
    `);
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function saveAttendance(kyChamCong: string, staffId: number, data: any) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const jsonStr = JSON.stringify(data.chiTietNgay || {});
    
    // Check if exists
    const check = await pool.request()
      .input('KyChamCong', sql.NVarChar, kyChamCong)
      .input('NhanSuId', sql.Int, staffId)
      .query(`SELECT Id FROM dp_system.dbo.App_ChamCong WHERE KyChamCong = @KyChamCong AND NhanSuId = @NhanSuId`);
      
    if (check.recordset.length > 0) {
      // Update
      await pool.request()
        .input('KyChamCong', sql.NVarChar, kyChamCong)
        .input('NhanSuId', sql.Int, staffId)
        .input('ChiTietNgay', sql.NVarChar, jsonStr)
        .input('TongDiLam', sql.Float, data.TongDiLam || 0)
        .input('TongNuaNgay', sql.Float, data.TongNuaNgay || 0)
        .input('TongNghiPhep', sql.Float, data.TongNghiPhep || 0)
        .input('TongKhongLuong', sql.Float, data.TongKhongLuong || 0)
        .input('TongTangCa', sql.Float, data.TongTangCa || 0)
        .input('TongThaiSan', sql.Float, data.TongThaiSan || 0)
        .query(`
          UPDATE dp_system.dbo.App_ChamCong SET
            ChiTietNgay = @ChiTietNgay,
            TongDiLam = @TongDiLam,
            TongNuaNgay = @TongNuaNgay,
            TongNghiPhep = @TongNghiPhep,
            TongKhongLuong = @TongKhongLuong,
            TongTangCa = @TongTangCa,
            TongThaiSan = @TongThaiSan,
            NgayCapNhat = GETDATE()
          WHERE KyChamCong = @KyChamCong AND NhanSuId = @NhanSuId
        `);
    } else {
      // Insert
      await pool.request()
        .input('KyChamCong', sql.NVarChar, kyChamCong)
        .input('NhanSuId', sql.Int, staffId)
        .input('ChiTietNgay', sql.NVarChar, jsonStr)
        .input('TongDiLam', sql.Float, data.TongDiLam || 0)
        .input('TongNuaNgay', sql.Float, data.TongNuaNgay || 0)
        .input('TongNghiPhep', sql.Float, data.TongNghiPhep || 0)
        .input('TongKhongLuong', sql.Float, data.TongKhongLuong || 0)
        .input('TongTangCa', sql.Float, data.TongTangCa || 0)
        .input('TongThaiSan', sql.Float, data.TongThaiSan || 0)
        .query(`
          INSERT INTO dp_system.dbo.App_ChamCong (
            KyChamCong, NhanSuId, ChiTietNgay, TongDiLam, TongNuaNgay, 
            TongNghiPhep, TongKhongLuong, TongTangCa, TongThaiSan
          ) VALUES (
            @KyChamCong, @NhanSuId, @ChiTietNgay, @TongDiLam, @TongNuaNgay,
            @TongNghiPhep, @TongKhongLuong, @TongTangCa, @TongThaiSan
          )
        `);
    }
    
    revalidatePath("/hr/payroll");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function savePayroll(kyLuong: string, staffId: number, data: Partial<BangLuongData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Check if exists
    const check = await pool.request()
      .input('KyLuong', sql.NVarChar, kyLuong)
      .input('NhanSuId', sql.Int, staffId)
      .query(`SELECT Id FROM dp_system.dbo.App_BangLuong WHERE KyLuong = @KyLuong AND NhanSuId = @NhanSuId`);
      
    if (check.recordset.length > 0) {
      await pool.request()
        .input('KyLuong', sql.NVarChar, kyLuong)
        .input('NhanSuId', sql.Int, staffId)
        .input('LuongCoBan', sql.Float, data.LuongCoBan || 0)
        .input('NgayCongThucTe', sql.Float, data.NgayCongThucTe || 0)
        .input('LuongThucTe', sql.Float, data.LuongThucTe || 0)
        .input('KhauTru_BHXH', sql.Float, data.KhauTru_BHXH || 0)
        .input('KhauTru_BHYT', sql.Float, data.KhauTru_BHYT || 0)
        .input('KhauTru_BHTN', sql.Float, data.KhauTru_BHTN || 0)
        .input('ThucNhan', sql.Float, data.ThucNhan || 0)
        .query(`
          UPDATE dp_system.dbo.App_BangLuong SET
            LuongCoBan = @LuongCoBan,
            NgayCongThucTe = @NgayCongThucTe,
            LuongThucTe = @LuongThucTe,
            KhauTru_BHXH = @KhauTru_BHXH,
            KhauTru_BHYT = @KhauTru_BHYT,
            KhauTru_BHTN = @KhauTru_BHTN,
            ThucNhan = @ThucNhan,
            NgayCapNhat = GETDATE()
          WHERE KyLuong = @KyLuong AND NhanSuId = @NhanSuId
        `);
    } else {
      await pool.request()
        .input('KyLuong', sql.NVarChar, kyLuong)
        .input('NhanSuId', sql.Int, staffId)
        .input('LuongCoBan', sql.Float, data.LuongCoBan || 0)
        .input('NgayCongThucTe', sql.Float, data.NgayCongThucTe || 0)
        .input('LuongThucTe', sql.Float, data.LuongThucTe || 0)
        .input('KhauTru_BHXH', sql.Float, data.KhauTru_BHXH || 0)
        .input('KhauTru_BHYT', sql.Float, data.KhauTru_BHYT || 0)
        .input('KhauTru_BHTN', sql.Float, data.KhauTru_BHTN || 0)
        .input('ThucNhan', sql.Float, data.ThucNhan || 0)
        .query(`
          INSERT INTO dp_system.dbo.App_BangLuong (
            KyLuong, NhanSuId, LuongCoBan, NgayCongThucTe, LuongThucTe,
            KhauTru_BHXH, KhauTru_BHYT, KhauTru_BHTN, ThucNhan
          ) VALUES (
            @KyLuong, @NhanSuId, @LuongCoBan, @NgayCongThucTe, @LuongThucTe,
            @KhauTru_BHXH, @KhauTru_BHYT, @KhauTru_BHTN, @ThucNhan
          )
        `);
    }
    
    revalidatePath("/hr/payroll");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

export type SalaryConfigData = {
  GiaoVienId: number;
  HoTen: string;
  ChucVu: string;
  LuongCoBan: number;
  NPT: number;
  PhongBan?: string;
  TinhTrangBHXH?: boolean;
};

export async function getSalaryConfigs(): Promise<SalaryConfigData[]> {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const res = await pool.request().query(`
      SELECT Id as GiaoVienId, HoTen, LoaiNhanSu as ChucVu, LuongCoBan, NPT, 
             CAST(CASE WHEN TrangThaiBHXH = N'Giáo viên đóng BHXH' THEN 1 ELSE 0 END AS BIT) as TinhTrangBHXH
      FROM dp_system.dbo.App_GiaoVien
      ORDER BY HoTen ASC
    `);
    return res.recordset.map(row => ({
      GiaoVienId: row.GiaoVienId,
      HoTen: row.HoTen || '',
      ChucVu: row.ChucVu || '',
      LuongCoBan: row.LuongCoBan || 0,
      NPT: row.NPT || 0,
      TinhTrangBHXH: !!row.TinhTrangBHXH
    }));
  } catch (err: any) {
    console.error(err);
    return [];
  }
}

export async function updateSalaryConfig(giaoVienId: number, data: Partial<SalaryConfigData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('Id', sql.Int, giaoVienId)
      .input('LuongCoBan', sql.Float, data.LuongCoBan || 0)
      .input('NPT', sql.Int, data.NPT || 0)
      .query(`
        UPDATE dp_system.dbo.App_GiaoVien SET 
          LuongCoBan = @LuongCoBan,
          NPT = @NPT
        WHERE Id = @Id
      `);
    revalidatePath("/hr/salary-config");
    revalidatePath("/hr/payroll");
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}
