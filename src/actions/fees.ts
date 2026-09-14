"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { getFeeNorms } from './settings';

function parseDate(dateStr: string) {
  if (!dateStr || dateStr === '-') return null;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    if (parseInt(parts[0]) > 1000) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    if (parseInt(parts[0]) > 1000) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
}

export async function getFeeCourses() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        k.MaKhoa as id,
        ISNULL(a.TenKhoa, k.MaKhoa) as name,
        a.Hang as hangXe,
        k.NgayHoc as khaiGiang,
        k.NgayKt as beGiang,
        ISNULL(a.NgaySatHach, '') as satHach,
        ISNULL(a.TrungTam, N'Đại Phát') as trungTam,
        COUNT(h.MaDK) as soHocVien,
        SUM(CASE WHEN ISNULL(h.TrangThaiDuyet, 0) = 1 THEN ISNULL(h.DaNop, 0) ELSE 0 END) as tongDaNop
      FROM App_DieuChinh_Khoa k
      LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
      LEFT JOIN App_HocVien_V2 h ON k.MaKhoa = h.MaKhoa
      GROUP BY k.MaKhoa, a.TenKhoa, a.Hang, k.NgayHoc, k.NgayKt, a.NgaySatHach, a.TrungTam
      ORDER BY k.NgayHoc DESC
    `);
    // pool.close(); // Managed by db.ts
    
    // Khai giảng từ tháng 6 năm hiện tại (hoặc năm cũ nếu cần). 
    // Yêu cầu: "hiển thị tất cả các khóa khai giảng từ tháng 6 đến nay".
    // Giả sử lấy từ 01/06/2024.
    const fromDate = new Date(2024, 5, 1).getTime(); // June is month 5

    const feeNorms = await getFeeNorms();

    return result.recordset.filter(r => {
      const d = parseDate(r.khaiGiang);
      if (!d) return false;
      return d.getTime() >= fromDate;
    }).map(r => {
      const hang = r.hangXe === 'C' ? 'C1' : r.hangXe;
      const expected = r.soHocVien * (feeNorms[hang] || 0);
      return {
        id: r.id,
        name: r.name,
        hangXe: hang,
        khaiGiang: r.khaiGiang,
        satHach: r.satHach,
        trungTam: r.trungTam,
        soHocVien: r.soHocVien,
        tongTienThu: expected,
        tongDaNop: r.tongDaNop || 0,
        tongConNo: expected - (r.tongDaNop || 0)
      };
    }).sort((a, b) => {
       const da = parseDate(a.khaiGiang)?.getTime() || 0;
       const db = parseDate(b.khaiGiang)?.getTime() || 0;
       return db - da;
    });
  } catch (err) {
    console.error("Error fetching fee courses:", err);
    return [];
  }
}

export async function getCourseFeeDetails(maKhoa: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Course info
    const courseRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT k.MaKhoa as id, ISNULL(a.TenKhoa, k.MaKhoa) as name, k.NgayHoc as khaiGiang, ISNULL(a.NgaySatHach, '') as satHach, a.Hang as hangXe
        FROM App_DieuChinh_Khoa k
        LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
        WHERE k.MaKhoa = @MaKhoa
      `);
      
    // Students
    const studentsRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT MaDK, HoTen, NguoiNop, TienThu, DaNop, ConNo, NgayNhap, ISNULL(TrangThaiDuyet, 0) as TrangThaiDuyet, NguoiDuyet
        FROM App_HocVien_V2
        WHERE MaKhoa = @MaKhoa
      `);
      
    // pool.close(); // Managed by db.ts
    
    const course = courseRes.recordset[0] || null;
    if (course) {
        course.hangXe = course.hangXe === 'C' ? 'C1' : course.hangXe;
    }
    const students = studentsRes.recordset;
    
    const feeNorms = await getFeeNorms();
    const courseFeeNorm = course && course.hangXe ? (feeNorms[course.hangXe] || 0) : 0;
    
    // Processing data
    const summary = {
      totalStudents: students.length,
      totalExpected: 0,
      totalPaid: 0,
      totalDebt: 0
    };
    
    const dauMoiMap: Record<string, any> = {};
    
    for (const s of students) {
      const dm = s.NguoiNop || 'Khách lẻ / Chưa có đầu mối';
      if (!dauMoiMap[dm]) {
        dauMoiMap[dm] = {
          dauMoiName: dm,
          students: [],
          totalExpected: 0,
          totalPaid: 0,
          totalDebt: 0
        };
      }
      
      const expected = courseFeeNorm;
      const paid = s.TrangThaiDuyet ? (s.DaNop || 0) : 0;
      const debt = expected - paid; // Còn nợ = Dự kiến thu - Đã nộp
      
      summary.totalExpected += expected;
      summary.totalPaid += paid;
      summary.totalDebt += debt;
      
      dauMoiMap[dm].totalExpected += expected;
      dauMoiMap[dm].totalPaid += paid;
      dauMoiMap[dm].totalDebt += debt;
      
      dauMoiMap[dm].students.push({
        maDk: s.MaDK,
        hoTen: s.HoTen,
        tienThu: expected,
        daNop: s.DaNop || 0, // Vẫn hiển thị số tiền học viên nộp (chờ duyệt hoặc đã duyệt)
        conNo: debt,
        ngayNhap: s.NgayNhap ? new Date(s.NgayNhap).toLocaleDateString('en-GB') : '-',
        trangThaiDuyet: !!s.TrangThaiDuyet,
        nguoiDuyet: s.NguoiDuyet || null
      });
    }
    
    const byDauMoi = Object.values(dauMoiMap).sort((a, b) => b.totalPaid - a.totalPaid);
    
    return {
      course,
      summary,
      byDauMoi
    };
  } catch (err) {
    console.error("Error getCourseFeeDetails:", err);
    return null;
  }
}

export async function getGlobalFeeStatistics() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        a.Hang as hangXe,
        COUNT(h.MaDK) as soHocVien,
        SUM(CAST(REPLACE(ISNULL(h.TienThu, '0'), '.', '') AS BIGINT)) as tongTienThu,
        SUM(CASE WHEN ISNULL(h.TrangThaiDuyet, 0) = 1 THEN ISNULL(h.DaNop, 0) ELSE 0 END) as tongDaNop,
        SUM(ISNULL(h.ConNo, 0)) as tongConNo
      FROM App_Khoa a
      JOIN App_DieuChinh_Khoa k ON a.MaKhoa = k.MaKhoa
      JOIN App_HocVien_V2 h ON a.MaKhoa = h.MaKhoa
      WHERE k.NgayHoc IS NOT NULL
      GROUP BY a.Hang
    `);
    // pool.close(); // Managed by db.ts
    const feeNorms = await getFeeNorms();
    
    return result.recordset.map(r => {
      const hang = r.hangXe === 'C' ? 'C1' : r.hangXe;
      const expected = r.soHocVien * (feeNorms[hang] || 0);
      return {
        hangXe: hang,
        soHocVien: r.soHocVien,
        tongTienThu: expected,
        tongDaNop: r.tongDaNop || 0,
        tongConNo: expected - (r.tongDaNop || 0) // Còn nợ = Dự kiến thu - Đã nộp
      };
    });
  } catch (err) {
    console.error("Error getGlobalFeeStatistics:", err);
    return [];
  }
}

export async function toggleStudentFeeApproval(maDk: string, isApproved: boolean, nguoiDuyet?: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const updateNguoiDuyet = isApproved && nguoiDuyet ? `, NguoiDuyet = @NguoiDuyet` : `, NguoiDuyet = NULL`;
    const request = pool.request()
      .input('MaDK', sql.NVarChar, maDk)
      .input('TrangThaiDuyet', sql.Bit, isApproved ? 1 : 0);
      
    if (isApproved && nguoiDuyet) {
      request.input('NguoiDuyet', sql.NVarChar, nguoiDuyet);
    }
    
    await request.query(`UPDATE App_HocVien_V2 SET TrangThaiDuyet = @TrangThaiDuyet, NgayDuyet = ${isApproved ? 'GETDATE()' : 'NULL'} ${updateNguoiDuyet} WHERE MaDK = @MaDK`);
    // pool.close(); // Managed by db.ts
    return { success: true };
  } catch (err: any) {
    console.error("Error toggleStudentFeeApproval:", err);
    return { success: false, error: err.message };
  }
}

export async function bulkApproveStudentFees(maDks: string[], nguoiDuyet: string = 'Trang') {
  if (!maDks || maDks.length === 0) return { success: true };
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const inClause = maDks.map((_, i) => `@p${i}`).join(',');
    const request = pool.request();
    maDks.forEach((ma, i) => request.input(`p${i}`, sql.NVarChar, ma));
    request.input('NguoiDuyet', sql.NVarChar, nguoiDuyet);
    
    await request.query(`
      UPDATE App_HocVien_V2 
      SET TrangThaiDuyet = 1, NgayDuyet = GETDATE(), NguoiDuyet = @NguoiDuyet
      WHERE MaDK IN (${inClause})
    `);
    // pool.close(); // Managed by db.ts
    return { success: true };
  } catch (err: any) {
    console.error("Error bulkApproveStudentFees:", err);
    return { success: false, error: err.message };
  }
}

export async function getDailyStudents(dateStr?: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const dateCondition = dateStr ? `CAST(h.NgayNhap AS DATE) = @DateStr` : `CAST(h.NgayNhap AS DATE) = CAST(GETDATE() AS DATE)`;
    
    const result = await pool.request()
      .input('DateStr', sql.NVarChar, dateStr || '')
      .query(`
        SELECT 
          h.MaDK as maDk, 
          h.HoTen as hoTen, 
          ISNULL(h.DaNop, 0) as daNop, 
          k.Hang as hangXe,
          ISNULL(h.GiaoVien, N'Chưa xếp') as giaoVien,
          ISNULL(h.TrangThaiDuyet, 0) as trangThaiDuyet,
          h.NguoiDuyet as nguoiDuyet,
          ISNULL(h.NguoiNop, N'Khách lẻ') as nguoiNop,
          k.MaKhoa as maKhoa,
          ISNULL(k.TenKhoa, k.MaKhoa) as tenKhoa,
          CASE WHEN ISNULL(h.HinhThucThu, '') = '' THEN N'Tiền mặt' ELSE h.HinhThucThu END as hinhThucThu
        FROM App_HocVien_V2 h
        JOIN App_Khoa k ON h.MaKhoa = k.MaKhoa
        WHERE ${dateCondition}
      `);
      
    // pool.close(); // Managed by db.ts
    
    const students = result.recordset.map(r => ({
      ...r,
      hangXe: r.hangXe === 'C' ? 'C1' : r.hangXe
    }));
    
    const motoCategories = ['A1', 'A2', 'A3', 'A4', 'A'];
    
    const motoStudents = students.filter(s => motoCategories.includes(s.hangXe));
    const otoStudents = students.filter(s => !motoCategories.includes(s.hangXe));
    
    // We will calculate totals on the client side based on the filter
    return {
      moto: motoStudents,
      oto: otoStudents
    };
  } catch(e) {
    console.error("Error getDailyStudents:", e);
    return { moto: [], oto: [] };
  }
}
