"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";

export type StudentFilterParams = {
  hangXe?: string;
  trungTam?: string;
  tinhTrang?: string;
  search?: string;
  limit?: number;
};

export async function getStudentsList(filters: StudentFilterParams) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let query = `
      SELECT TOP (@Limit)
        h.MaDK as id,
        h.HoTen,
        h.NgaySinh,
        h.CCCD,
        h.SDT as SoDienThoai,
        h.NgayNhap,
        h.GiaoVien,
        h.DauMoi,
        h.NguoiNop,
        h.TienThu,
        h.HinhThucThu,
        h.DaNop,
        h.ConNo,
        k.MaKhoa,
        ISNULL(k.TenKhoa, k.MaKhoa) as TenKhoa,
        k.Hang as hangXe,
        ISNULL(k.TrungTam, N'Đại Phát') as TrungTam,
        ISNULL(k.TinhTrang, N'Chưa khai giảng') as status
      FROM App_HocVien_V2 h
      LEFT JOIN App_Khoa k ON h.MaKhoa = k.MaKhoa
      WHERE 1=1
    `;

    request.input('Limit', sql.Int, filters.limit || 500);

    if (filters.hangXe && filters.hangXe !== 'All') {
      if (filters.hangXe === 'B1/B-TD') {
        query += ` AND k.Hang IN ('B1', 'BSTD', 'B-TD')`;
      } else if (filters.hangXe === 'B2/B-SS') {
        query += ` AND k.Hang IN ('B2', 'BSS', 'B-SS')`;
      } else {
        query += ` AND k.Hang = @HangXe`;
        request.input('HangXe', sql.NVarChar, filters.hangXe);
      }
    }

    if (filters.trungTam && filters.trungTam !== 'All') {
      query += ` AND ISNULL(k.TrungTam, N'Đại Phát') = @TrungTam`;
      request.input('TrungTam', sql.NVarChar, filters.trungTam);
    }

    if (filters.tinhTrang && filters.tinhTrang !== 'All') {
      query += ` AND ISNULL(k.TinhTrang, N'Chưa khai giảng') = @TinhTrang`;
      request.input('TinhTrang', sql.NVarChar, filters.tinhTrang);
    }

    if (filters.search) {
      query += ` AND (h.HoTen LIKE '%' + @Search + '%' OR h.CCCD LIKE '%' + @Search + '%')`;
      request.input('Search', sql.NVarChar, filters.search);
    }

    query += ` ORDER BY h.NgayNhap DESC`;

    const result = await request.query(query);

    return result.recordset.map(r => ({
      id: r.id,
      hoTen: r.HoTen,
      ngaySinh: r.NgaySinh,
      cccd: r.CCCD,
      soDienThoai: r.SoDienThoai,
      ngayNhap: r.NgayNhap,
      giaoVien: r.GiaoVien,
      dauMoi: r.DauMoi,
      nguoiNop: r.NguoiNop,
      tienThu: r.TienThu,
      hinhThucThu: r.HinhThucThu,
      daNop: r.DaNop,
      conNo: r.ConNo,
      maKhoa: r.MaKhoa,
      tenKhoa: r.TenKhoa,
      hangXe: r.hangXe,
      trungTam: r.TrungTam,
      status: r.status
    }));

  } catch (error) {
    console.error("Error fetching students list:", error);
    return [];
  }
}

export type StudentData = {
  MaDK: string;
  HoTen: string;
  NgaySinh: string;
  CCCD: string;
  MaKhoa: string;
  
  // Progress columns
  KT_XangDau: string | null;
  DT_LT_PhapLuat: string | null;
  DT_LT_KyThuat: string | null;
  DT_LT_DaoDuc: string | null;
  DT_LT_CauTao: string | null;
  DT_LT_MoPhong: string | null;
  DT_Cabin: string | null;
  DT_DAT: string | null;

  SoHopDong_Oto: string | null;
  NgayKyHD_Oto: string | null;
  SoTLHD_Oto: string | null;
  NgayKyTLHD_Oto: string | null;
  NgayThiDat_TN: string | null;
  NgayThiDat_SH: string | null;
  SoHieu_GPLX: string | null;
  SoVaoSo_GPLX: string | null;
  SoQDCap_GPLX: string | null;
  
  // Moto columns
  HS_HopDong: number | null;
  HS_KyTen: number | null;
  HS_DiemDanhLT: number | null;
  SH_KetQua: string | null;
};

export async function updateStudentField(maDK: string, field: string, value: any) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Validate field to prevent SQL injection
    const validFields = [
      'KT_XangDau', 'DT_LT_PhapLuat', 'DT_LT_KyThuat', 'DT_LT_DaoDuc', 'DT_LT_CauTao', 'DT_LT_MoPhong', 'DT_Cabin', 'DT_DAT',
      'SoHopDong_Oto', 'NgayKyHD_Oto', 'SoTLHD_Oto', 'NgayKyTLHD_Oto',
      'NgayThiDat_TN', 'NgayThiDat_SH', 'SoHieu_GPLX', 'SoVaoSo_GPLX', 'SoQDCap_GPLX',
      'HS_HopDong', 'HS_KyTen', 'HS_DiemDanhLT', 'SH_KetQua'
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

    // Kiểm tra đủ 8 file cho học viên hạng B/C
    const checkFields = ['KT_XangDau', 'DT_LT_PhapLuat', 'DT_LT_KyThuat', 'DT_LT_DaoDuc', 'DT_LT_CauTao', 'DT_LT_MoPhong', 'DT_Cabin', 'DT_DAT'];
    if (checkFields.includes(field)) {
      const studentReq = pool.request();
      studentReq.input('maDKCheck', sql.NVarChar, maDK);
      const studentRes = await studentReq.query(`
        SELECT h.CCCD, h.HoTen, h.NgaySinh, k.Hang, k.MaKhoa,
               h.KT_XangDau, h.DT_LT_PhapLuat, h.DT_LT_KyThuat, h.DT_LT_DaoDuc, h.DT_LT_CauTao, h.DT_LT_MoPhong, h.DT_Cabin, h.DT_DAT
        FROM App_HocVien_V2 h
        LEFT JOIN App_Khoa k ON h.MaKhoa = k.MaKhoa
        WHERE h.MaDK = @maDKCheck
      `);

      if (studentRes.recordset.length > 0) {
        const student = studentRes.recordset[0];
        const isAuto = student.MaKhoa && (student.MaKhoa.includes('B') || student.MaKhoa.includes('C'));

        if (isAuto && 
            student.KT_XangDau && student.DT_LT_PhapLuat && 
            student.DT_LT_KyThuat && student.DT_LT_DaoDuc && 
            student.DT_LT_CauTao && student.DT_LT_MoPhong && 
            student.DT_Cabin && student.DT_DAT) {
          
          // Học viên đã đủ 8 file, tiến hành đồng bộ qua graduation_students
          try {
            const shPool = await getDbConnection("DP_SH_System");
            const gradReq = shPool.request();
            gradReq.input('cccdGrad', sql.VarChar, student.CCCD);
            
            const gradCheck = await gradReq.query(`SELECT id FROM graduation_students WHERE cccd = @cccdGrad`);
            if (gradCheck.recordset.length > 0) {
              const updateGradReq = shPool.request();
              updateGradReq.input('cccdUpd', sql.VarChar, student.CCCD);
              await updateGradReq.query(`
                UPDATE graduation_students 
                SET has_5_pdf_lt = 1, has_file_dat = 1, has_file_mp = 1, has_xang_dau = 1, updated_at = GETDATE(), file_completion_date = CONVERT(VARCHAR(10), GETDATE(), 120)
                WHERE cccd = @cccdUpd
              `);
            } else {
              const insGradReq = shPool.request();
              insGradReq.input('cccdIns', sql.VarChar, student.CCCD || '');
              insGradReq.input('nameIns', sql.NVarChar, student.HoTen || '');
              insGradReq.input('dobIns', sql.VarChar, student.NgaySinh || '');
              insGradReq.input('hangIns', sql.VarChar, student.Hang || '');
              insGradReq.input('schoolIns', sql.NVarChar, 'Đại Phát');
              
              await insGradReq.query(`
                INSERT INTO graduation_students (cccd, name, dob, hang, school, has_5_pdf_lt, has_file_dat, has_file_mp, has_xang_dau, stt, sbd, exam_date, is_retake, file_completion_date)
                VALUES (@cccdIns, @nameIns, @dobIns, @hangIns, @schoolIns, 1, 1, 1, 1, '', '', '', 0, CONVERT(VARCHAR(10), GETDATE(), 120))
              `);
            }
          } catch (syncErr) {
            console.error("Lỗi đồng bộ sang graduation_students:", syncErr);
          }
        }
      }
    }

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
    
    if (course && course !== 'all') {
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
          AND KT_XangDau IS NOT NULL AND KT_XangDau != ''
          AND DT_LT_PhapLuat IS NOT NULL AND DT_LT_PhapLuat != ''
          AND DT_LT_KyThuat IS NOT NULL AND DT_LT_KyThuat != ''
          AND DT_LT_DaoDuc IS NOT NULL AND DT_LT_DaoDuc != ''
          AND DT_LT_CauTao IS NOT NULL AND DT_LT_CauTao != ''
          AND DT_LT_MoPhong IS NOT NULL AND DT_LT_MoPhong != ''
          AND DT_Cabin IS NOT NULL AND DT_Cabin != ''
          AND DT_DAT IS NOT NULL AND DT_DAT != ''
          THEN 1
          WHEN 
          (MaKhoa LIKE '%A%') 
          AND HS_HopDong = 1 AND HS_KyTen = 1 AND HS_DiemDanhLT = 1
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
        KT_XangDau, DT_LT_PhapLuat, DT_LT_KyThuat, DT_LT_DaoDuc, DT_LT_CauTao, DT_LT_MoPhong, DT_Cabin, DT_DAT,
        SoHopDong_Oto, NgayKyHD_Oto, SoTLHD_Oto, NgayKyTLHD_Oto, NgayThiDat_TN, NgayThiDat_SH, SoHieu_GPLX, SoVaoSo_GPLX, SoQDCap_GPLX,
        HS_HopDong, HS_KyTen, HS_DiemDanhLT, SH_KetQua
      ${baseQuery}
      ORDER BY HoTen ASC
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;
    
    const result = await request.query(dataQuery);
    
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
    return result.recordset.map(r => r.MaKhoa).filter(c => c && c.trim() !== '');
  } catch (err) {
    console.error("Error fetching courses:", err);
    return [];
  }
}
