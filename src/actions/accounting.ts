"use server";

import { revalidatePath } from 'next/cache';
import sql from 'mssql';

const serverParts = (process.env.SQL_SERVER_NAME || "").split(",");
const dbConfig = {
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  server: serverParts[0] || "",
  port: serverParts.length > 1 ? parseInt(serverParts[1]) : 1433,
  database: process.env.SQL_DATABASE || "dp_system",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

export async function getTransactions(month: number, year: number) {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Construct YYYY-MM-DD strings to avoid NodeJS timezone shift when passing to MSSQL
    const startStr = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00:00`;
    
    const result = await pool.request()
      .input('StartDate', sql.NVarChar, startStr)
      .input('EndDate', sql.NVarChar, endStr)
      .query(`
        SELECT 
          Id, MaGD, NgayGD, LoaiGD, DanhMuc, SoTien, NguoiNhanNop, HinhThuc,
          ChungTu, TrangThai, GhiChu, MaKhoa, TrungTam, NgayTao
        FROM App_ThuChi
        WHERE NgayGD >= CAST(@StartDate AS DATETIME) AND NgayGD < CAST(@EndDate AS DATETIME)
        ORDER BY NgayGD DESC, Id DESC
      `);
      
    pool.close();
    
    return result.recordset.map(r => ({
      id: r.Id,
      maGD: r.MaGD,
      ngayGD: r.NgayGD,
      loaiGD: r.LoaiGD,
      danhMuc: r.DanhMuc,
      soTien: r.SoTien,
      nguoiNhanNop: r.NguoiNhanNop,
      hinhThuc: r.HinhThuc,
      chungTu: r.ChungTu,
      trangThai: r.TrangThai,
      ghiChu: r.GhiChu,
      maKhoa: r.MaKhoa,
      trungTam: r.TrungTam,
      ngayTao: r.NgayTao,
    }));
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
}

export async function getAccountingDashboardStats(month: number, year: number) {
  try {
    const pool = await sql.connect(dbConfig);
    
    const startStr = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01T00:00:00`;
    
    const result = await pool.request()
      .input('StartDate', sql.NVarChar, startStr)
      .input('EndDate', sql.NVarChar, endStr)
      .query(`
        SELECT LoaiGD, SUM(SoTien) as TotalAmount
        FROM App_ThuChi
        WHERE NgayGD >= CAST(@StartDate AS DATETIME) AND NgayGD < CAST(@EndDate AS DATETIME) AND TrangThai = N'Hoàn thành'
        GROUP BY LoaiGD
      `);
      
    pool.close();
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    result.recordset.forEach(r => {
      if (r.LoaiGD === 'THU') totalIncome = r.TotalAmount;
      if (r.LoaiGD === 'CHI') totalExpense = r.TotalAmount;
    });
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }
}

export async function createTransaction(data: any) {
  try {
    const pool = await sql.connect(dbConfig);
    
    const now = new Date();
    const pad = (n: number, w: number) => n.toString().padStart(w, '0');
    // Generate MaGD: TC-YYYYMMDD-HHMMSS
    const maGD = `TC-${now.getFullYear()}${pad(now.getMonth()+1, 2)}${pad(now.getDate(), 2)}-${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}`;
    
    const request = pool.request();
    request.input('MaGD', sql.NVarChar, maGD);
    request.input('NgayGD', sql.DateTime, data.ngayGD ? new Date(data.ngayGD) : new Date());
    request.input('LoaiGD', sql.NVarChar, data.loaiGD);
    request.input('DanhMuc', sql.NVarChar, data.danhMuc);
    request.input('SoTien', sql.Decimal(18,0), data.soTien);
    request.input('NguoiNhanNop', sql.NVarChar, data.nguoiNhanNop || '');
    request.input('HinhThuc', sql.NVarChar, data.hinhThuc || '');
    request.input('ChungTu', sql.NVarChar, data.chungTu || '');
    request.input('TrangThai', sql.NVarChar, data.trangThai || 'Hoàn thành');
    request.input('GhiChu', sql.NVarChar, data.ghiChu || '');
    request.input('MaKhoa', sql.NVarChar, data.maKhoa || null);
    request.input('TrungTam', sql.NVarChar, data.trungTam || 'Đại Phát');
    
    await request.query(`
      INSERT INTO App_ThuChi (
        MaGD, NgayGD, LoaiGD, DanhMuc, SoTien, NguoiNhanNop, HinhThuc, ChungTu, TrangThai, GhiChu, MaKhoa, TrungTam
      ) VALUES (
        @MaGD, DATEADD(hour, 7, GETUTCDATE()), @LoaiGD, @DanhMuc, @SoTien, @NguoiNhanNop, @HinhThuc, @ChungTu, @TrangThai, @GhiChu, @MaKhoa, @TrungTam
      )
    `);
    
    pool.close();
    revalidatePath('/accounting/transactions');
    return { success: true };
  } catch (err: any) {
    console.error("Error creating transaction:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteTransaction(id: number) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('Id', sql.Int, id)
      .query(`DELETE FROM App_ThuChi WHERE Id = @Id`);
    
    pool.close();
    revalidatePath('/accounting/transactions');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting transaction:", err);
    return { success: false, error: err.message };
  }
}

export async function getTransactionById(id: string) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          Id, MaGD, NgayGD, LoaiGD, DanhMuc, SoTien, NguoiNhanNop, HinhThuc,
          ChungTu, TrangThai, GhiChu, MaKhoa, TrungTam, NgayTao
        FROM App_ThuChi
        WHERE Id = @Id
      `);
      
    pool.close();
    
    if (result.recordset.length === 0) return null;
    
    const r = result.recordset[0];
    return {
      id: r.Id,
      maGD: r.MaGD,
      ngayGD: r.NgayGD,
      loaiGD: r.LoaiGD,
      danhMuc: r.DanhMuc,
      soTien: r.SoTien,
      nguoiNhanNop: r.NguoiNhanNop,
      hinhThuc: r.HinhThuc,
      chungTu: r.ChungTu,
      trangThai: r.TrangThai,
      ghiChu: r.GhiChu,
      maKhoa: r.MaKhoa,
      trungTam: r.TrungTam,
      ngayTao: r.NgayTao,
    };
  } catch (err) {
    console.error("Error fetching transaction by id:", err);
    return null;
  }
}

