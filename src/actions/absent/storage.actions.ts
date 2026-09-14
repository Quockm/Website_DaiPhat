"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";

export async function getStorageLocations() {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const result = await pool.request().query(`
      SELECT * FROM absent_storage_locations ORDER BY name ASC
    `);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Lỗi khi lấy danh sách ngăn xếp:", error);
    return { success: false, error: error.message };
  }
}

export async function addStorageLocation(name: string, code: string = "", description: string = "") {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('name', sql.NVarChar, name);
    req.input('code', sql.NVarChar, code);
    req.input('description', sql.NVarChar, description);

    await req.query(`
      INSERT INTO absent_storage_locations (name, code, description)
      VALUES (@name, @code, @description)
    `);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi thêm ngăn xếp:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteStorageLocation(id: number) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('id', sql.Int, id);

    await req.query(`DELETE FROM absent_storage_locations WHERE id = @id`);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xoá ngăn xếp:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStorageLocation(id: number, name: string, code: string, description: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('id', sql.Int, id);
    req.input('name', sql.NVarChar, name);
    req.input('code', sql.NVarChar, code);
    req.input('description', sql.NVarChar, description);

    await req.query(`
      UPDATE absent_storage_locations
      SET name = @name, code = @code, description = @description
      WHERE id = @id
    `);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật ngăn xếp:", error);
    return { success: false, error: error.message };
  }
}
