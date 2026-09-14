"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";

export async function getExamSchedules(type?: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let query = `
      SELECT id, type, exam_date, title, location, student_count, created_at
      FROM exam_schedules
    `;
    if (type) {
      query += ` WHERE type = @type`;
    }
    query += ` ORDER BY exam_date DESC`;

    const req = pool.request();
    if (type) {
      req.input("type", sql.VarChar, type);
    }
    
    const result = await req.query(query);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Error fetching exam schedules:", error);
    return { success: false, error: error.message };
  }
}

export async function addExamSchedule(type: string, exam_date: string, title: string, location?: string, student_count?: number) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    await pool.request()
      .input("type", sql.VarChar, type)
      .input("exam_date", sql.VarChar, exam_date)
      .input("title", sql.NVarChar, title)
      .input("location", sql.NVarChar, location || null)
      .input("student_count", sql.Int, student_count || null)
      .query(`
        INSERT INTO exam_schedules (type, exam_date, title, location, student_count)
        VALUES (@type, @exam_date, @title, @location, @student_count)
      `);
    return { success: true, message: "Tạo lịch thi thành công" };
  } catch (error: any) {
    console.error("Error adding exam schedule:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteExamSchedule(id: number) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    await pool.request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM exam_schedules WHERE id = @id`);
    return { success: true, message: "Đã xóa lịch thi" };
  } catch (error: any) {
    console.error("Error deleting exam schedule:", error);
    return { success: false, error: error.message };
  }
}
