"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";

export async function getGraduationStudents() {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const defaultDb = process.env.SQL_DATABASE || 'dp_system';
    const result = await pool.request().query(`
      SELECT 
        g.id, g.cccd, g.stt, g.sbd, g.name, g.dob, g.school, g.hang, g.exam_date,
        g.files_data, g.has_5_pdf_lt, g.has_file_dat, g.has_file_mp, g.has_xang_dau,
        g.diem_luat, g.diem_mo_phong, g.diem_hinh, g.diem_duong, g.kq_final, g.is_retake,
        g.file_completion_date,
        h.MaKhoa as khoa,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM DP_SH_System.dbo.print_logs WHERE entity_type = 'STUDENT' AND entity_id = g.cccd AND document_type = 'HOP_DONG') THEN 1 ELSE 0 END AS BIT) as in_hop_dong,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM DP_SH_System.dbo.print_logs WHERE entity_type = 'STUDENT' AND entity_id = g.cccd AND document_type = 'THANH_LY') THEN 1 ELSE 0 END AS BIT) as in_thanh_ly,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM DP_SH_System.dbo.print_logs WHERE entity_type = 'STUDENT' AND entity_id = g.cccd AND document_type = 'PHIEU_THU') THEN 1 ELSE 0 END AS BIT) as in_phieu_thu
      FROM DP_SH_System.dbo.graduation_students g
      LEFT JOIN ${defaultDb}.dbo.App_HocVien_V2 h ON g.cccd = h.CCCD
      ORDER BY TRY_CAST(g.stt AS INT) ASC, g.id DESC
    `);
    
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Lỗi khi lấy danh sách học viên tốt nghiệp:", error);
    return { success: false, error: error.message };
  }
}

export async function addGraduationStudents(students: any[], isRetake = false) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let addedCount = 0;

    for (const st of students) {
      if (!st.cccd) continue;

      // Check if exists
      const checkReq = pool.request();
      checkReq.input('cccd', sql.VarChar, st.cccd);
      const checkRes = await checkReq.query(`SELECT id FROM graduation_students WHERE cccd = @cccd`);

      if (checkRes.recordset.length > 0) {
        // Update basic info or just skip if it's new list
        const updateReq = pool.request();
        updateReq.input('cccd', sql.VarChar, st.cccd);
        updateReq.input('stt', sql.VarChar, st.stt || '');
        updateReq.input('sbd', sql.VarChar, st.sbd || '');
        updateReq.input('name', sql.NVarChar, st.name || '');
        updateReq.input('dob', sql.VarChar, st.dob || '');
        updateReq.input('school', sql.NVarChar, st.school || '');
        updateReq.input('hang', sql.VarChar, st.hang || '');
        updateReq.input('is_retake', sql.Bit, isRetake ? 1 : 0);

        await updateReq.query(`
          UPDATE graduation_students 
          SET stt = @stt, sbd = @sbd, name = @name, dob = @dob, school = @school, hang = @hang, is_retake = @is_retake, updated_at = GETDATE()
          WHERE cccd = @cccd
        `);
      } else {
        // Insert new
        const insReq = pool.request();
        insReq.input('cccd', sql.VarChar, st.cccd);
        insReq.input('stt', sql.VarChar, st.stt || '');
        insReq.input('sbd', sql.VarChar, st.sbd || '');
        insReq.input('name', sql.NVarChar, st.name || '');
        insReq.input('dob', sql.VarChar, st.dob || '');
        insReq.input('school', sql.NVarChar, st.school || '');
        insReq.input('hang', sql.VarChar, st.hang || '');
        insReq.input('exam_date', sql.VarChar, st.exam_date || '');
        insReq.input('is_retake', sql.Bit, isRetake ? 1 : 0);

        await insReq.query(`
          INSERT INTO graduation_students (cccd, stt, sbd, name, dob, school, hang, exam_date, is_retake)
          VALUES (@cccd, @stt, @sbd, @name, @dob, @school, @hang, @exam_date, @is_retake)
        `);
        addedCount++;
      }
    }

    return { success: true, message: `Đã xử lý ${students.length} học viên. Thêm mới ${addedCount}.` };
  } catch (error: any) {
    console.error("Lỗi khi thêm danh sách thi tốt nghiệp:", error);
    return { success: false, error: error.message };
  }
}

export async function updateEligibility(cccd: string, data: any) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('cccd', sql.VarChar, cccd);
    
    let updates: string[] = [];
    if (data.has_5_pdf_lt !== undefined) {
      req.input('has_5_pdf_lt', sql.Bit, data.has_5_pdf_lt);
      updates.push("has_5_pdf_lt = @has_5_pdf_lt");
    }
    if (data.has_file_dat !== undefined) {
      req.input('has_file_dat', sql.Bit, data.has_file_dat);
      updates.push("has_file_dat = @has_file_dat");
    }
    if (data.has_file_mp !== undefined) {
      req.input('has_file_mp', sql.Bit, data.has_file_mp);
      updates.push("has_file_mp = @has_file_mp");
    }
    if (data.has_xang_dau !== undefined) {
      req.input('has_xang_dau', sql.Bit, data.has_xang_dau);
      updates.push("has_xang_dau = @has_xang_dau");
    }
    if (data.files_data !== undefined) {
      req.input('files_data', sql.NVarChar, data.files_data);
      updates.push("files_data = @files_data");
    }

    if (updates.length === 0) return { success: true };

    updates.push("updated_at = GETDATE()");
    await req.query(`UPDATE graduation_students SET ${updates.join(', ')} WHERE cccd = @cccd`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật điều kiện:", error);
    return { success: false, error: error.message };
  }
}

export async function updateScores(cccd: string, data: any) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('cccd', sql.VarChar, cccd);
    
    let updates: string[] = [];
    if (data.diem_luat !== undefined) {
      req.input('diem_luat', sql.VarChar, data.diem_luat);
      updates.push("diem_luat = @diem_luat");
    }
    if (data.diem_mo_phong !== undefined) {
      req.input('diem_mo_phong', sql.VarChar, data.diem_mo_phong);
      updates.push("diem_mo_phong = @diem_mo_phong");
    }
    if (data.diem_hinh !== undefined) {
      req.input('diem_hinh', sql.VarChar, data.diem_hinh);
      updates.push("diem_hinh = @diem_hinh");
    }
    if (data.diem_duong !== undefined) {
      req.input('diem_duong', sql.VarChar, data.diem_duong);
      updates.push("diem_duong = @diem_duong");
    }
    if (data.kq_final !== undefined) {
      req.input('kq_final', sql.NVarChar, data.kq_final);
      updates.push("kq_final = @kq_final");
    }

    if (updates.length === 0) return { success: true };

    updates.push("updated_at = GETDATE()");
    await req.query(`UPDATE graduation_students SET ${updates.join(', ')} WHERE cccd = @cccd`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật điểm:", error);
    return { success: false, error: error.message };
  }
}

export async function assignExamDates(cccds: string[], examDate: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    // We update all CCCDs in one go, or iteratively. 
    // Mssql has a limit on parameters, but if cccds is not huge, we can use an IN clause or iterate.
    // Iterating is safe for now.
    for (const cccd of cccds) {
      const req = pool.request();
      req.input('cccd', sql.VarChar, cccd);
      req.input('exam_date', sql.VarChar, examDate);
      await req.query(`
        UPDATE graduation_students 
        SET exam_date = @exam_date, updated_at = GETDATE()
        WHERE cccd = @cccd
      `);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xếp lịch thi:", error);
    return { success: false, error: error.message };
  }
}

export async function unassignExamDate(cccd: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('cccd', sql.VarChar, cccd);
    await req.query(`
      UPDATE graduation_students 
      SET exam_date = NULL, updated_at = GETDATE()
      WHERE cccd = @cccd
    `);
    
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi hủy lịch thi:", error);
    return { success: false, error: error.message };
  }
}
