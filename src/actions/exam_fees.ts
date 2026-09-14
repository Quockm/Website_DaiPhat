"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from "next/cache";

// Cột chuẩn theo app Python
export interface ExamStudent {
  STT: string;
  NgayThi: string;
  HoTen: string;
  NgaySinh: string;
  CCCD: string;
  Hang: string;
  GhiChu: string;
  ThanhTien: string;
  GiaoVien: string;
  MaQR: string;
  TrangThaiThanhToan: string;
}

export async function getExamStudents() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        STT, 
        [Ngày thi] as NgayThi, 
        [Họ tên] as HoTen, 
        [Ngày sinh] as NgaySinh, 
        CCCD, 
        [Hạng] as Hang, 
        [Ghi chú] as GhiChu, 
        [Thành tiền] as ThanhTien, 
        [Giáo viên] as GiaoVien, 
        [MÃ QR (VIETCODE)] as MaQR,
        TrangThaiThanhToan
      FROM Web_DanhSachHocVien
      ORDER BY CCCD
    `);
    // pool.close(); // Managed by db.ts
    return { success: true, data: result.recordset };
  } catch (err: any) {
    console.error("Error fetching exam students:", err);
    return { success: false, error: err.message, data: [] };
  }
}

export async function saveExamStudents(students: ExamStudent[]) {
  if (!students || students.length === 0) return { success: true, count: 0 };
  
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Đảm bảo bảng tồn tại (theo logic của app cũ)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Web_DanhSachHocVien' and xtype='U') 
      CREATE TABLE Web_DanhSachHocVien (
        STT NVARCHAR(50), 
        [Ngày thi] NVARCHAR(50), 
        [Họ tên] NVARCHAR(255), 
        [Ngày sinh] NVARCHAR(50), 
        CCCD NVARCHAR(50) PRIMARY KEY, 
        [Hạng] NVARCHAR(50), 
        [SĐT] NVARCHAR(50),
        [Ghi chú] NVARCHAR(MAX),
        [Thành tiền] NVARCHAR(100), 
        [Giáo viên] NVARCHAR(255), 
        [MÃ QR (VIETCODE)] NVARCHAR(MAX), 
        TrangThaiZNS NVARCHAR(100) DEFAULT N'Chưa gửi', 
        TrangThaiBot NVARCHAR(100) DEFAULT N'Chưa tương tác', 
        TrangThaiThanhToan NVARCHAR(100) DEFAULT N'Chưa nạp'
      )
    `);

    // Ensure Ghi chú column exists for existing tables
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Web_DanhSachHocVien') AND name = 'Ghi chú')
      BEGIN
        ALTER TABLE Web_DanhSachHocVien ADD [Ghi chú] NVARCHAR(MAX)
      END
    `);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      let count = 0;
      for (const s of students) {
        if (!s.CCCD || s.CCCD.trim() === '') continue;

        const req = new sql.Request(transaction);
        req.input('STT', sql.NVarChar, s.STT || '');
        req.input('NgayThi', sql.NVarChar, s.NgayThi || '');
        req.input('HoTen', sql.NVarChar, s.HoTen || '');
        req.input('NgaySinh', sql.NVarChar, s.NgaySinh || '');
        req.input('CCCD', sql.NVarChar, s.CCCD);
        req.input('Hang', sql.NVarChar, s.Hang || '');
        req.input('GhiChu', sql.NVarChar, s.GhiChu || '');
        req.input('ThanhTien', sql.NVarChar, s.ThanhTien || '');
        req.input('GiaoVien', sql.NVarChar, s.GiaoVien || '');

        // Upsert bằng MERGE (1 round-trip thay vì SELECT + INSERT/UPDATE riêng)
        await req.query(`
          MERGE Web_DanhSachHocVien AS target
          USING (SELECT @CCCD AS CCCD) AS source
          ON target.CCCD = source.CCCD
          WHEN MATCHED THEN
            UPDATE SET
              STT = @STT,
              [Ngày thi] = @NgayThi,
              [Họ tên] = @HoTen,
              [Ngày sinh] = @NgaySinh,
              [Hạng] = @Hang,
              [Ghi chú] = @GhiChu,
              [Thành tiền] = @ThanhTien,
              [Giáo viên] = @GiaoVien
          WHEN NOT MATCHED THEN
            INSERT (STT, [Ngày thi], [Họ tên], [Ngày sinh], CCCD, [Hạng], [Ghi chú], [Thành tiền], [Giáo viên], [MÃ QR (VIETCODE)])
            VALUES (@STT, @NgayThi, @HoTen, @NgaySinh, @CCCD, @Hang, @GhiChu, @ThanhTien, @GiaoVien, '');
        `);
        count++;
      }

      await transaction.commit();
      revalidatePath('/accounting/fees');
      return { success: true, count };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err: any) {
    console.error("Error saving exam students:", err);
    return { success: false, error: err.message };
  }
}

export async function updateExamQR(qrDataList: {cccd: string, qrCode: string, ngayThi?: string}[]) {
  const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    let count = 0;

    for (const data of qrDataList) {
      if (!data.cccd || !data.qrCode) continue;
      const req = new sql.Request(transaction);
      req.input('CCCD', sql.NVarChar, data.cccd);
      req.input('MaQR', sql.NVarChar, data.qrCode);

      let query = `
        UPDATE Web_DanhSachHocVien
        SET [MÃ QR (VIETCODE)] = @MaQR
      `;

      if (data.ngayThi) {
        req.input('NgayThi', sql.NVarChar, data.ngayThi);
        query += `, [Ngày thi] = @NgayThi `;
      }

      query += ` WHERE CCCD = @CCCD`;

      const result = await req.query(query);

      if (result.rowsAffected[0] > 0) {
        count++;
      }
    }

    await transaction.commit();
    revalidatePath('/accounting/fees');
    return { success: true, count };
  } catch (err: any) {
    await transaction.rollback();
    console.error("Error updating QR:", err);
    return { success: false, error: err.message };
  }
}

export async function clearExamStudents() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request().query(`DELETE FROM Web_DanhSachHocVien`);
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/fees');
    return { success: true };
  } catch (err: any) {
    console.error("Error clearing students:", err);
    return { success: false, error: err.message };
  }
}
