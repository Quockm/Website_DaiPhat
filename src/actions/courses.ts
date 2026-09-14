"use server";

import { revalidatePath } from 'next/cache';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

export async function getConfigRates() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query("SELECT Hang, SoHocVienTrenXe FROM App_CauHinh_Khoa");
    // pool.close(); // Managed by db.ts
    
    const rates: Record<string, number> = {};
    for (const row of result.recordset) {
      rates[row.Hang] = row.SoHocVienTrenXe;
    }
    return rates;
  } catch (err) {
    console.error("Error fetching config rates:", err);
    return {};
  }
}

export async function getAvailableResources(hangKhoa: string, ngayKhaiGiang?: string, ngayBeGiang?: string, trungTam: string = 'Đại Phát') {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Fetch all cars
    const carsResult = await pool.request()
      .input('TrungTam', sql.NVarChar, trungTam)
      .query(`
      SELECT x.BienSo, x.HangXe, x.ChuXe, x.HanDangKiem, x.HanGPTL, x.HanPhiDAT, x.TrungTam,
             (SELECT TOP 1 k.TenKhoa 
              FROM App_PhanCong_Xe px 
              JOIN App_Khoa k ON px.MaKhoa = k.MaKhoa 
              WHERE px.BienSoXe = x.BienSo AND k.TinhTrang = N'Đang hoạt động') as ActiveCourseName
      FROM App_PhuongTien x
      WHERE ISNULL(x.TrungTam, N'Đại Phát') = @TrungTam
    `);
    
    // Fetch all teachers
    const teachersResult = await pool.request()
      .input('TrungTam', sql.NVarChar, trungTam)
      .query(`
      SELECT g.Id, g.HoTen, g.HangGPLX, g.HanGPLX, g.SDT, g.TrungTam,
             (SELECT TOP 1 k.TenKhoa 
              FROM App_PhanCong_GV pg 
              JOIN App_Khoa k ON pg.MaKhoa = k.MaKhoa 
              WHERE pg.MaGV = CAST(g.Id AS NVARCHAR) AND k.TinhTrang = N'Đang hoạt động') as ActiveCourseName
      FROM App_GiaoVien g
      WHERE ISNULL(g.TrungTam, N'Đại Phát') = @TrungTam
    `);
    
    // pool.close(); // Managed by db.ts
    
    return {
      cars: carsResult.recordset.map(c => ({
        ...c,
        isCompatible: checkCarCompatibility(hangKhoa, c.HangXe)
      })),
      teachers: teachersResult.recordset
    };
  } catch (err) {
    console.error("Error fetching resources:", err);
    return { cars: [], teachers: [] };
  }
}

function checkCarCompatibility(courseHang: string, carHang: string) {
  if (!carHang) return true;
  const cH = carHang.trim().toUpperCase();
  const cCourse = courseHang.trim().toUpperCase();
  
  // exact match
  if (cH === cCourse) return true;
  
  // B-SS maps to B2 cars
  if (cCourse === 'B-SS' && (cH === 'B (SS)' || cH === 'B SS' || cH === 'B2' || cH === 'B-SS')) return true;
  // B-TD maps to B1 cars
  if (cCourse === 'B-TD' && (cH === 'B (STD)' || cH === 'B TD' || cH === 'B1' || cH === 'B11' || cH === 'B-TD')) return true;
  
  return false;
}

export async function createCourse(data: {
  MaKhoa: string;
  TenKhoa: string;
  Hang: string;
  NgayKhaiGiang: string;
  NgayBeGiang: string;
  NgayTotNghiep: string;
  NgaySatHach: string;
  TrungTam: string;
  LuuLuong: number;
  cars: string[];
  teachers: number[];
  TongNgay?: string;
  LtBD?: string;
  LtKT?: string;
  ShBD?: string;
  ShKT?: string;
  CbBD?: string;
  CbKT?: string;
  DatBD?: string;
  DatKT?: string;
  GhiChu?: string;
}) {
  const formatToDMY = (dateStr: string | undefined) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      const request = new sql.Request(transaction);
      
      // 1. Insert App_Khoa
      request.input('MaKhoa', sql.NVarChar, data.MaKhoa);
      request.input('TenKhoa', sql.NVarChar, data.TenKhoa);
      request.input('Hang', sql.NVarChar, data.Hang);
      request.input('LuuLuong', sql.Int, data.LuuLuong);
      request.input('NgayKhaiGiang', sql.NVarChar, formatToDMY(data.NgayKhaiGiang));
      request.input('NgayBeGiang', sql.NVarChar, formatToDMY(data.NgayBeGiang));
      request.input('NgayTotNghiep', sql.NVarChar, formatToDMY(data.NgayTotNghiep));
      request.input('NgaySatHach', sql.NVarChar, formatToDMY(data.NgaySatHach));
      request.input('TrungTam', sql.NVarChar, data.TrungTam || 'Đại Phát');
      request.input('GhiChu', sql.NVarChar, data.GhiChu || '');
      
      await request.query(`
        INSERT INTO App_Khoa (MaKhoa, TenKhoa, Hang, LuuLuong, NgayKhaiGiang, NgayBeGiang, NgayTotNghiep, NgaySatHach, TinhTrang, TrungTam, GhiChu, CreatedAt)
        VALUES (@MaKhoa, @TenKhoa, @Hang, @LuuLuong, @NgayKhaiGiang, @NgayBeGiang, @NgayTotNghiep, @NgaySatHach, N'Mới tạo', @TrungTam, @GhiChu, GETDATE())
      `);
      
      // 2. Insert App_DieuChinh_Khoa (Schedule details)
      request.input('TongNgay', sql.NVarChar, data.TongNgay || '');
      request.input('LtBD', sql.NVarChar, formatToDMY(data.LtBD));
      request.input('LtKT', sql.NVarChar, formatToDMY(data.LtKT));
      request.input('ShBD', sql.NVarChar, formatToDMY(data.ShBD));
      request.input('ShKT', sql.NVarChar, formatToDMY(data.ShKT));
      request.input('CbBD', sql.NVarChar, formatToDMY(data.CbBD));
      request.input('CbKT', sql.NVarChar, formatToDMY(data.CbKT));
      request.input('DatBD', sql.NVarChar, formatToDMY(data.DatBD));
      request.input('DatKT', sql.NVarChar, formatToDMY(data.DatKT));
      
      await request.query(`
        INSERT INTO App_DieuChinh_Khoa (MaKhoa, NgayHoc, NgayKt, TongNgay, LtBD, LtKT, ShBD, ShKT, CbBD, CbKT, DatBD, DatKT)
        VALUES (@MaKhoa, @NgayKhaiGiang, @NgayBeGiang, @TongNgay, @LtBD, @LtKT, @ShBD, @ShKT, @CbBD, @CbKT, @DatBD, @DatKT)
      `);
      
      // 3. Insert App_PhanCong_Xe
      for (const car of data.cars) {
        const carReq = new sql.Request(transaction);
        carReq.input('MaKhoa', sql.NVarChar, data.MaKhoa);
        carReq.input('BienSoXe', sql.NVarChar, car);
        await carReq.query(`INSERT INTO App_PhanCong_Xe (MaKhoa, BienSoXe) VALUES (@MaKhoa, @BienSoXe)`);
      }
      
      // 4. Insert App_PhanCong_GV
      for (const gv of data.teachers) {
        const gvReq = new sql.Request(transaction);
        gvReq.input('MaKhoa', sql.NVarChar, data.MaKhoa);
        gvReq.input('MaGV', sql.NVarChar, gv.toString());
        await gvReq.query(`INSERT INTO App_PhanCong_GV (MaKhoa, MaGV) VALUES (@MaKhoa, @MaGV)`);
      }
      await transaction.commit();
      // pool.close(); // Managed by db.ts
      revalidatePath('/courses');
      return { success: true, hang: data.Hang };
    } catch (err) {
      await transaction.rollback();
      // pool.close(); // Managed by db.ts
      throw err;
    }
  } catch (err: any) {
    console.error("Error creating course:", err);
    return { success: false, error: err.message };
  }
}

function parseDateStr(dateStr: string | null | undefined): number | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // dd-mm-yyyy
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
  }
  return null;
}

function determineCourseStatus(r: any): string {
  const now = new Date().getTime();
  
  const inRange = (bd: string | null, kt: string | null) => {
    const start = parseDateStr(bd);
    const end = parseDateStr(kt);
    if (!start || !end) return false;
    const endOfDay = end + 24 * 60 * 60 * 1000 - 1;
    return now >= start && now <= endOfDay;
  };

  const isLt = inRange(r.LtBD, r.LtKT);
  const isCb = inRange(r.CbBD, r.CbKT);
  const isDat = inRange(r.DatBD, r.DatKT);
  const isSh = inRange(r.ShBD, r.ShKT);

  const statuses: string[] = [];
  if (isLt) statuses.push("Lý thuyết");
  if (isCb) statuses.push("Cabin");
  if (isDat) statuses.push("DAT");
  if (isSh) statuses.push("Sa hình");

  if (statuses.length > 0) {
    return "Đang học " + statuses.join(" & ");
  }

  const khaiGiang = parseDateStr(r.khaiGiang);
  const beGiang = parseDateStr(r.beGiang);
  
  if (khaiGiang && now < khaiGiang) {
    return "Chưa khai giảng";
  }
  
  if (beGiang && now > (beGiang + 24 * 60 * 60 * 1000 - 1)) {
    return "Đã bế giảng";
  }

  return r.status;
}

export async function getCourses() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        k.MaKhoa as id,
        ISNULL(a.TenKhoa, k.MaKhoa) as name,
        a.Hang as hangXe,
        (SELECT COUNT(*) FROM App_PhanCong_Xe x WHERE x.MaKhoa = k.MaKhoa) as xe,
        (SELECT COUNT(*) FROM App_PhanCong_GV g WHERE g.MaKhoa = k.MaKhoa) as gv,
        (SELECT COUNT(*) FROM App_HocVien_V2 h WHERE h.MaKhoa = k.MaKhoa) as soHocVienDaNhap,
        ISNULL(a.LuuLuong, 0) as hv,
        k.NgayHoc as khaiGiang,
        k.NgayKt as beGiang,
        ISNULL(a.NgaySatHach, '') as satHach,
        ISNULL(a.TinhTrang, N'Đang hoạt động') as status,
        CASE 
          WHEN a.Hang IN ('A1', 'A') THEN 'MOTO'
          ELSE 'OTO'
        END as type,
        k.LtBD, k.LtKT,
        k.ShBD, k.ShKT,
        k.CbBD, k.CbKT,
        k.DatBD, k.DatKT,
        ISNULL(a.TrungTam, N'Đại Phát') as TrungTam
      FROM App_DieuChinh_Khoa k
      LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
      WHERE ISNULL(a.TinhTrang, N'Đang hoạt động') NOT IN (N'Mới tạo', N'Chờ duyệt')
    `);
    
    // pool.close(); // Managed by db.ts
    
    return result.recordset.map(r => ({
      id: r.id,
      name: r.name,
      hangXe: r.hangXe,
      xe: r.xe,
      gv: r.gv || 0,
      hv: r.hv,
      soHocVienDaNhap: r.soHocVienDaNhap || 0,
      khaiGiang: r.khaiGiang,
      beGiang: r.beGiang,
      satHach: r.satHach,
      status: determineCourseStatus(r),
      type: r.type,
      lt: { bd: r.LtBD || '', kt: r.LtKT || '' },
      sh: { bd: r.ShBD || '', kt: r.ShKT || '' },
      cb: { bd: r.CbBD || '', kt: r.CbKT || '' },
      dat: { bd: r.DatBD || '', kt: r.DatKT || '' },
      trungTam: r.TrungTam,
    }));
  } catch (err) {
    console.error("Error fetching courses:", err);
    return [];
  }
}

export async function getCourseDetails(courseId: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Fetch course details
    const courseResult = await pool.request()
      .input('MaKhoa', sql.NVarChar, courseId)
      .query(`
        SELECT 
          k.MaKhoa as MaKH,
          ISNULL(a.TenKhoa, k.MaKhoa) as TenKH,
          a.Hang as HangXe,
          k.NgayHoc as KhaiGiang
        FROM App_DieuChinh_Khoa k
        LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
        WHERE k.MaKhoa = @MaKhoa
      `);
      
    if (courseResult.recordset.length === 0) return null;
    
    const course = courseResult.recordset[0];

    // Fetch teachers, cars and students in parallel (independent queries)
    const [teachersResult, carsResult, studentsResult] = await Promise.all([
      pool.request()
        .input('MaKhoa', sql.NVarChar, courseId)
        .query(`
          SELECT g.Id, g.HoTen, g.NgaySinh, g.CCCD, g.HangGPLX, g.SDT, g.HanGPLX
          FROM App_PhanCong_GV pg
          JOIN App_GiaoVien g ON pg.MaGV = CAST(g.Id AS VARCHAR)
          WHERE pg.MaKhoa = @MaKhoa
        `),
      pool.request()
        .input('MaKhoa', sql.NVarChar, courseId)
        .query(`
          SELECT x.BienSo, x.HangXe, x.ChuXe, x.HanPhiDAT, x.HanGPTL
          FROM App_PhanCong_Xe px
          JOIN App_PhuongTien x ON px.BienSoXe = x.BienSo
          WHERE px.MaKhoa = @MaKhoa
        `),
      pool.request()
        .input('MaKhoa', sql.NVarChar, courseId)
        .query(`
          SELECT HoTen, NgaySinh, CCCD, SDT, MaDK, DauMoi
          FROM App_HocVien_V2
          WHERE MaKhoa = @MaKhoa
        `)
        .catch((e) => {
          console.error("Error fetching students for course details:", e);
          return { recordset: [] as any[] };
        }),
    ]);

    // pool.close(); // Managed by db.ts
    
    return {
      course,
      teachers: teachersResult.recordset.map(t => ({
        id: t.Id,
        name: t.HoTen,
        type: t.HangGPLX || '-',
        hanGplx: t.HanGPLX || '-'
      })),
      cars: carsResult.recordset.map(c => ({
        id: c.BienSo,
        type: c.HangXe || '-',
        hanPhiDAT: c.HanPhiDAT || '-',
        hanGpxtl: c.HanGPTL || '-'
      })),
      students: studentsResult.recordset.map(s => ({
        name: s.HoTen,
        dob: s.NgaySinh || '-',
        sdt: s.SDT || '-',
        cccd: s.CCCD || '-',
        type: course.HangXe || '-',
        maDk: s.MaDK || '-',
        dauMoi: s.DauMoi || '-'
      }))
    };
  } catch (err) {
    console.error("Error fetching course details:", err);
    return null;
  }
}

export async function getCurrentCapacity(trungTam: string = 'Đại Phát', hang: string = '') {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    let condition = "a.Hang NOT IN ('A1', 'A')"; // Default for OTO
    if (hang === 'A1') {
      condition = "a.Hang = 'A1'";
    } else if (hang === 'A') {
      condition = "a.Hang = 'A'";
    } else if (hang === 'MOTO') {
      condition = "a.Hang IN ('A1', 'A')";
    }

    const result = await pool.request()
      .input('TrungTam', sql.NVarChar, trungTam)
      .query(`
        SELECT 
          k.MaKhoa as id,
          ISNULL(a.LuuLuong, 0) as hv,
          k.NgayKt as beGiang,
          ISNULL(a.TinhTrang, N'Đang hoạt động') as status
        FROM App_Khoa a
        LEFT JOIN App_DieuChinh_Khoa k ON k.MaKhoa = a.MaKhoa
        WHERE ${condition}
        AND ISNULL(a.TrungTam, N'Đại Phát') = @TrungTam
      `);
    // pool.close(); // Managed by db.ts
    
    const now = new Date().getTime();
    
    let total = 0;
    for (const r of result.recordset) {
      let isBeGiang = false;
      if (r.status === 'Đã bế giảng') {
        isBeGiang = true;
      } else {
        const bg = parseDateStr(r.beGiang);
        if (bg && now > (bg + 24 * 60 * 60 * 1000 - 1)) {
          isBeGiang = true;
        }
      }
      
      if (!isBeGiang) {
        total += r.hv;
      }
    }
    
    return total;
  } catch (err) {
    console.error("Error fetching current capacity:", err);
    return 0;
  }
}

export async function getDashboardStats(trungTam: string = 'Đại Phát') {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const cars = await pool.request().input('TrungTam', sql.NVarChar, trungTam).query('SELECT COUNT(*) as c FROM App_PhuongTien WHERE ISNULL(TrungTam, N\'Đại Phát\') = @TrungTam');
    const teachers = await pool.request().input('TrungTam', sql.NVarChar, trungTam).query('SELECT COUNT(*) as c FROM App_GiaoVien WHERE ISNULL(TrungTam, N\'Đại Phát\') = @TrungTam');
    return {
      totalCars: cars.recordset[0].c,
      totalTeachers: teachers.recordset[0].c
    };
  } catch(e) {
    return { totalCars: 0, totalTeachers: 0 };
  }
}

