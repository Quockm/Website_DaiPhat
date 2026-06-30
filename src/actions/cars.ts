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

export type CarData = {
  Id: number;
  BienSo: string;
  HanGPTL: string | null;
  HanPhiDAT: string | null;
  ChuXe: string | null;
  HangXe: string | null;
  IMEI: string | null;
  TrungTam?: string | null;
  UploadedDocs?: number;
};

const checkDate = (dateStr: string | null) => {
  if (!dateStr || dateStr.toLowerCase().includes('không')) return "valid";
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      const now = new Date();
      const diffTime = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "expired";
      if (diffDays <= 30) return "warning";
    }
  } catch(e) {}
  return "valid";
};

export async function getCars(page = 1, pageSize = 50, search = "", category = "", statusFilter = "", docStatus = "", trungTam = "Đại Phát") {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Fetch all cars for JS filtering (since <200 records, this is extremely fast and much safer for custom date parsing)
    const request = pool.request();
    request.input('Search', sql.NVarChar, `%${search}%`);
    request.input('TrungTam', sql.NVarChar, trungTam);
    
    let query = `
      SELECT Id, BienSo, HanGPTL, HanPhiDAT, ChuXe, HangXe, IMEI, TrungTam,
        (SELECT COUNT(DISTINCT LoaiHoSo) FROM dp_system.dbo.App_PhuongTien_HoSo h WHERE h.PhuongTienId = dp_system.dbo.App_PhuongTien.Id) as UploadedDocs
      FROM dp_system.dbo.App_PhuongTien
      WHERE ISNULL(TrungTam, N'Đại Phát') = @TrungTam
      AND (BienSo LIKE @Search OR ChuXe LIKE @Search OR IMEI LIKE @Search)
    `;
    
    if (category && category !== "all") {
      request.input('Category', sql.NVarChar, category);
      query += ` AND ISNULL(HangXe, '') = @Category`;
    }
    
    query += ` ORDER BY Id DESC`;
    
    const result = await request.query(query);
    pool.close();
    
    let allData = result.recordset as CarData[];
    
    // Apply JS status filter
    if (statusFilter && statusFilter !== "all") {
      allData = allData.filter(car => {
        const st1 = checkDate(car.HanGPTL);
        const st2 = checkDate(car.HanPhiDAT);
        
        if (statusFilter === "expired") {
          return st1 === "expired" || st2 === "expired";
        }
        if (statusFilter === "warning") {
          return st1 === "warning" || st2 === "warning";
        }
        if (statusFilter === "valid") {
          return st1 === "valid" && st2 === "valid";
        }
        return true;
      });
    }

    let emptyCount = 0;
    let partialCount = 0;
    let fullCount = 0;

    allData.forEach(car => {
      const docs = car.UploadedDocs || 0;
      if (docs === 0) emptyCount++;
      else if (docs > 0 && docs < 6) partialCount++;
      else if (docs >= 6) fullCount++;
    });

    if (docStatus && docStatus !== "all") {
      allData = allData.filter(car => {
        const docs = car.UploadedDocs || 0;
        if (docStatus === "empty") return docs === 0;
        if (docStatus === "partial") return docs > 0 && docs < 6;
        if (docStatus === "full") return docs >= 6;
        return true;
      });
    }
    
    const totalRecords = allData.length;
    const offset = (page - 1) * pageSize;
    const paginatedData = allData.slice(offset, offset + pageSize);
    
    return {
      data: paginatedData,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page,
      emptyCount,
      partialCount,
      fullCount
    };
  } catch (err) {
    console.error("Error fetching cars:", err);
    return { data: [], totalRecords: 0, totalPages: 0, currentPage: 1, emptyCount: 0, partialCount: 0, fullCount: 0 };
  }
}

export async function updateCar(id: number, data: Partial<CarData>) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    
    let setClauses = [];
    if (data.BienSo !== undefined) { setClauses.push("BienSo = @BienSo"); request.input('BienSo', sql.NVarChar, data.BienSo); }
    if (data.IMEI !== undefined) { setClauses.push("IMEI = @IMEI"); request.input('IMEI', sql.NVarChar, data.IMEI); }
    if (data.HangXe !== undefined) { setClauses.push("HangXe = @HangXe"); request.input('HangXe', sql.NVarChar, data.HangXe); }
    if (data.HanGPTL !== undefined) { setClauses.push("HanGPTL = @HanGPTL"); request.input('HanGPTL', sql.NVarChar, data.HanGPTL); }
    if (data.HanPhiDAT !== undefined) { setClauses.push("HanPhiDAT = @HanPhiDAT"); request.input('HanPhiDAT', sql.NVarChar, data.HanPhiDAT); }
    if (data.ChuXe !== undefined) { setClauses.push("ChuXe = @ChuXe"); request.input('ChuXe', sql.NVarChar, data.ChuXe); }
    if (data.TrungTam !== undefined) { setClauses.push("TrungTam = @TrungTam"); request.input('TrungTam', sql.NVarChar, data.TrungTam); }
    
    if (setClauses.length === 0) return { success: true };
    
    request.input('Id', sql.Int, id);
    await request.query(`UPDATE dp_system.dbo.App_PhuongTien SET ${setClauses.join(', ')} WHERE Id = @Id`);
    
    pool.close();
    revalidatePath('/cars');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating car:", err);
    return { success: false, error: err.message };
  }
}

export async function getCarStats(trungTam = "Đại Phát") {
  try {
    const pool = await sql.connect(dbConfig);
    
    const request = pool.request();
    request.input('TrungTam', sql.NVarChar, trungTam);
    
    const resultCategories = await request.query(`
      SELECT ISNULL(HangXe, 'Khác') as Category, COUNT(*) as Count
      FROM dp_system.dbo.App_PhuongTien
      WHERE ISNULL(TrungTam, N'Đại Phát') = @TrungTam
      GROUP BY ISNULL(HangXe, 'Khác')
    `);
    
    const stats: Record<string, number> = {};
    let total = 0;
    
    for (const row of resultCategories.recordset) {
      let cat = (row.Category || "Khác").trim();
      if (!cat) cat = "Khác";
      
      stats[cat] = (stats[cat] || 0) + row.Count;
      total += row.Count;
    }
    
    const resultDates = await pool.request().query(`
      SELECT HanGPTL, HanPhiDAT
      FROM dp_system.dbo.App_PhuongTien
    `);
    
    let expired = 0;
    let warning = 0; // <= 30 days
    
    for (const row of resultDates.recordset) {
      const st1 = checkDate(row.HanGPTL);
      const st2 = checkDate(row.HanPhiDAT);
      
      if (st1 === 'expired' || st2 === 'expired') {
        expired++;
      } else if (st1 === 'warning' || st2 === 'warning') {
        warning++;
      }
    }
    
    pool.close();
    return { total, details: stats, expired, warning };
  } catch (err) {
    console.error("Error fetching car stats:", err);
    return { total: 0, details: {}, expired: 0, warning: 0 };
  }
}

export async function deleteCar(id: number) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('Id', sql.Int, id);
    await request.query(`DELETE FROM dp_system.dbo.App_PhuongTien WHERE Id = @Id`);
    pool.close();
    revalidatePath('/cars');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting car:", err);
    return { success: false, error: err.message };
  }
}
