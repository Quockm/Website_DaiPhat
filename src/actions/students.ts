"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

export type StudentData = {
  MaDK: string;
  HoTen: string;
  NgaySinh: string;
  CCCD: string;
  MaKhoa: string;
  
  // Progress columns
  KT_XangDau: string | null;
  DT_LT: string | null;
  TN_SH: string | null;
  DT_Cabin: string | null;
  DT_DAT: string | null;
  DT_KT5M: number | null;
  TN_DT: string | null;
  SH_KetQua: string | null;
  
  // New LT fields (replacing DT_LT)
  DT_LT_PhapLuat: string | null;
  DT_LT_KyThuat: string | null;
  DT_LT_DaoDuc: string | null;
  DT_LT_CauTao: string | null;
  DT_LT_MoPhong: string | null;

  // New License fields
  NgayThiDat_TN: string | null;
  NgayThiDat_SH: string | null;
  SoHieu_GPLX: string | null;
  SoVaoSo_GPLX: string | null;
  SoQDCap_GPLX: string | null;

  // New Contract fields (for Auto)
  SoHopDong_Oto: string | null;
  NgayKyHD_Oto: string | null;
  SoTLHD_Oto: string | null;
  NgayKyTLHD_Oto: string | null;
  
  // Moto columns
  HS_HopDong: number | null;
  HS_KyTen: number | null;
  HS_DiemDanhLT: number | null;
  HS_ThanhLy: number | null;
};

export async function updateStudentField(maDK: string, field: string, value: any) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const validFields = [
      'KT_XangDau', 'DT_LT', 'TN_SH', 'DT_Cabin', 'DT_DAT', 
      'DT_KT5M', 'TN_DT', 'SH_KetQua', 
      'HS_HopDong', 'HS_KyTen', 'HS_DiemDanhLT',
      'DT_LT_PhapLuat', 'DT_LT_KyThuat', 'DT_LT_DaoDuc', 'DT_LT_CauTao', 'DT_LT_MoPhong',
      'NgayThiDat_TN', 'NgayThiDat_SH', 'SoHieu_GPLX', 'SoVaoSo_GPLX', 'SoQDCap_GPLX',
      'SoHopDong_Oto', 'NgayKyHD_Oto', 'SoTLHD_Oto', 'NgayKyTLHD_Oto'
    ];
    
    if (!validFields.includes(field)) {
      throw new Error("Invalid field");
    }

    const request = pool.request();
    request.input('maDK', sql.NVarChar, maDK);
    
    if (value === null || value === '') {
      request.input('val', sql.NVarChar, null);
    } else if (typeof value === 'number') {
      request.input('val', sql.Float, value);
    } else {
      request.input('val', sql.NVarChar, String(value));
    }

    await request.query(`UPDATE App_HocVien_V2 SET ${field} = @val WHERE MaDK = @maDK`);
    // pool.close(); // Managed by db.ts
    return { success: true };
  } catch (err) {
    console.error("Error updating student:", err);
    return { success: false, error: String(err) };
  }
}

export async function getStudents(page = 1, pageSize = 100, course = "", search = "", category = "") {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    let baseQuery = `FROM App_HocVien_V2 WHERE 1=1`;
    const request = pool.request();
    
    if (course) {
      baseQuery += ` AND MaKhoa = @course`;
      request.input('course', sql.NVarChar, course);
    } else if (category) {
      if (category === 'B01') {
        baseQuery += ` AND MaKhoa LIKE '%B01%'`;
      } else if (category === 'B') {
        baseQuery += ` AND MaKhoa LIKE '%B%' AND MaKhoa NOT LIKE '%B01%'`;
      } else if (category === 'C1') {
        baseQuery += ` AND (MaKhoa LIKE '%C1%' OR MaKhoa LIKE '%C%')`;
      } else if (category === 'A1') {
        baseQuery += ` AND MaKhoa LIKE '%A1%'`;
      } else if (category === 'A') {
        baseQuery += ` AND MaKhoa LIKE '%A%' AND MaKhoa NOT LIKE '%A1%' AND MaKhoa NOT LIKE '%A2%'`;
      }
    }
    
    if (search) {
      baseQuery += ` AND (HoTen LIKE @search OR CCCD LIKE @search OR MaDK LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    
    // Stats query
    const statsQuery = `
      SELECT 
        COUNT(*) as Total,
        SUM(CASE WHEN 
          (MaKhoa LIKE '%B%' OR MaKhoa LIKE '%C%') 
          AND (KT_XangDau IS NOT NULL AND KT_XangDau != '')
          AND (DT_LT_PhapLuat IS NOT NULL AND DT_LT_PhapLuat != '')
          AND (DT_LT_KyThuat IS NOT NULL AND DT_LT_KyThuat != '')
          AND (DT_LT_DaoDuc IS NOT NULL AND DT_LT_DaoDuc != '')
          AND (DT_LT_CauTao IS NOT NULL AND DT_LT_CauTao != '')
          AND (DT_LT_MoPhong IS NOT NULL AND DT_LT_MoPhong != '')
          AND (DT_Cabin IS NOT NULL AND DT_Cabin != '')
          AND (DT_DAT IS NOT NULL AND DT_DAT != '')
          THEN 1
          WHEN 
          (MaKhoa LIKE '%A%') 
          AND HS_HopDong = 1 AND HS_KyTen = 1 AND HS_DiemDanhLT = 1 AND SH_KetQua = N'Đậu'
          THEN 1
          ELSE 0 END) as Completed
      ${baseQuery}
    `;
    
    const countResult = await request.query(statsQuery);
    const totalRecords = countResult.recordset[0].Total || 0;
    const completedRecords = countResult.recordset[0].Completed || 0;
    const incompleteRecords = totalRecords - completedRecords;
    
    const offset = (page - 1) * pageSize;
    
    const dataQuery = `
      SELECT 
        MaDK, HoTen, NgaySinh, CCCD, MaKhoa,
        KT_XangDau, DT_LT, TN_SH, DT_Cabin, DT_DAT, DT_KT5M, TN_DT, SH_KetQua,
        DT_LT_PhapLuat, DT_LT_KyThuat, DT_LT_DaoDuc, DT_LT_CauTao, DT_LT_MoPhong,
        NgayThiDat_TN, NgayThiDat_SH, SoHieu_GPLX, SoVaoSo_GPLX, SoQDCap_GPLX,
        SoHopDong_Oto, NgayKyHD_Oto, SoTLHD_Oto, NgayKyTLHD_Oto,
        HS_HopDong, HS_KyTen, HS_DiemDanhLT, HS_ThanhLy
      ${baseQuery}
      ORDER BY HoTen ASC
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;
    
    const result = await request.query(dataQuery);
    // pool.close(); // Managed by db.ts
    
    return {
      data: result.recordset as StudentData[],
      totalRecords,
      completedRecords,
      incompleteRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page
    };
  } catch (err) {
    console.error("Error fetching students:", err);
    return { data: [], totalRecords: 0, completedRecords: 0, incompleteRecords: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getCourseList() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT DISTINCT MaKhoa 
      FROM App_HocVien_V2 
      WHERE MaKhoa IS NOT NULL 
      ORDER BY MaKhoa ASC
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => r.MaKhoa).filter(c => c && c.trim() !== '');
  } catch (err) {
    console.error("Error fetching courses:", err);
    return [];
  }
}

export async function getCoursesWithCategory() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT MaKhoa, Hang
      FROM App_Khoa
      WHERE MaKhoa IS NOT NULL
      ORDER BY MaKhoa ASC
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset;
  } catch (err) {
    console.error("Error fetching courses with category:", err);
    return [];
  }
}

export async function getCourseInfo(courseCode: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('courseCode', sql.NVarChar, courseCode);
    const result = await request.query(`
      SELECT TOP 1 *
      FROM dp_system.dbo.App_KhoaHoc
      WHERE ma_khoa = @courseCode OR ma_khoa LIKE '%' + @courseCode + '%'
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (err) {
    console.error("Error fetching course info:", err);
    return null;
  }
}

export async function getAppKhoaInfo(courseCode: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('courseCode', sql.NVarChar, courseCode);
    const result = await request.query(`
      SELECT TOP 1 *
      FROM App_Khoa
      WHERE MaKhoa = @courseCode
    `);
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (err) {
    console.error("Error fetching App_Khoa info:", err);
    return null;
  }
}
