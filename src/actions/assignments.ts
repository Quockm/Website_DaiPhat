'use server';

import { getDbConnection } from '@/lib/db';
import sql from 'mssql';

export type AssignmentCourse = {
  id: string;
  name: string;
  hv: number;
  type: string;
  trungTam?: string;
};

export type AssignmentTeacher = {
  id: string;
  name: string;
  type: string;
  khoas: string[];
  trungTam: string;
};

export type AssignmentCar = {
  id: string; // BienSo
  type: string; // HangXe
  khoas: string[];
  trungTam: string;
};

export async function getAssignmentData() {
  try {
    const poolGplx = await getDbConnection('gplx_csdt');
    const poolDp = await getDbConnection('dp_system');
    
    // 1. Get Courses from gplx_csdt
    const coursesResult = await poolGplx.request().query(`
      SELECT 
        kh.MaKH,
        LTRIM(RTRIM(kh.MaKH)) AS MaKhoa,
        kh.TenKH, 
        ISNULL(kh.TongSoHV, 0) AS SlHv,
        ISNULL(hd.TenHangDT, kh.HangGPLX) AS HangXe
      FROM KhoaHoc kh
      LEFT JOIN DM_HangDT hd ON kh.HangDT = hd.MaHangDT
      WHERE (kh.NgayBG >= GETDATE() OR kh.NgayBG IS NULL) 
        AND (ISNULL(hd.TenHangDT, kh.HangGPLX) NOT LIKE '%A%') -- Exclude Moto
      ORDER BY kh.NgayKG DESC
    `);
    
    // 2. Override HV with accurate counts from dp_system and get TrungTam
    const dpData = await poolDp.request().query(`
      SELECT k.MaKhoa, k.TrungTam, 
             (SELECT COUNT(*) FROM App_HocVien_V2 hv WHERE hv.MaKhoa = k.MaKhoa) as cnt 
      FROM App_Khoa k
    `);
    const dpMap = new Map<string, {cnt: number, trungTam: string}>();
    dpData.recordset.forEach(r => dpMap.set(r.MaKhoa, {cnt: r.cnt, trungTam: r.TrungTam}));
    
    const courses: AssignmentCourse[] = coursesResult.recordset.map(row => ({
      id: row.MaKhoa, // using the trimmed one
      name: row.TenKH,
      hv: dpMap.get(row.MaKhoa)?.cnt || dpMap.get(row.MaKH)?.cnt || row.SlHv,
      type: row.HangXe || 'UNKNOWN',
      trungTam: dpMap.get(row.MaKhoa)?.trungTam || dpMap.get(row.MaKH)?.trungTam || 'Đại Phát'
    }));

    // 3. Get Teachers
    const teachersResult = await poolDp.request().query(`
      SELECT STT as Id, HoTen, HangGPLX, Khoa, TrungTam 
      FROM App_GiaoVien 
      WHERE HoTen IS NOT NULL AND HoTen != ''
      ORDER BY HoTen
    `);
    const teachers: AssignmentTeacher[] = teachersResult.recordset.map(row => ({
      id: row.Id ? row.Id.toString() : row.HoTen, // using name as fallback if Id is empty
      name: row.HoTen,
      type: row.HangGPLX || 'N/A',
      khoas: row.Khoa ? row.Khoa.toString().split(',').map((k: string) => k.trim()).filter((k: string) => k) : [],
      trungTam: row.TrungTam || 'Đại Phát'
    }));

    // 4. Get Cars
    const carsResult = await poolDp.request().query(`
      SELECT BienSo, HangXe, DangDiKhoa, TrungTam 
      FROM App_PhuongTien 
      WHERE BienSo IS NOT NULL AND BienSo != ''
      ORDER BY BienSo
    `);
    const cars: AssignmentCar[] = carsResult.recordset.map(row => ({
      id: row.BienSo,
      type: row.HangXe || 'N/A',
      khoas: row.DangDiKhoa ? row.DangDiKhoa.toString().split(',').map((k: string) => k.trim()).filter((k: string) => k) : [],
      trungTam: row.TrungTam || 'Đại Phát'
    }));

    return { courses, teachers, cars };
  } catch (error) {
    console.error('Error fetching assignment data:', error);
    throw new Error('Could not fetch assignment data');
  }
}

export async function saveAssignment(courseId: string, teacherIds: string[], carIds: string[]) {
  const poolDp = await getDbConnection('dp_system');
  const transaction = new sql.Transaction(poolDp);
  await transaction.begin();

  try {
    // Process Teachers
    // First, get all teachers
    const allTeachers = await new sql.Request(transaction).query("SELECT STT as Id, HoTen, Khoa FROM App_GiaoVien");

    for (const row of allTeachers.recordset) {
      const id = row.Id ? row.Id.toString() : row.HoTen;
      let khoas = row.Khoa ? row.Khoa.toString().split(',').map((k: string) => k.trim()).filter((k: string) => k) : [];

      const isSelected = teacherIds.includes(id);
      const hasCourse = khoas.includes(courseId);

      let changed = false;
      if (isSelected && !hasCourse) {
        khoas.push(courseId);
        changed = true;
      } else if (!isSelected && hasCourse) {
        khoas = khoas.filter((k: string) => k !== courseId);
        changed = true;
      }

      if (changed) {
        const newKhoaStr = khoas.join(', ');
        await new sql.Request(transaction)
          .input('khoa', sql.NVarChar, newKhoaStr)
          .input('hoten', sql.NVarChar, row.HoTen)
          .query("UPDATE App_GiaoVien SET Khoa = @khoa WHERE HoTen = @hoten");
      }
    }

    // Process Cars
    const allCars = await new sql.Request(transaction).query("SELECT BienSo, DangDiKhoa FROM App_PhuongTien");

    for (const row of allCars.recordset) {
      const id = row.BienSo;
      let khoas = row.DangDiKhoa ? row.DangDiKhoa.toString().split(',').map((k: string) => k.trim()).filter((k: string) => k) : [];

      const isSelected = carIds.includes(id);
      const hasCourse = khoas.includes(courseId);

      let changed = false;
      if (isSelected && !hasCourse) {
        khoas.push(courseId);
        changed = true;
      } else if (!isSelected && hasCourse) {
        khoas = khoas.filter((k: string) => k !== courseId);
        changed = true;
      }

      if (changed) {
        const newKhoaStr = khoas.join(', ');
        await new sql.Request(transaction)
          .input('khoa', sql.NVarChar, newKhoaStr)
          .input('bienso', sql.NVarChar, id)
          .query("UPDATE App_PhuongTien SET DangDiKhoa = @khoa WHERE BienSo = @bienso");
      }
    }

    await transaction.commit();
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    console.error('Error saving assignment:', error);
    throw new Error('Could not save assignment');
  }
}
