"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";
import { revalidatePath } from "next/cache";

export async function getAbsentRecords(type: "TN" | "SH", search: string = "") {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let query = `SELECT * FROM absent_records_inventory WHERE type = @type`;
    
    if (search) {
      query += ` AND (name LIKE @search OR cccd LIKE @search OR storage_location LIKE @search)`;
    }
    
    query += ` ORDER BY id DESC`;

    const req = pool.request();
    req.input('type', sql.VarChar, type);
    if (search) {
      req.input('search', sql.NVarChar, `%${search}%`);
    }

    const result = await req.query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Lỗi khi lấy danh sách hồ sơ vắng rớt:", error);
    return { success: false, error: error.message };
  }
}

export async function addAbsentRecord(data: any) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    
    req.input('type', sql.VarChar, data.type);
    req.input('cccd', sql.VarChar, data.cccd || '');
    req.input('sbd', sql.VarChar, data.sbd || '');
    req.input('name', sql.NVarChar, data.name || '');
    req.input('hang', sql.VarChar, data.hang || '');
    req.input('original_exam_date', sql.VarChar, data.original_exam_date || '');
    req.input('result', sql.NVarChar, data.result || '');
    req.input('storage_location', sql.NVarChar, data.storage_location || '');
    req.input('note', sql.NVarChar, data.note || '');

    await req.query(`
      INSERT INTO absent_records_inventory 
      (type, cccd, sbd, name, hang, original_exam_date, result, storage_location, note)
      VALUES 
      (@type, @cccd, @sbd, @name, @hang, @original_exam_date, @result, @storage_location, @note)
    `);

    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi thêm hồ sơ vắng rớt:", error);
    return { success: false, error: error.message };
  }
}

export async function checkoutAbsentRecord(id: number, target_exam_date: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    
    req.input('id', sql.Int, id);
    req.input('target_exam_date', sql.VarChar, target_exam_date);

    await req.query(`
      UPDATE absent_records_inventory 
      SET status = N'Đã xuất kho', checkout_date = GETDATE(), target_exam_date = @target_exam_date, updated_at = GETDATE()
      WHERE id = @id
    `);

    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xuất kho hồ sơ vắng rớt:", error);
    return { success: false, error: error.message };
  }
}

export async function returnAbsentRecord(id: number, storage_location: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    
    req.input('id', sql.Int, id);
    req.input('storage_location', sql.NVarChar, storage_location);

    await req.query(`
      UPDATE absent_records_inventory 
      SET status = N'Đang lưu kho', storage_location = @storage_location, updated_at = GETDATE()
      WHERE id = @id
    `);

    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi nhập lại kho hồ sơ vắng rớt:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAbsentRecord(id: number) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('id', sql.Int, id);

    await req.query(`DELETE FROM absent_records_inventory WHERE id = @id`);
    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xoá hồ sơ vắng rớt:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAbsentRecordLocation(id: number, storage_location: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    
    req.input('id', sql.Int, id);
    req.input('storage_location', sql.NVarChar, storage_location);

    await req.query(`
      UPDATE absent_records_inventory 
      SET storage_location = @storage_location, updated_at = GETDATE()
      WHERE id = @id
    `);

    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật vị trí lưu kho:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAbsentRecord(id: number, data: any) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    
    req.input('id', sql.Int, id);
    req.input('hang', sql.VarChar, data.hang || '');
    req.input('original_exam_date', sql.VarChar, data.original_exam_date || '');
    req.input('result', sql.NVarChar, data.result || '');
    req.input('storage_location', sql.NVarChar, data.storage_location || '');
    req.input('note', sql.NVarChar, data.note || '');

    await req.query(`
      UPDATE absent_records_inventory 
      SET 
        hang = @hang,
        original_exam_date = @original_exam_date,
        result = @result,
        storage_location = @storage_location,
        note = @note,
        updated_at = GETDATE()
      WHERE id = @id
    `);

    revalidatePath('/absent/testing');
    revalidatePath('/absent/graduation');
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật hồ sơ:", error);
    return { success: false, error: error.message };
  }
}

export async function getStudentInfoByCCCD(cccd: string, type: "TN" | "SH") {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('cccd', sql.VarChar, cccd);

    let query = "";
    if (type === "TN") {
      query = `SELECT TOP 1 cccd, sbd, name, hang, exam_date as original_exam_date, kq_final as result, gv FROM graduation_students WHERE cccd = @cccd ORDER BY id DESC`;
    } else {
      query = `SELECT TOP 1 cccd, sbd, name, hang, exam_date as original_exam_date, kq_final as result, gv FROM students WHERE cccd = @cccd ORDER BY id DESC`;
    }

    const result = await req.query(query);
    if (result.recordset.length > 0) {
      return { success: true, data: result.recordset[0] };
    }
    return { success: false, error: "Không tìm thấy học viên" };
  } catch (error: any) {
    console.error("Lỗi khi tìm học viên:", error);
    return { success: false, error: error.message };
  }
}

export async function searchStudentsByCCCD(queryStr: string, type?: "TN" | "SH") {
  try {
    const cleanQuery = queryStr ? queryStr.trim() : "";
    if (cleanQuery.length < 3) return { success: true, data: [] };
    
    if (type === "TN" || type === "SH") {
      const pool = await getDbConnection("DP_SH_System");
      const req = pool.request();
      req.input('queryStr', sql.VarChar, `%${cleanQuery}%`);

      let query = "";
      if (type === "TN") {
        query = `
          SELECT TOP 10 
            cccd, sbd, name, hang, exam_date as original_exam_date, kq_final as result, gv 
          FROM graduation_students 
          WHERE cccd LIKE @queryStr
          ORDER BY id DESC
        `;
      } else {
        query = `
          SELECT TOP 10 
            cccd, sbd, name, hang, exam_date as original_exam_date, kq_final as result, gv 
          FROM students 
          WHERE cccd LIKE @queryStr
          ORDER BY id DESC
        `;
      }
      
      const result = await req.query(query);
      if (result.recordset.length > 0) {
        return { success: true, data: result.recordset };
      }
    }

    // Fallback to general system if no type provided OR if no result found in DP_SH_System
    const pool = await getDbConnection(process.env.SQL_DATABASE || "dp_system");
    const req = pool.request();
    req.input('queryStr', sql.VarChar, `%${cleanQuery}%`);

    let query = `
      SELECT TOP 5 
        v.CCCD as cccd, 
        v.HoTen as name, 
        a.Hang as hang
      FROM App_HocVien_V2 v
      LEFT JOIN App_Khoa a ON v.MaKhoa = a.MaKhoa
      WHERE v.CCCD LIKE @queryStr
    `;

    const result = await req.query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Lỗi khi tìm học viên:", error);
    return { success: false, error: error.message };
  }
}
