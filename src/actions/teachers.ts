"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from "next/cache";

export type TeacherData = {
  NoiDKKCB?: string;
  TinhTrangBHXH?: boolean;
  Id: number;
  STT: number;
  HoTen: string;
  NgaySinh: string | null;
  CCCD: string | null;
  TrinhDo: string | null;
  HangGPLX: string | null;
  HangGVTH: string | null;
  SDT: string | null;
  NguoiPhuTrach: string | null;
  HanGPLX: string | null;
  Avatar: string | null;
  TrungTam: string | null;
  UploadedDocs?: number;
  
  BanGiaoCCCD?: boolean;
  BanGiaoGPLX?: boolean;
  BanGiaoBangTN?: boolean;
  BanGiaoNVSP?: boolean;
  BanGiaoGVTH?: boolean;
  TrangThaiBanGiaoGV?: string | null;
  NgayBanGiaoGV?: string | null;
  NhanSuXacNhanGV?: boolean;
  
  DonXinViec_HR?: boolean;
  SoYeuLyLich_HR?: boolean;
  HopDongLaoDong_HR?: boolean;
  GiayKhamSucKhoe_HR?: boolean;
  BangTotNghiep_HR?: boolean;
  LoaiNhanSu?: string | null;
  
  // New HR & Training fields
  NhomGiaoVien?: string | null;
  HanCCCD?: string | null;
  TinhTrangHanCCCD?: string | null;
  HinhThucTuyenDung?: string | null;
  LoaiHopDong?: string | null;
  SoHopDong?: string | null;
  NgayBaoTangBHXH?: string | null;
  SoBHXH?: string | null;
  TrinhDoVanHoa?: string | null;
  TrinhDoChuyenMon?: string | null;
  TrinhDoSuPham?: string | null;
  BacNVSP?: string | null;
  NgayTrungTuyenGPLX?: string | null;
  TinhTrangHanGPLX?: string | null;
  HangGiaoVien?: string | null;
  HanSucKhoe?: string | null;
  TrangThaiBHXH?: string | null;
  NoiSinh?: string | null;
  DiaChiThuongTru?: string | null;
  NoiDangKyKhamChuaBenh?: string | null;
  MaSoThue?: string | null;
};

export async function getTeachers(page = 1, pageSize = 50, search = "", category = "", docStatus = "", trungTam = "Đại Phát", loaiNhanSu = "Giáo viên", handoverOnly = false) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Đếm tổng số
    const countRequest = pool.request();
    countRequest.input('Search', sql.NVarChar, `%${search}%`);
    countRequest.input('TrungTam', sql.NVarChar, trungTam);
    countRequest.input('LoaiNhanSu', sql.NVarChar, loaiNhanSu);
    let baseQuery = `
      FROM dp_system.dbo.App_GiaoVien g
      LEFT JOIN (
        SELECT GiaoVienId, COUNT(DISTINCT LoaiHoSo) as DocCount
        FROM dp_system.dbo.App_GiaoVien_HoSo
        WHERE LoaiHoSo != 'Avatar'
        GROUP BY GiaoVienId
      ) H ON g.Id = H.GiaoVienId
      WHERE ISNULL(g.TrungTam, N'Đại Phát') = @TrungTam
      ${loaiNhanSu !== 'all' ? `AND ISNULL(g.LoaiNhanSu, N'Giáo viên') = @LoaiNhanSu` : ''}
      AND (g.HoTen LIKE @Search OR g.CCCD LIKE @Search OR g.SDT LIKE @Search)
    `;
    
    if (handoverOnly) {
      baseQuery += ` AND g.TrangThaiBanGiaoGV = N'Đã bàn giao'`;
    }

    let countQuery = `
      SELECT 
        COUNT(*) as Total,
        SUM(CASE WHEN ISNULL(H.DocCount, 0) = 0 THEN 1 ELSE 0 END) as EmptyCount,
        SUM(CASE WHEN ISNULL(H.DocCount, 0) > 0 AND ISNULL(H.DocCount, 0) < 9 THEN 1 ELSE 0 END) as PartialCount,
        SUM(CASE WHEN ISNULL(H.DocCount, 0) >= 9 THEN 1 ELSE 0 END) as FullCount
      ${baseQuery}
    `;
    
    if (category && category !== "all") {
      countRequest.input('Category', sql.NVarChar, category);
      countQuery += ` AND ISNULL(g.HangGVTH, '') = @Category`;
    }

    if (docStatus === "empty") {
      countQuery += ` AND ISNULL(H.DocCount, 0) = 0`;
    } else if (docStatus === "partial") {
      countQuery += ` AND ISNULL(H.DocCount, 0) > 0 AND ISNULL(H.DocCount, 0) < 9`;
    } else if (docStatus === "full") {
      countQuery += ` AND ISNULL(H.DocCount, 0) >= 9`;
    }
    
    const countResult = await countRequest.query(countQuery);
    const totalRecords = countResult.recordset[0].Total || 0;
    const emptyCount = countResult.recordset[0].EmptyCount || 0;
    const partialCount = countResult.recordset[0].PartialCount || 0;
    const fullCount = countResult.recordset[0].FullCount || 0;
    
    const offset = (page - 1) * pageSize;
    
    const dataRequest = pool.request();
    dataRequest.input('Search', sql.NVarChar, `%${search}%`);
    dataRequest.input('TrungTam', sql.NVarChar, trungTam);
    dataRequest.input('LoaiNhanSu', sql.NVarChar, loaiNhanSu);
    dataRequest.input('Offset', sql.Int, offset);
    dataRequest.input('Limit', sql.Int, pageSize);
    
    let dataQuery = `
      SELECT 
        g.Id,
        ROW_NUMBER() OVER(ORDER BY g.Id) as STT,
        g.HoTen,
        g.NgaySinh,
        g.CCCD,
        g.TrinhDo,
        g.HangGPLX,
        g.HangGVTH,
        g.SDT,
        g.NguoiPhuTrach,
        g.HanGPLX,
        g.Avatar,
        g.TrungTam,
        g.BanGiaoCCCD,
        g.BanGiaoGPLX,
        g.BanGiaoBangTN,
        g.BanGiaoNVSP,
        g.BanGiaoGVTH,
        g.TrangThaiBanGiaoGV,
        g.NgayBanGiaoGV,
        g.NhanSuXacNhanGV,
        g.DonXinViec_HR, 
        g.SoYeuLyLich_HR, 
        g.HopDongLaoDong_HR, 
        g.GiayKhamSucKhoe_HR,
        g.BangTotNghiep_HR,
        g.LoaiNhanSu,
        g.NhomGiaoVien, g.HanCCCD, g.TinhTrangHanCCCD, g.HinhThucTuyenDung,
        g.LoaiHopDong, g.SoHopDong, g.NgayBaoTangBHXH, g.SoBHXH,
        g.TrinhDoVanHoa, g.TrinhDoChuyenMon, g.TrinhDoSuPham, g.BacNVSP,
        g.NgayTrungTuyenGPLX, g.TinhTrangHanGPLX, g.HangGiaoVien, g.HanSucKhoe,
        g.TrangThaiBHXH, g.NoiSinh, g.DiaChiThuongTru, g.NoiDangKyKhamChuaBenh, g.MaSoThue,
        ISNULL(H.DocCount, 0) as UploadedDocs
      ${baseQuery}
    `;
    
    if (category && category !== "all") {
      dataRequest.input('Category', sql.NVarChar, category);
      dataQuery += ` AND ISNULL(g.HangGVTH, '') = @Category`;
    }

    if (docStatus === "empty") {
      dataQuery += ` AND ISNULL(H.DocCount, 0) = 0`;
    } else if (docStatus === "partial") {
      dataQuery += ` AND ISNULL(H.DocCount, 0) > 0 AND ISNULL(H.DocCount, 0) < 9`;
    } else if (docStatus === "full") {
      dataQuery += ` AND ISNULL(H.DocCount, 0) >= 9`;
    }
    
    dataQuery += ` ORDER BY g.Id DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;
    
    const result = await dataRequest.query(dataQuery);
    // pool.close(); // Managed by db.ts
    
    return {
      data: result.recordset as TeacherData[],
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page,
      emptyCount,
      partialCount,
      fullCount
    };
  } catch (err) {
    console.error("Error fetching teachers:", err);
    return { data: [], totalRecords: 0, totalPages: 0, currentPage: 1, emptyCount: 0, partialCount: 0, fullCount: 0 };
  }
}

export async function updateTeacher(id: number, data: Partial<TeacherData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let setClauses: string[] = [];
    if (data.HoTen !== undefined) { setClauses.push("HoTen = @HoTen"); request.input('HoTen', sql.NVarChar, data.HoTen); }
    if (data.NgaySinh !== undefined) { setClauses.push("NgaySinh = @NgaySinh"); request.input('NgaySinh', sql.NVarChar, data.NgaySinh); }
    if (data.CCCD !== undefined) { setClauses.push("CCCD = @CCCD"); request.input('CCCD', sql.NVarChar, data.CCCD); }
    if (data.TrinhDo !== undefined) { setClauses.push("TrinhDo = @TrinhDo"); request.input('TrinhDo', sql.NVarChar, data.TrinhDo); }
    if (data.HangGPLX !== undefined) { setClauses.push("HangGPLX = @HangGPLX"); request.input('HangGPLX', sql.NVarChar, data.HangGPLX); }
    if (data.HangGVTH !== undefined) { setClauses.push("HangGVTH = @HangGVTH"); request.input('HangGVTH', sql.NVarChar, data.HangGVTH); }
    if (data.SDT !== undefined) { setClauses.push("SDT = @SDT"); request.input('SDT', sql.NVarChar, data.SDT); }
    if (data.NguoiPhuTrach !== undefined) { setClauses.push("NguoiPhuTrach = @NguoiPhuTrach"); request.input('NguoiPhuTrach', sql.NVarChar, data.NguoiPhuTrach); }
    if (data.HanGPLX !== undefined) { setClauses.push("HanGPLX = @HanGPLX"); request.input('HanGPLX', sql.NVarChar, data.HanGPLX); }
    if (data.TrungTam !== undefined) { setClauses.push("TrungTam = @TrungTam"); request.input('TrungTam', sql.NVarChar, data.TrungTam); }
    if (data.BanGiaoCCCD !== undefined) { setClauses.push("BanGiaoCCCD = @BanGiaoCCCD"); request.input('BanGiaoCCCD', sql.Bit, data.BanGiaoCCCD); }
    if (data.BanGiaoGPLX !== undefined) { setClauses.push("BanGiaoGPLX = @BanGiaoGPLX"); request.input('BanGiaoGPLX', sql.Bit, data.BanGiaoGPLX); }
    if (data.BanGiaoBangTN !== undefined) { setClauses.push("BanGiaoBangTN = @BanGiaoBangTN"); request.input('BanGiaoBangTN', sql.Bit, data.BanGiaoBangTN); }
    if (data.BanGiaoNVSP !== undefined) { setClauses.push("BanGiaoNVSP = @BanGiaoNVSP"); request.input('BanGiaoNVSP', sql.Bit, data.BanGiaoNVSP); }
    if (data.BanGiaoGVTH !== undefined) { setClauses.push("BanGiaoGVTH = @BanGiaoGVTH"); request.input('BanGiaoGVTH', sql.Bit, data.BanGiaoGVTH); }
    if (data.TrangThaiBanGiaoGV !== undefined) { setClauses.push("TrangThaiBanGiaoGV = @TrangThaiBanGiaoGV"); request.input('TrangThaiBanGiaoGV', sql.NVarChar, data.TrangThaiBanGiaoGV); }
    if (data.NgayBanGiaoGV !== undefined) { setClauses.push("NgayBanGiaoGV = @NgayBanGiaoGV"); request.input('NgayBanGiaoGV', sql.NVarChar, data.NgayBanGiaoGV); }
    if (data.NhanSuXacNhanGV !== undefined) { setClauses.push("NhanSuXacNhanGV = @NhanSuXacNhanGV"); request.input('NhanSuXacNhanGV', sql.Bit, data.NhanSuXacNhanGV); }
    
    if (data.DonXinViec_HR !== undefined) { setClauses.push("DonXinViec_HR = @DonXinViec_HR"); request.input('DonXinViec_HR', sql.Bit, data.DonXinViec_HR); }
    if (data.SoYeuLyLich_HR !== undefined) { setClauses.push("SoYeuLyLich_HR = @SoYeuLyLich_HR"); request.input('SoYeuLyLich_HR', sql.Bit, data.SoYeuLyLich_HR); }
    if (data.HopDongLaoDong_HR !== undefined) { setClauses.push("HopDongLaoDong_HR = @HopDongLaoDong_HR"); request.input('HopDongLaoDong_HR', sql.Bit, data.HopDongLaoDong_HR); }
    if (data.GiayKhamSucKhoe_HR !== undefined) { setClauses.push("GiayKhamSucKhoe_HR = @GiayKhamSucKhoe_HR"); request.input('GiayKhamSucKhoe_HR', sql.Bit, data.GiayKhamSucKhoe_HR); }
    if (data.BangTotNghiep_HR !== undefined) { setClauses.push("BangTotNghiep_HR = @BangTotNghiep_HR"); request.input('BangTotNghiep_HR', sql.Bit, data.BangTotNghiep_HR); }

    // New HR & Training fields
    if (data.NhomGiaoVien !== undefined) { setClauses.push("NhomGiaoVien = @NhomGiaoVien"); request.input('NhomGiaoVien', sql.NVarChar, data.NhomGiaoVien); }
    if (data.HanCCCD !== undefined) { setClauses.push("HanCCCD = @HanCCCD"); request.input('HanCCCD', sql.NVarChar, data.HanCCCD); }
    if (data.TinhTrangHanCCCD !== undefined) { setClauses.push("TinhTrangHanCCCD = @TinhTrangHanCCCD"); request.input('TinhTrangHanCCCD', sql.NVarChar, data.TinhTrangHanCCCD); }
    if (data.HinhThucTuyenDung !== undefined) { setClauses.push("HinhThucTuyenDung = @HinhThucTuyenDung"); request.input('HinhThucTuyenDung', sql.NVarChar, data.HinhThucTuyenDung); }
    if (data.LoaiHopDong !== undefined) { setClauses.push("LoaiHopDong = @LoaiHopDong"); request.input('LoaiHopDong', sql.NVarChar, data.LoaiHopDong); }
    if (data.SoHopDong !== undefined) { setClauses.push("SoHopDong = @SoHopDong"); request.input('SoHopDong', sql.NVarChar, data.SoHopDong); }
    if (data.NgayBaoTangBHXH !== undefined) { setClauses.push("NgayBaoTangBHXH = @NgayBaoTangBHXH"); request.input('NgayBaoTangBHXH', sql.NVarChar, data.NgayBaoTangBHXH); }
    if (data.SoBHXH !== undefined) { setClauses.push("SoBHXH = @SoBHXH"); request.input('SoBHXH', sql.NVarChar, data.SoBHXH); }
    if (data.TrinhDoVanHoa !== undefined) { setClauses.push("TrinhDoVanHoa = @TrinhDoVanHoa"); request.input('TrinhDoVanHoa', sql.NVarChar, data.TrinhDoVanHoa); }
    if (data.TrinhDoChuyenMon !== undefined) { setClauses.push("TrinhDoChuyenMon = @TrinhDoChuyenMon"); request.input('TrinhDoChuyenMon', sql.NVarChar, data.TrinhDoChuyenMon); }
    if (data.TrinhDoSuPham !== undefined) { setClauses.push("TrinhDoSuPham = @TrinhDoSuPham"); request.input('TrinhDoSuPham', sql.NVarChar, data.TrinhDoSuPham); }
    if (data.BacNVSP !== undefined) { setClauses.push("BacNVSP = @BacNVSP"); request.input('BacNVSP', sql.NVarChar, data.BacNVSP); }
    if (data.NgayTrungTuyenGPLX !== undefined) { setClauses.push("NgayTrungTuyenGPLX = @NgayTrungTuyenGPLX"); request.input('NgayTrungTuyenGPLX', sql.NVarChar, data.NgayTrungTuyenGPLX); }
    if (data.TinhTrangHanGPLX !== undefined) { setClauses.push("TinhTrangHanGPLX = @TinhTrangHanGPLX"); request.input('TinhTrangHanGPLX', sql.NVarChar, data.TinhTrangHanGPLX); }
    if (data.HangGiaoVien !== undefined) { setClauses.push("HangGiaoVien = @HangGiaoVien"); request.input('HangGiaoVien', sql.NVarChar, data.HangGiaoVien); }
    if (data.HanSucKhoe !== undefined) { setClauses.push("HanSucKhoe = @HanSucKhoe"); request.input('HanSucKhoe', sql.NVarChar, data.HanSucKhoe); }
    if (data.TrangThaiBHXH !== undefined) { setClauses.push("TrangThaiBHXH = @TrangThaiBHXH"); request.input('TrangThaiBHXH', sql.NVarChar, data.TrangThaiBHXH); }
    if (data.NoiSinh !== undefined) { setClauses.push("NoiSinh = @NoiSinh"); request.input('NoiSinh', sql.NVarChar, data.NoiSinh); }
    if (data.DiaChiThuongTru !== undefined) { setClauses.push("DiaChiThuongTru = @DiaChiThuongTru"); request.input('DiaChiThuongTru', sql.NVarChar, data.DiaChiThuongTru); }
    if (data.NoiDangKyKhamChuaBenh !== undefined) { setClauses.push("NoiDangKyKhamChuaBenh = @NoiDangKyKhamChuaBenh"); request.input('NoiDangKyKhamChuaBenh', sql.NVarChar, data.NoiDangKyKhamChuaBenh); }
    if (data.MaSoThue !== undefined) { setClauses.push("MaSoThue = @MaSoThue"); request.input('MaSoThue', sql.NVarChar, data.MaSoThue); }
    
    if (setClauses.length === 0) return { success: true };
    
    request.input('Id', sql.Int, id);
    await request.query(`UPDATE dp_system.dbo.App_GiaoVien SET ${setClauses.join(', ')} WHERE Id = @Id`);
    
    // pool.close(); // Managed by db.ts
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating teacher:", err);
    return { success: false, error: err.message };
  }
}

export async function getTeacherStats(trungTam = "Đại Phát") {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('TrungTam', sql.NVarChar, trungTam)
      .query(`
      SELECT ISNULL(HangGVTH, 'Khác') as Category, COUNT(*) as Count
      FROM dp_system.dbo.App_GiaoVien
      WHERE ISNULL(TrungTam, N'Đại Phát') = @TrungTam
      GROUP BY HangGVTH
    `);
    
    const stats: Record<string, number> = {};
    let total = 0;
    
    for (const row of result.recordset) {
      let cat = (row.Category || "Khác").trim();
      if (!cat) cat = "Khác";
      
      stats[cat] = (stats[cat] || 0) + row.Count;
      total += row.Count;
    }
    
    // pool.close(); // Managed by db.ts
    return { total, details: stats };
  } catch (err) {
    console.error("Error fetching teacher stats:", err);
    return { total: 0, details: {} };
  }
}

export async function deleteTeacher(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Id', sql.Int, id);
    await request.query(`DELETE FROM dp_system.dbo.App_GiaoVien WHERE Id = @Id`);
    // pool.close(); // Managed by db.ts
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting teacher:", err);
    return { success: false, error: err.message };
  }
}

export async function updateTeacherAvatar(id: number, avatarUrl: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Id', sql.Int, id);
    request.input('Avatar', sql.NVarChar, avatarUrl);
    await request.query(`UPDATE dp_system.dbo.App_GiaoVien SET Avatar = @Avatar WHERE Id = @Id`);
    // pool.close(); // Managed by db.ts
    revalidatePath('/teachers');
    revalidatePath('/archive');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating teacher avatar:", err);
    return { success: false, error: err.message };
  }
}

export async function addTeacher(data: Partial<TeacherData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let columns: string[] = [];
    let values: string[] = [];
    
    const fields = [
      'HoTen', 'NgaySinh', 'CCCD', 'TrinhDo', 'HangGPLX', 'HangGVTH', 'SDT', 
      'NguoiPhuTrach', 'HanGPLX', 'TrungTam', 'NhomGiaoVien', 'HanCCCD', 
      'TinhTrangHanCCCD', 'HinhThucTuyenDung', 'LoaiHopDong', 'SoHopDong', 
      'NgayBaoTangBHXH', 'SoBHXH', 'TrinhDoVanHoa', 'TrinhDoChuyenMon', 
      'TrinhDoSuPham', 'BacNVSP', 'NgayTrungTuyenGPLX', 'TinhTrangHanGPLX', 
      'HangGiaoVien', 'HanSucKhoe', 'TrangThaiBHXH', 'NoiSinh', 
      'DiaChiThuongTru', 'NoiDangKyKhamChuaBenh', 'MaSoThue'
    ];
    
    // Default LoaiNhanSu for Teachers is 1
    columns.push('LoaiNhanSu');
    values.push('@LoaiNhanSu');
    request.input('LoaiNhanSu', 1);

    for (const field of fields) {
      if ((data as any)[field] !== undefined) {
        columns.push(field);
        values.push('@' + field);
        request.input(field, (data as any)[field]);
      }
    }
    
    const query = `INSERT INTO dp_system.dbo.App_GiaoVien (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    await request.query(query);
    
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error('Error adding teacher:', err);
    return { success: false, error: err.message };
  }
}
