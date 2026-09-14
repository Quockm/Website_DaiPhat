"use server";

import { revalidatePath } from 'next/cache';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { getConfigRates } from './courses';
import { getFeeNorms } from './settings';

export interface AdmissionStudent {
  stt: number;
  name: string;
  dob: string;
  phone: string;
  cccd: string;
  teacher: string;
  ngayNop: string;
  hocPhi: number;
  mucPhi: number;
  thieu: number;
  hinhThuc: string;
  ghiChu: string;
}

export interface AdmissionCourse {
  name: string;
  category: string;
  students: AdmissionStudent[];
}

export async function getAdmissionsData(): Promise<AdmissionCourse[]> {
  // Dummy data to satisfy AdmissionsClient which relies on it
  return [];
}


export async function getCoursesForAdmissions(type: 'MOTO' | 'OTO') {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        a.MaKhoa as id,
        ISNULL(a.TenKhoa, a.MaKhoa) as name,
        a.Hang as hangXe,
        (SELECT COUNT(*) FROM App_HocVien_V2 h WHERE h.MaKhoa = a.MaKhoa) as soHocVienDaNhap,
        ISNULL(a.LuuLuong, 0) as luuLuong,
        k.NgayHoc as khaiGiang,
        k.NgayKt as beGiang,
        ISNULL(a.TinhTrang, N'Chưa khai giảng') as status,
        CASE 
          WHEN a.Hang IN ('A1', 'A') THEN 'MOTO'
          ELSE 'OTO'
        END as type,
        ISNULL(a.TrungTam, N'Đại Phát') as trungTam
      FROM App_Khoa a
      LEFT JOIN App_DieuChinh_Khoa k ON a.MaKhoa = k.MaKhoa
      ORDER BY a.MaKhoa DESC
    `);
    // pool.close(); // Managed by db.ts
    
    const today = new Date().setHours(0,0,0,0);
    
    const parseDate = (dateStr: string) => {
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
    };

    return result.recordset
      .filter(r => {
        if (r.type !== type) return false;
        
        // Exclude courses that are not approved yet or are finished
        if (r.status === 'Mới tạo' || r.status === 'Chờ duyệt' || r.status === 'Đã bế giảng' || r.status === 'Đã sát hạch') return false;
        
        // Exclude if full (only if luuLuong is properly set)
        if (r.luuLuong > 0 && (r.soHocVienDaNhap || 0) >= r.luuLuong) return false;
        
        // Filter out completed courses (beGiang is in the past)
        const bgDate = parseDate(r.beGiang)?.getTime();
        if (bgDate && bgDate < today) return false;
        
        return true;
      })
      .map(r => ({
        id: r.id,
        name: r.name,
        hangXe: r.hangXe,
        soHocVienDaNhap: r.soHocVienDaNhap || 0,
        luuLuong: r.luuLuong,
        khaiGiang: r.khaiGiang,
        status: r.status,
        trungTam: r.trungTam,
      }));
  } catch (err: any) {
    console.error("Error fetching courses for admissions:", err);
    return [];
  }
}

export async function getCourseDetailsForAdmissions(maKhoa: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Get students, teachers, cars, rates and fee norms in parallel (independent queries)
    const [studentsRes, teachersRes, carsRes, rates, feeNorms] = await Promise.all([
      pool.request()
        .input('MaKhoa', sql.NVarChar, maKhoa)
        .query(`
          SELECT MaDK as Id, HoTen, NgaySinh, CCCD, SDT as SoDienThoai, NgayNhap, GiaoVien, NguoiNop, TienThu, HinhThucThu, DaNop, ConNo
          FROM App_HocVien_V2
          WHERE MaKhoa = @MaKhoa
          ORDER BY NgayNhap DESC
        `),
      pool.request()
        .input('MaKhoa', sql.NVarChar, maKhoa)
        .query(`
          SELECT pg.MaGV as id, g.HoTen as name
          FROM App_PhanCong_GV pg
          JOIN App_GiaoVien g ON pg.MaGV = CAST(g.Id AS NVARCHAR)
          WHERE pg.MaKhoa = @MaKhoa
        `),
      pool.request()
        .input('MaKhoa', sql.NVarChar, maKhoa)
        .query(`
          SELECT px.BienSoXe as bienSo, x.ChuXe as chuXe
          FROM App_PhanCong_Xe px
          JOIN App_PhuongTien x ON px.BienSoXe = x.BienSo
          WHERE px.MaKhoa = @MaKhoa
        `),
      getConfigRates(),
      getFeeNorms(),
    ]);

    // pool.close(); // Managed by db.ts

    return {
      students: studentsRes.recordset.map(r => ({
        id: r.Id,
        hoTen: r.HoTen,
        ngaySinh: r.NgaySinh,
        cccd: r.CCCD,
        soDienThoai: r.SoDienThoai,
        ngayNhap: r.NgayNhap,
        giaoVien: r.GiaoVien,
        nguoiNop: r.NguoiNop,
        tienThu: r.TienThu,
        hinhThucThu: r.HinhThucThu,
        daNop: r.DaNop,
        conNo: r.ConNo
      })),
      teachers: teachersRes.recordset.map(r => ({
        id: r.id,
        name: r.name
      })),
      cars: carsRes.recordset.map(r => ({
        bienSo: r.bienSo,
        chuXe: r.chuXe
      })),
      rates,
      feeNorms
    };
  } catch (err: any) {
    console.error("Error getting details", err);
    return { students: [], teachers: [], cars: [], rates: {}, feeNorms: {} };
  }
}

export async function addStudent(data: {
  maKhoa: string;
  hoTen: string;
  ngaySinh: string;
  cccd: string;
  soDienThoai: string;
  giaoVien?: string;
  nguoiNop?: string;
  tienThu?: string;
  hinhThucThu?: string;
  daNop?: number;
  conNo?: number;
}) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = new sql.Request(pool);
    
    const now = new Date();
    const pad = (n: number, w: number) => n.toString().padStart(w, '0');
    const maDK = `WEB-${now.getFullYear()}${pad(now.getMonth()+1, 2)}${pad(now.getDate(), 2)}${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}${pad(now.getMilliseconds(), 3)}`;
    
    request.input('MaDK', sql.NVarChar, maDK);
    request.input('MaKhoa', sql.NVarChar, data.maKhoa);
    request.input('HoTen', sql.NVarChar, data.hoTen);
    request.input('NgaySinh', sql.NVarChar, data.ngaySinh);
    request.input('CCCD', sql.NVarChar, data.cccd);
    request.input('SoDienThoai', sql.NVarChar, data.soDienThoai);
    request.input('GiaoVien', sql.NVarChar, data.giaoVien || '');
    request.input('NguoiNop', sql.NVarChar, data.nguoiNop || '');
    request.input('TienThu', sql.NVarChar, data.tienThu || '');
    request.input('HinhThucThu', sql.NVarChar, data.hinhThucThu || '');
    request.input('DaNop', sql.Int, data.daNop || 0);
    request.input('ConNo', sql.Int, data.conNo || 0);
    
    await request.query(`
      INSERT INTO App_HocVien_V2 (MaDK, MaKhoa, HoTen, NgaySinh, CCCD, SDT, GiaoVien, NguoiNop, TienThu, HinhThucThu, NgayNhap, DaNop, ConNo)
      VALUES (@MaDK, @MaKhoa, @HoTen, @NgaySinh, @CCCD, @SoDienThoai, @GiaoVien, @NguoiNop, @TienThu, @HinhThucThu, GETDATE(), @DaNop, @ConNo)
    `);
    
    // Auto change status if it is currently 'Mới tạo'
    await request.query(`
      UPDATE App_Khoa 
      SET TinhTrang = N'Đang tuyển sinh' 
      WHERE MaKhoa = @MaKhoa AND TinhTrang = N'Mới tạo'
    `);
    
    // pool.close(); // Managed by db.ts
    
    revalidatePath('/courses');
    revalidatePath('/admissions/moto');
    revalidatePath('/admissions/oto');
    revalidatePath('/admissions/list');
    
    return { success: true };
  } catch (err: any) {
    console.error("Error adding student:", err);
    return { success: false, error: err.message };
  }
}

export async function getNewlyCreatedCourses() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        k.MaKhoa as id,
        ISNULL(a.TenKhoa, k.MaKhoa) as name,
        a.Hang as hangXe,
        (SELECT COUNT(*) FROM App_HocVien_V2 h WHERE h.MaKhoa = k.MaKhoa) as soHocVienDaNhap,
        ISNULL(a.LuuLuong, 0) as luuLuong,
        k.NgayHoc as khaiGiang,
        k.NgayKt as beGiang,
        ISNULL(a.NgaySatHach, '') as satHach,
        ISNULL(a.TinhTrang, N'Mới tạo') as status,
        a.TrungTam
      FROM App_DieuChinh_Khoa k
      LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
      WHERE a.TinhTrang IN (N'Mới tạo', N'Đang tuyển sinh')
    `);
    // pool.close(); // Managed by db.ts
    
    const today = new Date().getTime();
    
    const parseDate = (dateStr: string) => {
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
    };

    return result.recordset.map(r => ({
      id: r.id,
      name: r.name,
      hangXe: r.hangXe,
      soHocVienDaNhap: r.soHocVienDaNhap || 0,
      luuLuong: r.luuLuong,
      khaiGiang: r.khaiGiang,
      status: r.status,
      trungTam: r.TrungTam || 'Đại Phát',
      // Calculate distance for sorting
      distance: parseDate(r.khaiGiang) ? Math.abs(parseDate(r.khaiGiang)!.getTime() - today) : Infinity
    })).sort((a, b) => a.distance - b.distance);
  } catch (err) {
    console.error("Error fetching newly created courses:", err);
    return [];
  }
}

export async function submitCourseForApproval(maKhoa: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        UPDATE App_Khoa 
        SET TinhTrang = N'Chờ duyệt' 
        WHERE MaKhoa = @MaKhoa
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/admissions/list');
    revalidatePath('/admissions/approval');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPendingApprovalCourses() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        k.MaKhoa as id,
        ISNULL(a.TenKhoa, k.MaKhoa) as name,
        a.Hang as hangXe,
        (SELECT COUNT(*) FROM App_HocVien_V2 h WHERE h.MaKhoa = k.MaKhoa) as soHocVienDaNhap,
        ISNULL(a.LuuLuong, 0) as luuLuong,
        k.NgayHoc as khaiGiang,
        k.NgayKt as beGiang,
        ISNULL(a.NgaySatHach, '') as satHach,
        ISNULL(a.TinhTrang, N'Chờ duyệt') as status,
        ISNULL(a.TrungTam, N'Đại Phát') as trungTam,
        ISNULL(a.DuyetXe, 0) as duyetXe,
        ISNULL(a.DuyetGV, 0) as duyetGV,
        ISNULL(a.DuyetHoSo, 0) as duyetHoSo
      FROM App_DieuChinh_Khoa k
      LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
      WHERE a.TinhTrang = N'Chờ duyệt'
      ORDER BY k.NgayHoc ASC
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      id: r.id,
      name: r.name,
      hangXe: r.hangXe,
      soHocVienDaNhap: r.soHocVienDaNhap || 0,
      luuLuong: r.luuLuong,
      khaiGiang: r.khaiGiang,
      status: r.status,
      trungTam: r.trungTam,
      duyetXe: r.duyetXe,
      duyetGV: r.duyetGV,
      duyetHoSo: r.duyetHoSo
    }));
  } catch (err) {
    console.error("Error fetching pending courses:", err);
    return [];
  }
}

export async function approveCourse(maKhoa: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Kiểm tra đã duyệt 3 bước chưa (nếu là ô tô), hoặc 1 bước (hồ sơ) nếu là mô tô
    const checkRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT ISNULL(Hang, '') as hangXe, ISNULL(DuyetXe, 0) as dx, ISNULL(DuyetGV, 0) as dg, ISNULL(DuyetHoSo, 0) as dh 
        FROM App_Khoa WHERE MaKhoa = @MaKhoa
      `);
      
    if (checkRes.recordset.length > 0) {
      const { hangXe, dx, dg, dh } = checkRes.recordset[0];
      const isMoto = hangXe === 'A' || hangXe === 'A1';
      
      if (isMoto) {
        if (!dh) {
          throw new Error("Vui lòng duyệt Hồ sơ trước khi mở khóa.");
        }
      } else {
        if (!dx || !dg || !dh) {
          throw new Error("Vui lòng duyệt đầy đủ Xe, Giáo viên và Hồ sơ trước khi mở khóa.");
        }
      }
    }

    await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        UPDATE App_Khoa 
        SET TinhTrang = N'Đang đào tạo' 
        WHERE MaKhoa = @MaKhoa
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/admissions/approval');
    revalidatePath('/courses');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getApprovalDetails(maKhoa: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Get course info & flags
    const courseRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT 
          k.MaKhoa as id,
          ISNULL(a.TenKhoa, k.MaKhoa) as name,
          a.Hang as hangXe,
          k.NgayHoc as khaiGiang,
          ISNULL(a.DuyetXe, 0) as duyetXe,
          ISNULL(a.DuyetGV, 0) as duyetGV,
          ISNULL(a.DuyetHoSo, 0) as duyetHoSo
        FROM App_DieuChinh_Khoa k
        LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
        WHERE k.MaKhoa = @MaKhoa
      `);
      
    const course = courseRes.recordset[0] || null;

    // Get cars
    const carsRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT x.BienSo, x.HangXe, x.HanGPTL
        FROM App_PhanCong_Xe px
        JOIN App_PhuongTien x ON px.BienSoXe = x.BienSo
        WHERE px.MaKhoa = @MaKhoa
      `);
    const cars = carsRes.recordset.map(r => ({
      bienSo: r.BienSo,
      hangXe: r.HangXe,
      hanGPTL: r.HanGPTL
    }));

    // Get teachers
    const teachersRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT g.HoTen, g.HangGPLX, g.HanGPLX
        FROM App_PhanCong_GV pg
        JOIN App_GiaoVien g ON pg.MaGV = CAST(g.Id AS NVARCHAR)
        WHERE pg.MaKhoa = @MaKhoa
      `);
    const teachers = teachersRes.recordset.map(r => ({
      hoTen: r.HoTen,
      hangGPLX: r.HangGPLX,
      hanGPLX: r.HanGPLX
    }));

    // Get students
    const studentsRes = await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        SELECT MaDK, HoTen, CCCD, SDT, NguoiNop
        FROM App_HocVien_V2
        WHERE MaKhoa = @MaKhoa
      `);
    const students = studentsRes.recordset.map(r => ({
      maDK: r.MaDK,
      hoTen: r.HoTen,
      cccd: r.CCCD,
      sdt: r.SDT,
      nguoiNop: r.NguoiNop
    }));

    // pool.close(); // Managed by db.ts
    return { course, cars, teachers, students };
  } catch (err) {
    console.error("Error getApprovalDetails:", err);
    return { course: null, cars: [], teachers: [], students: [] };
  }
}

export async function updateSubApproval(maKhoa: string, type: 'XE' | 'GV' | 'HOSO') {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    let col = 'DuyetXe';
    if (type === 'GV') col = 'DuyetGV';
    if (type === 'HOSO') col = 'DuyetHoSo';

    await pool.request()
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .query(`
        UPDATE App_Khoa 
        SET ${col} = 1 
        WHERE MaKhoa = @MaKhoa
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath(`/admissions/approval/${maKhoa}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getApprovedCourses() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        k.MaKhoa as id,
        ISNULL(a.TenKhoa, k.MaKhoa) as name,
        a.Hang as hangXe,
        k.NgayHoc as khaiGiang,
        ISNULL(a.TrungTam, N'Đại Phát') as trungTam
      FROM App_DieuChinh_Khoa k
      LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
      WHERE a.TinhTrang = N'Đang đào tạo'
      ORDER BY k.NgayHoc DESC
    `);
    // pool.close(); // Managed by db.ts
    
    return result.recordset.map(r => ({
      id: r.id,
      name: r.name,
      hangXe: r.hangXe,
      khaiGiang: r.khaiGiang,
      trungTam: r.trungTam,
      type: (r.hangXe === 'A' || r.hangXe === 'A1') ? 'MOTO' : 'OTO'
    }));
  } catch (err) {
    console.error("Error fetching approved courses:", err);
    return [];
  }
}
