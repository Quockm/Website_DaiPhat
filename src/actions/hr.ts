"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from "next/cache";

export type StaffData = {
  Id: number;
  STT?: number;
  HoTen: string;
  NgaySinh?: string | null;
  CCCD?: string | null;
  HanCCCD?: string | null;
  TrinhDo?: string | null; // This is Trình độ chuyên môn
  TrinhDoVanHoa?: string | null;
  TrinhDoSuPham?: string | null;
  BacNVSP?: string | null;
  HangGPLX?: string | null;
  NgayTrungTuyenGPLX?: string | null;
  HanGPLX?: string | null;
  HangGVTH?: string | null;
  SDT?: string | null;
  NguoiPhuTrach?: string | null; // Nhóm giáo viên
  DonViCu?: string | null;
  Khoa?: string | null;
  Avatar?: string | null;
  TrungTam?: string | null;
  HinhThucTuyenDung?: string | null;
  LoaiNhanSu?: string | null;
  LoaiHopDong?: string | null;
  SoHopDong?: string | null;
  NgayKy?: string | null;
  TinhTrangBHXH?: boolean | null;
  SoBHXH?: string | null;
  MaSoThue?: string | null;
  NoiSinh?: string | null;
  DiaChiThuongTru?: string | null;
  NoiDKKCB?: string | null;
  GiayKhamSucKhoe?: string | null;
  HanSucKhoe?: string | null;
  TrangThaiBanGiaoHS?: string | null;
  UploadedDocs?: number;
  LuongCoBan?: number | null;
  
  // New HR & Training fields from TeacherData
  NhomGiaoVien?: string | null;
  TinhTrangHanCCCD?: string | null;
  NgayBaoTangBHXH?: string | null;
  TrinhDoChuyenMon?: string | null;
  TinhTrangHanGPLX?: string | null;
  HangGiaoVien?: string | null;
  TrangThaiBHXH?: string | null;
  NoiDangKyKhamChuaBenh?: string | null;
};

export async function getStaffs(
  page = 1, 
  pageSize = 50, 
  search = "", 
  loaiNhanSu = "all", 
  trungTam = "Đại Phát"
) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    const countRequest = pool.request();
    countRequest.input('Search', sql.NVarChar, `%${search}%`);
    countRequest.input('TrungTam', sql.NVarChar, trungTam);
    
    let baseQuery = `
      FROM dp_system.dbo.App_GiaoVien g
      LEFT JOIN (
        SELECT GiaoVienId, COUNT(DISTINCT LoaiHoSo) as DocCount
        FROM dp_system.dbo.App_GiaoVien_HoSo
        WHERE LoaiHoSo != 'Avatar'
        GROUP BY GiaoVienId
      ) H ON g.Id = H.GiaoVienId
      WHERE ISNULL(g.TrungTam, N'Đại Phát') = @TrungTam
      AND (g.HoTen LIKE @Search OR g.CCCD LIKE @Search OR g.SDT LIKE @Search)
    `;

    if (loaiNhanSu && loaiNhanSu !== "all") {
      countRequest.input('LoaiNhanSu', sql.NVarChar, loaiNhanSu);
      baseQuery += ` AND ISNULL(g.LoaiNhanSu, N'Giáo viên') = @LoaiNhanSu`;
    }

    const countQuery = `SELECT COUNT(*) as Total ${baseQuery}`;
    const countResult = await countRequest.query(countQuery);
    const totalRecords = countResult.recordset[0].Total || 0;
    
    const offset = (page - 1) * pageSize;
    
    const dataRequest = pool.request();
    dataRequest.input('Search', sql.NVarChar, `%${search}%`);
    dataRequest.input('TrungTam', sql.NVarChar, trungTam);
    dataRequest.input('Offset', sql.Int, offset);
    dataRequest.input('Limit', sql.Int, pageSize);
    if (loaiNhanSu && loaiNhanSu !== "all") {
      dataRequest.input('LoaiNhanSu', sql.NVarChar, loaiNhanSu);
    }
    
    let dataQuery = `
      SELECT 
        g.*,
        ROW_NUMBER() OVER(ORDER BY g.Id DESC) as STT,
        ISNULL(H.DocCount, 0) as UploadedDocs
      ${baseQuery}
      ORDER BY g.Id DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `;
    
    const result = await dataRequest.query(dataQuery);
    
    return {
      data: result.recordset as StaffData[],
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page
    };
  } catch (err) {
    console.error("Error fetching staffs:", err);
    return { data: [], totalRecords: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function addStaff(data: Partial<StaffData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    const keys = Object.keys(data).filter(k => k !== 'Id' && k !== 'STT' && k !== 'UploadedDocs');
    const columns = keys.join(', ');
    const values = keys.map(k => `@${k}`).join(', ');
    
    keys.forEach(key => {
      let value = (data as any)[key];
      if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value);
      } else {
        request.input(key, sql.NVarChar, value || null);
      }
    });

    // Handle TrungTam default
    if (!keys.includes('TrungTam')) {
      request.input('TrungTam', sql.NVarChar, 'Đại Phát');
    }
    // Handle LoaiNhanSu default
    if (!keys.includes('LoaiNhanSu')) {
      request.input('LoaiNhanSu', sql.NVarChar, 'Nhân viên');
    }
    
    const query = `
      INSERT INTO dp_system.dbo.App_GiaoVien (${columns}${!keys.includes('TrungTam') ? ', TrungTam' : ''}${!keys.includes('LoaiNhanSu') ? ', LoaiNhanSu' : ''})
      VALUES (${values}${!keys.includes('TrungTam') ? ", @TrungTam" : ''}${!keys.includes('LoaiNhanSu') ? ", @LoaiNhanSu" : ''})
    `;
    
    await request.query(query);
    revalidatePath('/hr/staff-list');
    revalidatePath('/teachers'); // Since it uses the same table
    return { success: true };
  } catch (err: any) {
    console.error("Error adding staff:", err);
    return { success: false, error: err.message };
  }
}

export async function updateStaff(id: number, data: Partial<StaffData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let setClauses: string[] = [];
    const keys = Object.keys(data).filter(k => k !== 'Id' && k !== 'STT' && k !== 'UploadedDocs');
    
    keys.forEach(key => {
      setClauses.push(`${key} = @${key}`);
      let value = (data as any)[key];
      if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value);
      } else {
        request.input(key, sql.NVarChar, value || null);
      }
    });
    
    if (setClauses.length === 0) return { success: true };
    
    request.input('Id', sql.Int, id);
    await request.query(`UPDATE dp_system.dbo.App_GiaoVien SET ${setClauses.join(', ')} WHERE Id = @Id`);
    
    revalidatePath('/hr/staff-list');
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating staff:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteStaff(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Id', sql.Int, id);
    // Xóa hồ sơ liên quan trước (tuỳ chọn, nhưng an toàn hơn)
    await request.query(`DELETE FROM dp_system.dbo.App_GiaoVien_HoSo WHERE GiaoVienId = @Id`);
    await request.query(`DELETE FROM dp_system.dbo.App_GiaoVien WHERE Id = @Id`);
    
    revalidatePath('/hr/staff-list');
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting staff:", err);
    return { success: false, error: err.message };
  }
}
