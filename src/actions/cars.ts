"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from "next/cache";

export type CarData = {
  Id: number;
  BienSo: string;
  HanGPTL: string | null;
  HanPhiDAT: string | null;
  ChuXe: string | null;
  HangXe: string | null;
  IMEI: string | null;
  TrungTam: string | null;
  UploadedDocs?: number;
  UploadedImages?: number;
  // Bàn giao hồ sơ
  BanGiaoDangKy?: boolean;
  BanGiaoDangKiem?: boolean;
  BanGiaoPhuHieu?: boolean;
  BanGiaoBaoHiem?: boolean;
  BanGiaoDangKyTapLai?: boolean;
  HopDongThueXe?: boolean;
  
  BanGiaoCCCD_Xe?: boolean;
  BanGiaoCaVet?: boolean;
  BanGiaoNganHang?: boolean;
  
  TrangThaiBanGiao?: string | null;
  DangKyMST?: boolean;
  NgayBanGiao?: string | null;
  
  GiaoVienId?: number | null;
  
  // New HR & Training fields for cars
  ChuNhom?: string | null;
  LoaiXe?: string | null;
  NhanHieu?: string | null;
  SoKhung?: string | null;
  SoMay?: string | null;
  NamSanXuat?: string | null;
  SoSeri?: string | null;
  HangDaoTao?: string | null;
  LuuLuongKhoa?: string | null;
  
  SoGPTL?: string | null;
  NgayBatDauGPTL?: string | null;
  NgayKetThucGPTL?: string | null;
  HanGPLX_GPTL?: string | null;
  NgayBatDauDAT?: string | null;
  NgayKetThucDAT?: string | null;
  HanGPLX_DAT?: string | null;
  
  NgaySinhChuXe?: string | null;
  QuocTich?: string | null;
  SoCCCDChuXe?: string | null;
  CapNgayCCCD?: string | null;
  NoiCapCCCD?: string | null;
  MSTChuXe?: string | null;
  DiaChiChuXe?: string | null;
  
  NgayKyHopDongXe?: string | null;
  SoHopDongXe?: string | null;
  KetQuaDangKyThue?: string | null;
  ToKeKhai?: string | null;
  PhanLoaiXe?: string | null;
};

export type DatData = {
  Id: number;
  SoLuong: number;
  NgayNhan: string | null;
  NguoiNhan: string | null;
  GhiChu: string | null;
  CreatedAt: string | null;
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

export async function getCars(page = 1, pageSize = 50, search = "", category = "", statusFilter = "", docStatus = "", trungTam = "Đại Phát", mode = "docs") {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Fetch all cars for JS filtering (since <200 records, this is extremely fast and much safer for custom date parsing)
    const request = pool.request();
    request.input('Search', sql.NVarChar, `%${search}%`);
    request.input('TrungTam', sql.NVarChar, trungTam);
    
    let query = `
      SELECT Id, BienSo, HanGPTL, HanPhiDAT, ChuXe, HangXe, IMEI, TrungTam,
        BanGiaoDangKy, BanGiaoDangKiem, BanGiaoPhuHieu, BanGiaoBaoHiem, BanGiaoDangKyTapLai, HopDongThueXe, 
        BanGiaoCCCD_Xe, BanGiaoCaVet, BanGiaoNganHang,
        TrangThaiBanGiao, DangKyMST, NgayBanGiao, GiaoVienId,
        ChuNhom, LoaiXe, NhanHieu, SoKhung, SoMay, NamSanXuat, SoSeri, HangDaoTao, LuuLuongKhoa,
        SoGPTL, NgayBatDauGPTL, NgayKetThucGPTL, HanGPLX_GPTL,
        NgayBatDauDAT, NgayKetThucDAT, HanGPLX_DAT,
        NgaySinhChuXe, QuocTich, SoCCCDChuXe, CapNgayCCCD, NoiCapCCCD, MSTChuXe, DiaChiChuXe,
        NgayKyHopDongXe, SoHopDongXe, KetQuaDangKyThue, ToKeKhai, PhanLoaiXe,
        (SELECT COUNT(DISTINCT LoaiHoSo) FROM dp_system.dbo.App_PhuongTien_HoSo h WHERE h.PhuongTienId = dp_system.dbo.App_PhuongTien.Id AND h.LoaiHoSo NOT IN (N'Hình trước', N'Hình sau', N'Hình trái', N'Hình phải', N'Hình DAT')) as UploadedDocs,
        (SELECT COUNT(DISTINCT LoaiHoSo) FROM dp_system.dbo.App_PhuongTien_HoSo h WHERE h.PhuongTienId = dp_system.dbo.App_PhuongTien.Id AND h.LoaiHoSo IN (N'Hình trước', N'Hình sau', N'Hình trái', N'Hình phải', N'Hình DAT')) as UploadedImages
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
    // pool.close(); // Managed by db.ts
    
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
        if (statusFilter === "handover") {
          return car.TrangThaiBanGiao === 'Đã bàn giao';
        }
        return true;
      });
    }

    let emptyCount = 0;
    let partialCount = 0;
    let fullCount = 0;

    allData.forEach(car => {
      const docs = mode === "images" ? (car.UploadedImages || 0) : (car.UploadedDocs || 0);
      const targetMax = mode === "images" ? 5 : 6;
      if (docs === 0) emptyCount++;
      else if (docs > 0 && docs < targetMax) partialCount++;
      else if (docs >= targetMax) fullCount++;
    });

    if (docStatus && docStatus !== "all") {
      allData = allData.filter(car => {
        const docs = mode === "images" ? (car.UploadedImages || 0) : (car.UploadedDocs || 0);
        const targetMax = mode === "images" ? 5 : 6;
        if (docStatus === "empty") return docs === 0;
        if (docStatus === "partial") return docs > 0 && docs < targetMax;
        if (docStatus === "full") return docs >= targetMax;
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

export async function addCar(data: Partial<CarData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    // Core fields
    request.input('BienSo', data.BienSo || null);
    request.input('IMEI', data.IMEI || null);
    request.input('HangXe', data.HangXe || null);
    request.input('HanGPTL', data.HanGPTL || null);
    request.input('HanPhiDAT', data.HanPhiDAT || null);
    request.input('ChuXe', data.ChuXe || null);
    request.input('TrungTam', data.TrungTam || 'Đại Phát');
    
    // Handover & status
    request.input('TrangThaiBanGiao', data.TrangThaiBanGiao || null);
    request.input('NgayBanGiao', data.NgayBanGiao || null);
    request.input('GiaoVienId', sql.Int, data.GiaoVienId || null);
    
    // Bools
    request.input('BanGiaoDangKy', sql.Bit, data.BanGiaoDangKy ? 1 : 0);
    request.input('BanGiaoDangKiem', sql.Bit, data.BanGiaoDangKiem ? 1 : 0);
    request.input('BanGiaoPhuHieu', sql.Bit, data.BanGiaoPhuHieu ? 1 : 0);
    request.input('BanGiaoBaoHiem', sql.Bit, data.BanGiaoBaoHiem ? 1 : 0);
    request.input('BanGiaoDangKyTapLai', sql.Bit, data.BanGiaoDangKyTapLai ? 1 : 0);
    request.input('HopDongThueXe', sql.Bit, data.HopDongThueXe ? 1 : 0);
    request.input('BanGiaoCCCD_Xe', sql.Bit, data.BanGiaoCCCD_Xe ? 1 : 0);
    request.input('BanGiaoCaVet', sql.Bit, data.BanGiaoCaVet ? 1 : 0);
    request.input('BanGiaoNganHang', sql.Bit, data.BanGiaoNganHang ? 1 : 0);
    request.input('DangKyMST', sql.Bit, data.DangKyMST ? 1 : 0);
    
    // HR & Training
    request.input('ChuNhom', data.ChuNhom || null);
    request.input('LoaiXe', data.LoaiXe || null);
    request.input('NhanHieu', data.NhanHieu || null);
    request.input('SoKhung', data.SoKhung || null);
    request.input('SoMay', data.SoMay || null);
    request.input('NamSanXuat', data.NamSanXuat || null);
    request.input('SoSeri', data.SoSeri || null);
    request.input('HangDaoTao', data.HangDaoTao || null);
    request.input('LuuLuongKhoa', data.LuuLuongKhoa || null);
    request.input('SoGPTL', data.SoGPTL || null);
    request.input('NgayBatDauGPTL', data.NgayBatDauGPTL || null);
    request.input('NgayKetThucGPTL', data.NgayKetThucGPTL || null);
    request.input('HanGPLX_GPTL', data.HanGPLX_GPTL || null);
    request.input('NgayBatDauDAT', data.NgayBatDauDAT || null);
    request.input('NgayKetThucDAT', data.NgayKetThucDAT || null);
    request.input('HanGPLX_DAT', data.HanGPLX_DAT || null);
    
    // Owner details
    request.input('NgaySinhChuXe', data.NgaySinhChuXe || null);
    request.input('QuocTich', data.QuocTich || null);
    request.input('SoCCCDChuXe', data.SoCCCDChuXe || null);
    request.input('CapNgayCCCD', data.CapNgayCCCD || null);
    request.input('NoiCapCCCD', data.NoiCapCCCD || null);
    request.input('MSTChuXe', data.MSTChuXe || null);
    request.input('DiaChiChuXe', data.DiaChiChuXe || null);
    request.input('NgayKyHopDongXe', data.NgayKyHopDongXe || null);
    request.input('SoHopDongXe', data.SoHopDongXe || null);
    request.input('KetQuaDangKyThue', data.KetQuaDangKyThue || null);
    request.input('ToKeKhai', data.ToKeKhai || null);
    request.input('PhanLoaiXe', data.PhanLoaiXe || null);

    const query = `
      INSERT INTO dp_system.dbo.App_PhuongTien (
        BienSo, IMEI, HangXe, HanGPTL, HanPhiDAT, ChuXe, TrungTam,
        TrangThaiBanGiao, NgayBanGiao, GiaoVienId,
        BanGiaoDangKy, BanGiaoDangKiem, BanGiaoPhuHieu, BanGiaoBaoHiem, BanGiaoDangKyTapLai,
        HopDongThueXe, BanGiaoCCCD_Xe, BanGiaoCaVet, BanGiaoNganHang, DangKyMST,
        ChuNhom, LoaiXe, NhanHieu, SoKhung, SoMay, NamSanXuat, SoSeri, HangDaoTao, LuuLuongKhoa,
        SoGPTL, NgayBatDauGPTL, NgayKetThucGPTL, HanGPLX_GPTL,
        NgayBatDauDAT, NgayKetThucDAT, HanGPLX_DAT,
        NgaySinhChuXe, QuocTich, SoCCCDChuXe, CapNgayCCCD, NoiCapCCCD, MSTChuXe, DiaChiChuXe,
        NgayKyHopDongXe, SoHopDongXe, KetQuaDangKyThue, ToKeKhai, PhanLoaiXe
      ) VALUES (
        @BienSo, @IMEI, @HangXe, @HanGPTL, @HanPhiDAT, @ChuXe, @TrungTam,
        @TrangThaiBanGiao, @NgayBanGiao, @GiaoVienId,
        @BanGiaoDangKy, @BanGiaoDangKiem, @BanGiaoPhuHieu, @BanGiaoBaoHiem, @BanGiaoDangKyTapLai,
        @HopDongThueXe, @BanGiaoCCCD_Xe, @BanGiaoCaVet, @BanGiaoNganHang, @DangKyMST,
        @ChuNhom, @LoaiXe, @NhanHieu, @SoKhung, @SoMay, @NamSanXuat, @SoSeri, @HangDaoTao, @LuuLuongKhoa,
        @SoGPTL, @NgayBatDauGPTL, @NgayKetThucGPTL, @HanGPLX_GPTL,
        @NgayBatDauDAT, @NgayKetThucDAT, @HanGPLX_DAT,
        @NgaySinhChuXe, @QuocTich, @SoCCCDChuXe, @CapNgayCCCD, @NoiCapCCCD, @MSTChuXe, @DiaChiChuXe,
        @NgayKyHopDongXe, @SoHopDongXe, @KetQuaDangKyThue, @ToKeKhai, @PhanLoaiXe
      )
    `;

    await request.query(query);
    revalidatePath('/cars');
    return { success: true };
  } catch (err: any) {
    console.error("Error adding car:", err);
    return { success: false, error: err.message };
  }
}

export async function updateCar(id: number, data: Partial<CarData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let setClauses: string[] = [];
    if (data.BienSo !== undefined) { setClauses.push("BienSo = @BienSo"); request.input('BienSo', sql.NVarChar, data.BienSo); }
    if (data.IMEI !== undefined) { setClauses.push("IMEI = @IMEI"); request.input('IMEI', sql.NVarChar, data.IMEI); }
    if (data.HangXe !== undefined) { setClauses.push("HangXe = @HangXe"); request.input('HangXe', sql.NVarChar, data.HangXe); }
    if (data.HanGPTL !== undefined) { setClauses.push("HanGPTL = @HanGPTL"); request.input('HanGPTL', sql.NVarChar, data.HanGPTL); }
    if (data.HanPhiDAT !== undefined) { setClauses.push("HanPhiDAT = @HanPhiDAT"); request.input('HanPhiDAT', sql.NVarChar, data.HanPhiDAT); }
    if (data.ChuXe !== undefined) { setClauses.push("ChuXe = @ChuXe"); request.input('ChuXe', sql.NVarChar, data.ChuXe); }
    if (data.TrungTam !== undefined) { setClauses.push("TrungTam = @TrungTam"); request.input('TrungTam', sql.NVarChar, data.TrungTam); }
    if (data.BanGiaoDangKy !== undefined) { setClauses.push("BanGiaoDangKy = @BanGiaoDangKy"); request.input('BanGiaoDangKy', sql.Bit, data.BanGiaoDangKy); }
    if (data.BanGiaoDangKiem !== undefined) { setClauses.push("BanGiaoDangKiem = @BanGiaoDangKiem"); request.input('BanGiaoDangKiem', sql.Bit, data.BanGiaoDangKiem); }
    if (data.BanGiaoPhuHieu !== undefined) { setClauses.push("BanGiaoPhuHieu = @BanGiaoPhuHieu"); request.input('BanGiaoPhuHieu', sql.Bit, data.BanGiaoPhuHieu); }
    if (data.BanGiaoBaoHiem !== undefined) { setClauses.push("BanGiaoBaoHiem = @BanGiaoBaoHiem"); request.input('BanGiaoBaoHiem', sql.Bit, data.BanGiaoBaoHiem); }
    if (data.BanGiaoDangKyTapLai !== undefined) { setClauses.push("BanGiaoDangKyTapLai = @BanGiaoDangKyTapLai"); request.input('BanGiaoDangKyTapLai', sql.Bit, data.BanGiaoDangKyTapLai); }
    if (data.HopDongThueXe !== undefined) { setClauses.push("HopDongThueXe = @HopDongThueXe"); request.input('HopDongThueXe', sql.Bit, data.HopDongThueXe); }
    if (data.BanGiaoCCCD_Xe !== undefined) { setClauses.push("BanGiaoCCCD_Xe = @BanGiaoCCCD_Xe"); request.input('BanGiaoCCCD_Xe', sql.Bit, data.BanGiaoCCCD_Xe); }
    if (data.BanGiaoCaVet !== undefined) { setClauses.push("BanGiaoCaVet = @BanGiaoCaVet"); request.input('BanGiaoCaVet', sql.Bit, data.BanGiaoCaVet); }
    if (data.BanGiaoNganHang !== undefined) { setClauses.push("BanGiaoNganHang = @BanGiaoNganHang"); request.input('BanGiaoNganHang', sql.Bit, data.BanGiaoNganHang); }
    if (data.TrangThaiBanGiao !== undefined) { setClauses.push("TrangThaiBanGiao = @TrangThaiBanGiao"); request.input('TrangThaiBanGiao', sql.NVarChar, data.TrangThaiBanGiao); }
    if (data.DangKyMST !== undefined) { setClauses.push("DangKyMST = @DangKyMST"); request.input('DangKyMST', sql.Bit, data.DangKyMST); }
    if (data.NgayBanGiao !== undefined) { setClauses.push("NgayBanGiao = @NgayBanGiao"); request.input('NgayBanGiao', sql.NVarChar, data.NgayBanGiao); }
    if (data.GiaoVienId !== undefined) { setClauses.push("GiaoVienId = @GiaoVienId"); request.input('GiaoVienId', sql.Int, data.GiaoVienId); }
    
    // New HR & Training fields for cars
    if (data.ChuNhom !== undefined) { setClauses.push("ChuNhom = @ChuNhom"); request.input('ChuNhom', sql.NVarChar, data.ChuNhom); }
    if (data.LoaiXe !== undefined) { setClauses.push("LoaiXe = @LoaiXe"); request.input('LoaiXe', sql.NVarChar, data.LoaiXe); }
    if (data.NhanHieu !== undefined) { setClauses.push("NhanHieu = @NhanHieu"); request.input('NhanHieu', sql.NVarChar, data.NhanHieu); }
    if (data.SoKhung !== undefined) { setClauses.push("SoKhung = @SoKhung"); request.input('SoKhung', sql.NVarChar, data.SoKhung); }
    if (data.SoMay !== undefined) { setClauses.push("SoMay = @SoMay"); request.input('SoMay', sql.NVarChar, data.SoMay); }
    if (data.NamSanXuat !== undefined) { setClauses.push("NamSanXuat = @NamSanXuat"); request.input('NamSanXuat', sql.NVarChar, data.NamSanXuat); }
    if (data.SoSeri !== undefined) { setClauses.push("SoSeri = @SoSeri"); request.input('SoSeri', sql.NVarChar, data.SoSeri); }
    if (data.HangDaoTao !== undefined) { setClauses.push("HangDaoTao = @HangDaoTao"); request.input('HangDaoTao', sql.NVarChar, data.HangDaoTao); }
    if (data.LuuLuongKhoa !== undefined) { setClauses.push("LuuLuongKhoa = @LuuLuongKhoa"); request.input('LuuLuongKhoa', sql.NVarChar, data.LuuLuongKhoa); }
    
    if (data.SoGPTL !== undefined) { setClauses.push("SoGPTL = @SoGPTL"); request.input('SoGPTL', sql.NVarChar, data.SoGPTL); }
    if (data.NgayBatDauGPTL !== undefined) { setClauses.push("NgayBatDauGPTL = @NgayBatDauGPTL"); request.input('NgayBatDauGPTL', sql.NVarChar, data.NgayBatDauGPTL); }
    if (data.NgayKetThucGPTL !== undefined) { setClauses.push("NgayKetThucGPTL = @NgayKetThucGPTL"); request.input('NgayKetThucGPTL', sql.NVarChar, data.NgayKetThucGPTL); }
    if (data.HanGPLX_GPTL !== undefined) { setClauses.push("HanGPLX_GPTL = @HanGPLX_GPTL"); request.input('HanGPLX_GPTL', sql.NVarChar, data.HanGPLX_GPTL); }
    if (data.NgayBatDauDAT !== undefined) { setClauses.push("NgayBatDauDAT = @NgayBatDauDAT"); request.input('NgayBatDauDAT', sql.NVarChar, data.NgayBatDauDAT); }
    if (data.NgayKetThucDAT !== undefined) { setClauses.push("NgayKetThucDAT = @NgayKetThucDAT"); request.input('NgayKetThucDAT', sql.NVarChar, data.NgayKetThucDAT); }
    if (data.HanGPLX_DAT !== undefined) { setClauses.push("HanGPLX_DAT = @HanGPLX_DAT"); request.input('HanGPLX_DAT', sql.NVarChar, data.HanGPLX_DAT); }
    
    if (data.NgaySinhChuXe !== undefined) { setClauses.push("NgaySinhChuXe = @NgaySinhChuXe"); request.input('NgaySinhChuXe', sql.NVarChar, data.NgaySinhChuXe); }
    if (data.QuocTich !== undefined) { setClauses.push("QuocTich = @QuocTich"); request.input('QuocTich', sql.NVarChar, data.QuocTich); }
    if (data.SoCCCDChuXe !== undefined) { setClauses.push("SoCCCDChuXe = @SoCCCDChuXe"); request.input('SoCCCDChuXe', sql.NVarChar, data.SoCCCDChuXe); }
    if (data.CapNgayCCCD !== undefined) { setClauses.push("CapNgayCCCD = @CapNgayCCCD"); request.input('CapNgayCCCD', sql.NVarChar, data.CapNgayCCCD); }
    if (data.NoiCapCCCD !== undefined) { setClauses.push("NoiCapCCCD = @NoiCapCCCD"); request.input('NoiCapCCCD', sql.NVarChar, data.NoiCapCCCD); }
    if (data.MSTChuXe !== undefined) { setClauses.push("MSTChuXe = @MSTChuXe"); request.input('MSTChuXe', sql.NVarChar, data.MSTChuXe); }
    if (data.DiaChiChuXe !== undefined) { setClauses.push("DiaChiChuXe = @DiaChiChuXe"); request.input('DiaChiChuXe', sql.NVarChar, data.DiaChiChuXe); }
    
    if (data.NgayKyHopDongXe !== undefined) { setClauses.push("NgayKyHopDongXe = @NgayKyHopDongXe"); request.input('NgayKyHopDongXe', sql.NVarChar, data.NgayKyHopDongXe); }
    if (data.SoHopDongXe !== undefined) { setClauses.push("SoHopDongXe = @SoHopDongXe"); request.input('SoHopDongXe', sql.NVarChar, data.SoHopDongXe); }
    if (data.KetQuaDangKyThue !== undefined) { setClauses.push("KetQuaDangKyThue = @KetQuaDangKyThue"); request.input('KetQuaDangKyThue', sql.NVarChar, data.KetQuaDangKyThue); }
    if (data.ToKeKhai !== undefined) { setClauses.push("ToKeKhai = @ToKeKhai"); request.input('ToKeKhai', sql.NVarChar, data.ToKeKhai); }
    if (data.PhanLoaiXe !== undefined) { setClauses.push("PhanLoaiXe = @PhanLoaiXe"); request.input('PhanLoaiXe', sql.NVarChar, data.PhanLoaiXe); }
    
    if (setClauses.length === 0) return { success: true };
    
    request.input('Id', sql.Int, id);
    await request.query(`UPDATE dp_system.dbo.App_PhuongTien SET ${setClauses.join(', ')} WHERE Id = @Id`);
    
    // pool.close(); // Managed by db.ts
    revalidatePath('/cars');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating car:", err);
    return { success: false, error: err.message };
  }
}

export async function getCarStats(trungTam = "Đại Phát") {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    const [resultCategories, resultDates] = await Promise.all([
      pool.request()
        .input('TrungTam', sql.NVarChar, trungTam)
        .query(`
          SELECT ISNULL(HangXe, 'Khác') as Category, COUNT(*) as Count
          FROM dp_system.dbo.App_PhuongTien
          WHERE ISNULL(TrungTam, N'Đại Phát') = @TrungTam
          GROUP BY ISNULL(HangXe, 'Khác')
        `),
      pool.request()
        .input('TrungTam', sql.NVarChar, trungTam)
        .query(`
          SELECT HanGPTL, HanPhiDAT
          FROM dp_system.dbo.App_PhuongTien
          WHERE ISNULL(TrungTam, N'Đại Phát') = @TrungTam
        `),
    ]);

    const stats: Record<string, number> = {};
    let total = 0;

    for (const row of resultCategories.recordset) {
      let cat = (row.Category || "Khác").trim();
      if (!cat) cat = "Khác";

      stats[cat] = (stats[cat] || 0) + row.Count;
      total += row.Count;
    }

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
    
    // pool.close(); // Managed by db.ts
    return { total, details: stats, expired, warning };
  } catch (err) {
    console.error("Error fetching car stats:", err);
    return { total: 0, details: {}, expired: 0, warning: 0 };
  }
}

export async function deleteCar(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Id', sql.Int, id);
    await request.query(`DELETE FROM dp_system.dbo.App_PhuongTien WHERE Id = @Id`);
    // pool.close(); // Managed by db.ts
    revalidatePath('/cars');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting car:", err);
    return { success: false, error: err.message };
  }
}

export async function getDats(page = 1, pageSize = 50, search = "") {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    const countRequest = pool.request();
    countRequest.input('Search', sql.NVarChar, `%${search}%`);
    const countResult = await countRequest.query(`
      SELECT COUNT(*) as Total
      FROM dp_system.dbo.App_LichNhanDAT
      WHERE NguoiNhan LIKE @Search OR GhiChu LIKE @Search
    `);
    
    const totalRecords = countResult.recordset[0].Total || 0;
    const offset = (page - 1) * pageSize;
    
    const dataRequest = pool.request();
    dataRequest.input('Search', sql.NVarChar, `%${search}%`);
    dataRequest.input('Offset', sql.Int, offset);
    dataRequest.input('Limit', sql.Int, pageSize);
    
    const dataQuery = `
      SELECT *
      FROM dp_system.dbo.App_LichNhanDAT
      WHERE NguoiNhan LIKE @Search OR GhiChu LIKE @Search
      ORDER BY Id DESC OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `;
    
    const result = await dataRequest.query(dataQuery);
    
    return {
      data: result.recordset as DatData[],
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      currentPage: page
    };
  } catch (err) {
    console.error("Error fetching dats:", err);
    return { data: [], totalRecords: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function addDat(data: Partial<DatData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    request.input('SoLuong', sql.Int, data.SoLuong || 0);
    request.input('NgayNhan', sql.NVarChar, data.NgayNhan || null);
    request.input('NguoiNhan', sql.NVarChar, data.NguoiNhan || null);
    request.input('GhiChu', sql.NVarChar, data.GhiChu || null);
    
    await request.query(`
      INSERT INTO dp_system.dbo.App_LichNhanDAT (SoLuong, NgayNhan, NguoiNhan, GhiChu)
      VALUES (@SoLuong, @NgayNhan, @NguoiNhan, @GhiChu)
    `);
    
    revalidatePath('/cars/dat');
    return { success: true };
  } catch (err: any) {
    console.error("Error adding dat:", err);
    return { success: false, error: err.message };
  }
}

export async function updateDat(id: number, data: Partial<DatData>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let setClauses: string[] = [];
    if (data.SoLuong !== undefined) { setClauses.push("SoLuong = @SoLuong"); request.input('SoLuong', sql.Int, data.SoLuong); }
    if (data.NgayNhan !== undefined) { setClauses.push("NgayNhan = @NgayNhan"); request.input('NgayNhan', sql.NVarChar, data.NgayNhan); }
    if (data.NguoiNhan !== undefined) { setClauses.push("NguoiNhan = @NguoiNhan"); request.input('NguoiNhan', sql.NVarChar, data.NguoiNhan); }
    if (data.GhiChu !== undefined) { setClauses.push("GhiChu = @GhiChu"); request.input('GhiChu', sql.NVarChar, data.GhiChu); }
    
    if (setClauses.length === 0) return { success: true };
    
    request.input('Id', sql.Int, id);
    await request.query(`UPDATE dp_system.dbo.App_LichNhanDAT SET ${setClauses.join(', ')} WHERE Id = @Id`);
    
    revalidatePath('/cars/dat');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating dat:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteDat(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Id', sql.Int, id);
    await request.query(`DELETE FROM dp_system.dbo.App_LichNhanDAT WHERE Id = @Id`);
    
    revalidatePath('/cars/dat');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting dat:", err);
    return { success: false, error: err.message };
  }
}

export async function assignCarToTeacher(carId: number, teacherId: number | null, teacherName: string | null) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('CarId', sql.Int, carId);
    if (teacherId !== null) {
      request.input('TeacherId', sql.Int, teacherId);
      request.input('TeacherName', sql.NVarChar, teacherName);
      await request.query(`
        UPDATE dp_system.dbo.App_PhuongTien 
        SET GiaoVienId = @TeacherId, ChuXe = @TeacherName 
        WHERE Id = @CarId
      `);
    } else {
      await request.query(`
        UPDATE dp_system.dbo.App_PhuongTien 
        SET GiaoVienId = NULL, ChuXe = NULL 
        WHERE Id = @CarId
      `);
    }
    
    revalidatePath('/cars');
    revalidatePath('/hr/staff-info');
    return { success: true };
  } catch (err: any) {
    console.error("Error assigning car:", err);
    return { success: false, error: err.message };
  }
}
