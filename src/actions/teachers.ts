"use server";

import sql from "mssql";
import { revalidatePath } from "next/cache";

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

export type TeacherData = {
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
};

export async function getTeachers(page = 1, pageSize = 50, search = "", category = "", docStatus = "", trungTam = "Đại Phát") {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Đếm tổng số
    const countRequest = pool.request();
    countRequest.input('Search', sql.NVarChar, `%${search}%`);
    countRequest.input('TrungTam', sql.NVarChar, trungTam);
    let countQuery = `
      SELECT 
        COUNT(*) as Total,
        SUM(CASE WHEN H.DocCount = 0 THEN 1 ELSE 0 END) as EmptyCount,
        SUM(CASE WHEN H.DocCount > 0 AND H.DocCount < 8 THEN 1 ELSE 0 END) as PartialCount,
        SUM(CASE WHEN H.DocCount >= 8 THEN 1 ELSE 0 END) as FullCount
      FROM dp_system.dbo.App_GiaoVien g
      OUTER APPLY (
        SELECT COUNT(DISTINCT LoaiHoSo) as DocCount
        FROM dp_system.dbo.App_GiaoVien_HoSo h
        WHERE h.GiaoVienId = g.Id AND h.LoaiHoSo != 'Avatar'
      ) H
      WHERE ISNULL(g.TrungTam, N'Đại Phát') = @TrungTam
      AND (g.HoTen LIKE @Search OR g.CCCD LIKE @Search OR g.SDT LIKE @Search)
    `;
    
    if (category && category !== "all") {
      countRequest.input('Category', sql.NVarChar, category);
      countQuery += ` AND ISNULL(g.HangGVTH, '') = @Category`;
    }

    if (docStatus === "empty") {
      countQuery += ` AND H.DocCount = 0`;
    } else if (docStatus === "partial") {
      countQuery += ` AND H.DocCount > 0 AND H.DocCount < 8`;
    } else if (docStatus === "full") {
      countQuery += ` AND H.DocCount >= 8`;
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
        H.DocCount as UploadedDocs
      FROM dp_system.dbo.App_GiaoVien g
      OUTER APPLY (
        SELECT COUNT(DISTINCT LoaiHoSo) as DocCount
        FROM dp_system.dbo.App_GiaoVien_HoSo h
        WHERE h.GiaoVienId = g.Id AND h.LoaiHoSo != 'Avatar'
      ) H
      WHERE ISNULL(g.TrungTam, N'Đại Phát') = @TrungTam
      AND (g.HoTen LIKE @Search OR g.CCCD LIKE @Search OR g.SDT LIKE @Search)
    `;
    
    if (category && category !== "all") {
      dataRequest.input('Category', sql.NVarChar, category);
      dataQuery += ` AND ISNULL(g.HangGVTH, '') = @Category`;
    }

    if (docStatus === "empty") {
      dataQuery += ` AND H.DocCount = 0`;
    } else if (docStatus === "partial") {
      dataQuery += ` AND H.DocCount > 0 AND H.DocCount < 8`;
    } else if (docStatus === "full") {
      dataQuery += ` AND H.DocCount >= 8`;
    }
    
    dataQuery += ` ORDER BY g.Id DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;
    
    const result = await dataRequest.query(dataQuery);
    pool.close();
    
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
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    let setClauses = [];
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
    
    if (setClauses.length === 0) return { success: true };
    
    request.input('Id', sql.Int, id);
    await request.query(`UPDATE dp_system.dbo.App_GiaoVien SET ${setClauses.join(', ')} WHERE Id = @Id`);
    
    pool.close();
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating teacher:", err);
    return { success: false, error: err.message };
  }
}

export async function getTeacherStats(trungTam = "Đại Phát") {
  try {
    const pool = await sql.connect(dbConfig);
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
    
    pool.close();
    return { total, details: stats };
  } catch (err) {
    console.error("Error fetching teacher stats:", err);
    return { total: 0, details: {} };
  }
}

export async function deleteTeacher(id: number) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('Id', sql.Int, id);
    await request.query(`DELETE FROM dp_system.dbo.App_GiaoVien WHERE Id = @Id`);
    pool.close();
    revalidatePath('/teachers');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting teacher:", err);
    return { success: false, error: err.message };
  }
}

export async function updateTeacherAvatar(id: number, avatarUrl: string) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('Id', sql.Int, id);
    request.input('Avatar', sql.NVarChar, avatarUrl);
    await request.query(`UPDATE dp_system.dbo.App_GiaoVien SET Avatar = @Avatar WHERE Id = @Id`);
    pool.close();
    revalidatePath('/teachers');
    revalidatePath('/archive');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating teacher avatar:", err);
    return { success: false, error: err.message };
  }
}
