"use server";

import { getDbConnection } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type TeacherDocRecord = {
  Id: number;
  GiaoVienId: number;
  LoaiHoSo: string;
  FileUrl: string;
  UploadedAt: string;
};

export type CarDocRecord = {
  Id: number;
  PhuongTienId: number;
  LoaiHoSo: string;
  FileUrl: string;
  UploadedAt: string;
};

export async function getTeacherDocs(giaoVienId: number): Promise<TeacherDocRecord[]> {
  try {
    const pool = await getDbConnection('dp_system');
    const result = await pool.request()
      .input('giaoVienId', giaoVienId)
      .query(`
        SELECT Id, GiaoVienId, LoaiHoSo, FileUrl, UploadedAt
        FROM App_GiaoVien_HoSo
        WHERE GiaoVienId = @giaoVienId
        ORDER BY UploadedAt DESC
      `);
    return result.recordset;
  } catch (err) {
    console.error("Error getting teacher docs", err);
    return [];
  }
}

export async function getCarDocs(phuongTienId: number): Promise<CarDocRecord[]> {
  try {
    const pool = await getDbConnection('dp_system');
    const result = await pool.request()
      .input('phuongTienId', phuongTienId)
      .query(`
        SELECT Id, PhuongTienId, LoaiHoSo, FileUrl, UploadedAt
        FROM App_PhuongTien_HoSo
        WHERE PhuongTienId = @phuongTienId
        ORDER BY UploadedAt DESC
      `);
    return result.recordset;
  } catch (err) {
    console.error("Error getting car docs", err);
    return [];
  }
}

export async function saveTeacherDoc(giaoVienId: number, loaiHoSo: string, fileUrl: string) {
  try {
    const pool = await getDbConnection('dp_system');
    await pool.request()
      .input('giaoVienId', giaoVienId)
      .input('loaiHoSo', loaiHoSo)
      .input('fileUrl', fileUrl)
      .query(`
        INSERT INTO App_GiaoVien_HoSo (GiaoVienId, LoaiHoSo, FileUrl)
        VALUES (@giaoVienId, @loaiHoSo, @fileUrl)
      `);
    revalidatePath('/archive');
    return { success: true };
  } catch (err: any) {
    console.error("Error saving teacher doc", err);
    return { success: false, error: err.message };
  }
}

export async function deleteTeacherDoc(id: number) {
  try {
    const pool = await getDbConnection('dp_system');
    await pool.request()
      .input('id', id)
      .query(`DELETE FROM App_GiaoVien_HoSo WHERE Id = @id`);
    revalidatePath('/archive');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting teacher doc", err);
    return { success: false, error: err.message };
  }
}

export async function saveCarDoc(phuongTienId: number, loaiHoSo: string, fileUrl: string) {
  try {
    const pool = await getDbConnection('dp_system');
    await pool.request()
      .input('phuongTienId', phuongTienId)
      .input('loaiHoSo', loaiHoSo)
      .input('fileUrl', fileUrl)
      .query(`
        INSERT INTO App_PhuongTien_HoSo (PhuongTienId, LoaiHoSo, FileUrl)
        VALUES (@phuongTienId, @loaiHoSo, @fileUrl)
      `);
    revalidatePath('/archive');
    return { success: true };
  } catch (err: any) {
    console.error("Error saving car doc", err);
    return { success: false, error: err.message };
  }
}

export async function deleteCarDoc(id: number) {
  try {
    const pool = await getDbConnection('dp_system');
    await pool.request()
      .input('id', id)
      .query(`DELETE FROM App_PhuongTien_HoSo WHERE Id = @id`);
    revalidatePath('/archive');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting car doc", err);
    return { success: false, error: err.message };
  }
}
