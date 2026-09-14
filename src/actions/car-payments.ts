"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";
import { revalidatePath } from "next/cache";

export type CarPayment = {
  Id: number;
  PhuongTienId: number;
  KyThanhToan: string;
  SoTien: number;
  HanThanhToan: string;
  TrangThai: string;
  NgayThanhToan: string;
  NguoiXacNhan: string;
  GhiChu: string;
  // Extra fields from join
  BienSo?: string;
  ChuXe?: string;
};

// Generate missing payment records for cars that have PhanLoaiXe = 'Xe đăng ký MST'
export async function generateCarPayments(kyThanhToan: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    
    // First, get all cars that are 'Xe đăng ký MST'
    const carsRes = await pool.request().query(`
      SELECT Id, NgayKyHopDongXe FROM dp_system.dbo.App_PhuongTien
      WHERE PhanLoaiXe = N'Xe đăng ký MST'
    `);
    
    const cars = carsRes.recordset;
    
    for (const car of cars) {
      // Check if a payment record already exists for this car and month
      const checkRes = await pool.request()
        .input("PhuongTienId", sql.Int, car.Id)
        .input("KyThanhToan", sql.NVarChar, kyThanhToan)
        .query(`
          SELECT Id FROM dp_system.dbo.App_LichThanhToanXe
          WHERE PhuongTienId = @PhuongTienId AND KyThanhToan = @KyThanhToan
        `);
        
      if (checkRes.recordset.length === 0) {
        // We will set HanThanhToan to the 5th of next month (or something arbitrary for now)
        // Insert new payment record
        await pool.request()
          .input("PhuongTienId", sql.Int, car.Id)
          .input("KyThanhToan", sql.NVarChar, kyThanhToan)
          .query(`
            INSERT INTO dp_system.dbo.App_LichThanhToanXe (
              PhuongTienId, KyThanhToan, SoTien, TrangThai
            ) VALUES (
              @PhuongTienId, @KyThanhToan, 3000000, N'Chưa thanh toán'
            )
          `);
      }
    }
    
    revalidatePath("/accounting/car-payments");
    return { success: true };
  } catch (err: any) {
    console.error("Error generating car payments:", err);
    return { success: false, error: err.message };
  }
}

export async function getCarPayments(kyThanhToan: string): Promise<CarPayment[]> {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    const result = await pool.request()
      .input("KyThanhToan", sql.NVarChar, kyThanhToan)
      .query(`
        SELECT p.Id, p.PhuongTienId, p.KyThanhToan, p.SoTien, p.HanThanhToan, p.TrangThai, 
               p.NgayThanhToan, p.NguoiXacNhan, p.GhiChu,
               xe.BienSo, xe.ChuXe
        FROM dp_system.dbo.App_LichThanhToanXe p
        LEFT JOIN dp_system.dbo.App_PhuongTien xe ON p.PhuongTienId = xe.Id
        WHERE p.KyThanhToan = @KyThanhToan
        ORDER BY p.TrangThai ASC, p.Id DESC
      `);
    return result.recordset;
  } catch (err: any) {
    console.error("Error fetching car payments:", err);
    return [];
  }
}

export async function updateCarPaymentStatus(id: number, trangThai: string, nguoiXacNhan: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    await pool.request()
      .input("Id", sql.Int, id)
      .input("TrangThai", sql.NVarChar, trangThai)
      .input("NguoiXacNhan", sql.NVarChar, nguoiXacNhan)
      .query(`
        UPDATE dp_system.dbo.App_LichThanhToanXe
        SET TrangThai = @TrangThai,
            NguoiXacNhan = @NguoiXacNhan,
            NgayThanhToan = CASE WHEN @TrangThai = N'Đã thanh toán' THEN GETDATE() ELSE NULL END,
            NgayCapNhat = GETDATE()
        WHERE Id = @Id
      `);
      
    revalidatePath("/accounting/car-payments");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating car payment:", err);
    return { success: false, error: err.message };
  }
}
