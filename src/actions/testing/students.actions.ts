"use server";

import { getDbConnection } from "@/lib/db";
import sql from "mssql";

export async function getTestingStudents(scheduleId?: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    let query = `
      SELECT 
        s.cccd, s.stt, s.sbd, s.name, s.dob, s.school, s.hang, s.pet, s.exam_date,
        s.qr_lt, s.qr_hinh, s.qr_duong, s.qr_gplx,
        s.score_lt, s.score_hinh, s.score_duong, s.kq_final,
        s.result_lt, s.result_hinh, s.result_duong,
        s.gv, s.ndsh, s.ma_dk,
        s.is_health_check, s.is_profile_valid,
        g.exam_date as tn_exam_date,
        g.kq_final as tn_kq_final
      FROM students s
      LEFT JOIN graduation_students g ON LTRIM(RTRIM(s.cccd)) = LTRIM(RTRIM(g.cccd))
    `;
    
    let request = pool.request();
    
    if (scheduleId) {
      // Look up exam_date by scheduleId
      const schReq = pool.request();
      schReq.input('sid', sql.Int, parseInt(scheduleId));
      const schRes = await schReq.query(`SELECT exam_date FROM exam_schedules WHERE id = @sid`);
      
      if (schRes.recordset.length > 0) {
        const eDate = schRes.recordset[0].exam_date;
        query += ` WHERE s.exam_date = @eDate`;
        request = pool.request(); // Recreate request to avoid parameter clashes if any
        request.input('eDate', sql.VarChar, eDate);
      } else {
        query += ` WHERE s.exam_date = @scheduleId`;
        request = pool.request();
        request.input('scheduleId', sql.VarChar, scheduleId);
      }
    } else {
      query += ` WHERE s.exam_date != '31-07-2026' OR s.exam_date IS NULL OR s.exam_date = ''`;
      request = pool.request();
    }
    
    query += ` ORDER BY TRY_CAST(s.stt AS INT) ASC`;
    
    const result = await request.query(query);
    
    return { success: true, data: result.recordset };
  } catch (error: any) {
    console.error("Lỗi khi lấy danh sách học viên sát hạch:", error);
    return { success: false, error: error.message };
  }
}

export async function syncGraduationToTesting() {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    // Tìm những học viên có kq_final = 'ĐẠT' ở Tốt nghiệp nhưng chưa có trong Sát hạch
    await pool.request().query(`
      INSERT INTO students (cccd, name, dob, school, hang)
      SELECT LTRIM(RTRIM(g.cccd)), g.name, g.dob, g.school, g.hang
      FROM graduation_students g
      LEFT JOIN students s ON LTRIM(RTRIM(g.cccd)) = LTRIM(RTRIM(s.cccd))
      WHERE (LTRIM(RTRIM(UPPER(g.kq_final))) = N'ĐẠT' OR LTRIM(RTRIM(UPPER(g.kq_final))) = 'DAT')
        AND s.cccd IS NULL
        AND g.cccd IS NOT NULL
        AND LTRIM(RTRIM(g.cccd)) != ''
    `);
    
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi đồng bộ dữ liệu TN -> SH:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadKQSH(rows: any[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    // Process sequentially to avoid deadlocks or too many concurrent requests
    for (const row of rows) {
      if (!row.cccd) continue;
      
      const request = pool.request();
      request.input('cccd', sql.NVarChar, row.cccd);
      
      let setClauses: string[] = [];
      
      if (row.score_lt !== undefined) {
        request.input('score_lt', sql.NVarChar, row.score_lt);
        setClauses.push("score_lt = @score_lt");
      }
      if (row.result_lt !== undefined) {
        request.input('result_lt', sql.NVarChar, row.result_lt);
        setClauses.push("result_lt = @result_lt");
      }
      if (row.score_hinh !== undefined) {
        request.input('score_hinh', sql.NVarChar, row.score_hinh);
        setClauses.push("score_hinh = @score_hinh");
      }
      if (row.result_hinh !== undefined) {
        request.input('result_hinh', sql.NVarChar, row.result_hinh);
        setClauses.push("result_hinh = @result_hinh");
      }
      if (row.score_duong !== undefined) {
        request.input('score_duong', sql.NVarChar, row.score_duong);
        setClauses.push("score_duong = @score_duong");
      }
      if (row.result_duong !== undefined) {
        request.input('result_duong', sql.NVarChar, row.result_duong);
        setClauses.push("result_duong = @result_duong");
      }
      if (row.kq_final !== undefined) {
        request.input('kq_final', sql.NVarChar, row.kq_final);
        setClauses.push("kq_final = @kq_final");
      }

      if (setClauses.length > 0) {
        const query = `UPDATE students SET ${setClauses.join(", ")} WHERE cccd = @cccd`;
        await request.query(query);
      }
    }
    
    return { success: true, updated: rows.length };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật KQSH:", error);
    return { success: false, error: error.message };
  }
}

export async function addTestingStudents(students: any[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let addedCount = 0;

    for (const st of students) {
      if (!st.cccd) continue;

      // Check if exists
      const checkReq = pool.request();
      checkReq.input('cccd', sql.VarChar, st.cccd);
      const checkRes = await checkReq.query(`SELECT cccd FROM students WHERE cccd = @cccd`);

      if (checkRes.recordset.length > 0) {
        // Update basic info
        const updateReq = pool.request();
        updateReq.input('cccd', sql.VarChar, st.cccd);
        updateReq.input('stt', sql.VarChar, st.stt || '');
        updateReq.input('sbd', sql.VarChar, st.sbd || '');
        updateReq.input('name', sql.NVarChar, st.name || '');
        updateReq.input('dob', sql.VarChar, st.dob || '');
        updateReq.input('school', sql.NVarChar, st.school || '');
        updateReq.input('hang', sql.VarChar, st.hang || '');
        updateReq.input('exam_date', sql.VarChar, st.exam_date || '');
        updateReq.input('ma_dk', sql.VarChar, st.ma_dk || '');
        updateReq.input('gv', sql.NVarChar, st.gv || '');
        updateReq.input('ndsh', sql.NVarChar, st.ndsh || '');

        await updateReq.query(`
          UPDATE students 
          SET stt = @stt, sbd = @sbd, name = @name, dob = @dob, school = @school, hang = @hang, exam_date = @exam_date, ma_dk = @ma_dk, gv = @gv, ndsh = @ndsh
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
        insReq.input('ma_dk', sql.VarChar, st.ma_dk || '');
        insReq.input('gv', sql.NVarChar, st.gv || '');
        insReq.input('ndsh', sql.NVarChar, st.ndsh || '');

        await insReq.query(`
          INSERT INTO students (cccd, stt, sbd, name, dob, school, hang, exam_date, ma_dk, gv, ndsh)
          VALUES (@cccd, @stt, @sbd, @name, @dob, @school, @hang, @exam_date, @ma_dk, @gv, @ndsh)
        `);
        addedCount++;
      }
    }

    return { success: true, message: `Đã xử lý ${students.length} học viên. Thêm mới ${addedCount}.` };
  } catch (error: any) {
    console.error("Lỗi khi thêm danh sách học viên sát hạch:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSbdNdsh(students: any[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let updatedCount = 0;

    for (const st of students) {
      if (!st.cccd) continue;
      
      const req = pool.request();
      req.input('cccd', sql.VarChar, st.cccd);
      req.input('sbd', sql.VarChar, st.sbd || '');
      req.input('ndsh', sql.NVarChar, st.ndsh || '');
      req.input('gv', sql.NVarChar, st.gv || '');
      
      await req.query(`
        UPDATE students 
        SET sbd = @sbd, ndsh = @ndsh, gv = @gv 
        WHERE cccd = @cccd
      `);
      updatedCount++;
    }
    return { success: true, message: `Đã cập nhật ${updatedCount} học viên.` };
  } catch (error: any) {
    console.error("Lỗi cập nhật SBD/NDSH:", error);
    return { success: false, error: error.message };
  }
}

export async function updateQrCodes(exam_date: string, qrType: string, qrDataList: {cccd: string, qr_data: string}[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    let updatedCount = 0;
    const qrColumn = qrType === 'hinh' ? 'qr_hinh' : qrType === 'duong' ? 'qr_duong' : 'qr_gplx';
    
    for (const item of qrDataList) {
      if (!item.cccd || !item.qr_data) continue;
      
      const updReq = pool.request();
      updReq.input('cccd', sql.VarChar, item.cccd);
      updReq.input('qr_data', sql.NVarChar, item.qr_data);
      updReq.input('exam_date', sql.VarChar, exam_date);
      
      const res = await updReq.query(`UPDATE students SET ${qrColumn} = @qr_data WHERE cccd = @cccd`);
      if (res.rowsAffected[0] > 0) {
        updatedCount++;
      }
    }
    
    return { success: true, message: `Đã cập nhật ${updatedCount} mã QR ${qrType.toUpperCase()}.` };
  } catch (error: any) {
    console.error("Lỗi cập nhật mã QR:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStudentXmlData(xmlDataList: any[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let updatedCount = 0;
    
    for (const data of xmlDataList) {
      if (!data.cccd) continue;
      
      const req = pool.request();
      req.input('cccd', sql.VarChar, data.cccd);
      
      let setClauses: string[] = [];
      if (data.pet) {
        req.input('pet', sql.VarChar, data.pet);
        setClauses.push("pet = @pet");
      }
      
      if (setClauses.length > 0) {
        await req.query(`UPDATE students SET ${setClauses.join(", ")} WHERE cccd = @cccd`);
        updatedCount++;
      }
    }
    
    return { success: true, message: `Đã xử lý ${xmlDataList.length} file XML. Cập nhật thành công ${updatedCount} học viên.` };
  } catch (error: any) {
    console.error("Lỗi cập nhật dữ liệu XML:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSTTData(sttDataList: {cccd: string, stt: string}[]) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    let updatedCount = 0;
    
    for (const data of sttDataList) {
      if (!data.cccd || !data.stt) continue;
      
      const req = pool.request();
      req.input('cccd', sql.VarChar, data.cccd);
      req.input('stt', sql.VarChar, data.stt);
      
      const res = await req.query(`UPDATE students SET stt = @stt WHERE cccd = @cccd`);
      if (res.rowsAffected[0] > 0) {
        updatedCount++;
      }
    }
    
    return { success: true, message: `Cập nhật thành công STT cho ${updatedCount} học viên.` };
  } catch (error: any) {
    console.error("Lỗi cập nhật STT:", error);
    return { success: false, error: error.message };
  }
}

export async function assignTestingExamDates(cccds: string[], examDate: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    for (const cccd of cccds) {
      const req = pool.request();
      req.input('cccd', sql.VarChar, cccd);
      req.input('exam_date', sql.VarChar, examDate);
      await req.query(`
        UPDATE students 
        SET exam_date = @exam_date
        WHERE cccd = @cccd
      `);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xếp lịch thi SH:", error);
    return { success: false, error: error.message };
  }
}

export async function unassignTestingExamDate(cccd: string) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('cccd', sql.VarChar, cccd);
    await req.query(`
      UPDATE students 
      SET exam_date = NULL
      WHERE cccd = @cccd
    `);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi hủy lịch thi SH:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTestingCheck(cccd: string, field: 'is_health_check' | 'is_profile_valid', value: boolean) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    const req = pool.request();
    req.input('cccd', sql.VarChar, cccd);
    req.input('val', sql.Bit, value ? 1 : 0);
    // Secure query since field is typed strictly
    await req.query(`
      UPDATE students 
      SET ${field} = @val
      WHERE cccd = @cccd
    `);
    return { success: true };
  } catch (error: any) {
    console.error(`Lỗi cập nhật ${field}:`, error);
    return { success: false, error: error.message };
  }
}
