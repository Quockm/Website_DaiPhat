"use server";

import { getDbConnection } from '@/lib/db';

export async function getPendingHandoversCount() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Count pending cars
    const carRes = await pool.request().query(`
      SELECT COUNT(*) as Count 
      FROM dp_system.dbo.App_PhuongTien 
      WHERE TrangThaiBanGiao = N'Đã bàn giao' AND ISNULL(DangKyMST, 0) = 0
    `);
    
    // Count pending teachers
    const teacherRes = await pool.request().query(`
      SELECT COUNT(*) as Count 
      FROM dp_system.dbo.App_GiaoVien 
      WHERE TrangThaiBanGiaoGV = N'Đã bàn giao' AND ISNULL(NhanSuXacNhanGV, 0) = 0
    `);
    
    return {
      success: true,
      data: {
        cars: carRes.recordset[0].Count || 0,
        teachers: teacherRes.recordset[0].Count || 0,
        total: (carRes.recordset[0].Count || 0) + (teacherRes.recordset[0].Count || 0)
      }
    };
  } catch (err: any) {
    console.error("Error fetching pending handovers:", err);
    return { success: false, error: err.message, data: { cars: 0, teachers: 0, total: 0 } };
  }
}
