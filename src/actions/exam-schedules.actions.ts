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

export async function saveKqshResults(schedule_id: number, results: any[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    // First, clear existing results for this schedule to avoid duplicates
    await pool.request()
      .input("schedule_id", sql.Int, schedule_id)
      .query(`DELETE FROM kqsh_results WHERE schedule_id = @schedule_id`);
      
    // Insert new results
    for (const r of results) {
      await pool.request()
        .input("schedule_id", sql.Int, schedule_id)
        .input("ma_ky_sh", sql.NVarChar, r.ma_ky_sh != null ? String(r.ma_ky_sh) : "")
        .input("stt", sql.NVarChar, r.stt != null ? String(r.stt) : "")
        .input("sbd", sql.NVarChar, r.sbd != null ? String(r.sbd) : "")
        .input("name", sql.NVarChar, r.name != null ? String(r.name) : "")
        .input("cccd", sql.NVarChar, r.cccd != null ? String(r.cccd) : "")
        .input("ngay_sinh", sql.NVarChar, r.ngay_sinh != null ? String(r.ngay_sinh) : "")
        .input("gioi_tinh", sql.NVarChar, r.gioi_tinh != null ? String(r.gioi_tinh) : "")
        .input("quoc_tich", sql.NVarChar, r.quoc_tich != null ? String(r.quoc_tich) : "")
        .input("noi_cu_tru", sql.NVarChar, r.noi_cu_tru != null ? String(r.noi_cu_tru) : "")
        .input("hang", sql.NVarChar, r.hang != null ? String(r.hang) : "")
        .input("ndsh", sql.NVarChar, r.ndsh != null ? String(r.ndsh) : "")
        .input("score_lt", sql.NVarChar, r.score_lt != null ? String(r.score_lt) : "")
        .input("result_lt", sql.NVarChar, r.result_lt != null ? String(r.result_lt) : "")
        .input("score_hinh", sql.NVarChar, r.score_hinh != null ? String(r.score_hinh) : "")
        .input("result_hinh", sql.NVarChar, r.result_hinh != null ? String(r.result_hinh) : "")
        .input("score_duong", sql.NVarChar, r.score_duong != null ? String(r.score_duong) : "")
        .input("result_duong", sql.NVarChar, r.result_duong != null ? String(r.result_duong) : "")
        .input("kq_final", sql.NVarChar, r.kq_final != null ? String(r.kq_final) : "")
        .input("gv", sql.NVarChar, r.gv != null ? String(r.gv) : "")
        .input("exam_date", sql.NVarChar, r.exam_date != null ? String(r.exam_date) : "")
        .query(`
          INSERT INTO kqsh_results (
            schedule_id, ma_ky_sh, stt, sbd, name, cccd, ngay_sinh, gioi_tinh, quoc_tich, noi_cu_tru, hang, ndsh, score_lt, result_lt, score_hinh, result_hinh, score_duong, result_duong, kq_final, gv, exam_date
          )
          VALUES (
            @schedule_id, @ma_ky_sh, @stt, @sbd, @name, @cccd, @ngay_sinh, @gioi_tinh, @quoc_tich, @noi_cu_tru, @hang, @ndsh, @score_lt, @result_lt, @score_hinh, @result_hinh, @score_duong, @result_duong, @kq_final, @gv, @exam_date
          )
        `);
        
      // Đồng thời cập nhật trạng thái đậu rớt vào bảng students (để Xét điều kiện dự thi)
      if (r.cccd) {
        await pool.request()
          .input("cccd", sql.NVarChar, r.cccd != null ? String(r.cccd) : "")
          .input("kq_final", sql.NVarChar, r.kq_final != null ? String(r.kq_final) : "")
          .input("result_lt", sql.NVarChar, r.result_lt != null ? String(r.result_lt) : "")
          .input("result_hinh", sql.NVarChar, r.result_hinh != null ? String(r.result_hinh) : "")
          .input("result_duong", sql.NVarChar, r.result_duong != null ? String(r.result_duong) : "")
          .query(`
            UPDATE students 
            SET kq_final = @kq_final, 
                result_lt = @result_lt, 
                result_hinh = @result_hinh, 
                result_duong = @result_duong
            WHERE cccd = @cccd
          `);
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error saving kqsh results:", error);
    return { success: false, error: error.message };
  }
}

export async function getKqshResults(schedule_id: number) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const result = await pool.request()
      .input("schedule_id", sql.Int, schedule_id)
      .query(`
        SELECT k.* 
        FROM kqsh_results k 
        WHERE k.schedule_id = @schedule_id 
        ORDER BY CAST(k.stt AS INT)
      `);
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Error getting kqsh results:", error);
    return { success: false, error: error.message, data: [] };
  }
}
