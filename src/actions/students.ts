"use server";

import sql from "mssql";

const dbConfig = {
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER_NAME?.split(',')[0] || '',
  port: parseInt(process.env.SQL_SERVER_NAME?.split(',')[1] || '1433'),
  options: { encrypt: false, trustServerCertificate: true }
};

export type StudentData = {
  MaDK: string;
  HoTen: string;
  NgaySinh: string;
  CCCD: string;
  MaKhoa: string;
  
  // Progress columns
  KT_XangDau: string | null;
  DT_LT: number | null;
  TN_SH: string | null;
  DT_Cabin: number | null;
  DT_DAT: number | null;
  DT_KT5M: number | null;
  TN_DT: string | null;
  SH_KetQua: string | null;
  
  // Moto columns
  HS_HopDong: number | null;
  HS_KyTen: number | null;
  HS_DiemDanhLT: number | null;
  HS_ThanhLy: number | null;
};

export async function updateStudentField(maDK: string, field: string, value: any) {
  try {
    const pool = await sql.connect(dbConfig);
    const validFields = [
      'KT_XangDau', 'DT_LT', 'TN_SH', 'DT_Cabin', 'DT_DAT', 
      'DT_KT5M', 'TN_DT', 'SH_KetQua', 
      'HS_HopDong', 'HS_KyTen', 'HS_DiemDanhLT'
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

    await request.query(`UPDATE dp_system.dbo.App_HocVien_V2 SET ${field} = @val WHERE MaDK = @maDK`);
    pool.close();
    return { success: true };
  } catch (err) {
    console.error("Error updating student:", err);
    return { success: false, error: String(err) };
  }
}

export async function getStudents(page = 1, pageSize = 100, course = "", search = "", category = "") {
  try {
    const pool = await sql.connect(dbConfig);
    
    let baseQuery = `FROM dp_system.dbo.App_HocVien_V2 WHERE 1=1`;
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
          AND KT_XangDau = '1' AND DT_LT = 1 AND TN_SH = '1' AND DT_Cabin = 1 AND DT_DAT = 1 
          AND DT_KT5M >= 5 AND TN_DT = N'Đậu' AND SH_KetQua = N'Đậu'
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
        HS_HopDong, HS_KyTen, HS_DiemDanhLT, HS_ThanhLy
      ${baseQuery}
      ORDER BY HoTen ASC
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;
    
    const result = await request.query(dataQuery);
    pool.close();
    
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
    const pool = await sql.connect(dbConfig);
    const result = await pool.query(`
      SELECT DISTINCT MaKhoa 
      FROM dp_system.dbo.App_HocVien_V2 
      WHERE MaKhoa IS NOT NULL 
      ORDER BY MaKhoa ASC
    `);
    pool.close();
    return result.recordset.map(r => r.MaKhoa).filter(c => c && c.trim() !== '');
  } catch (err) {
    console.error("Error fetching courses:", err);
    return [];
  }
}
