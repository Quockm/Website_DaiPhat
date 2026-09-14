"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getZaloConfig() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query("SELECT TOP 1 * FROM ZaloZNS_Config");
    // pool.close(); // Managed by db.ts
    return result.recordset[0] || null;
  } catch (err) {
    console.error("Error fetching Zalo config:", err);
    return null;
  }
}

export async function updateZaloConfig(data: {
  AppID: string;
  SecretKey: string;
  AccessToken: string;
  RefreshToken: string;
  TemplateID_Moto: string;
  TemplateID_Oto: string;
  TemplateID_Oto_Stage2: string;
}) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('AppID', sql.NVarChar, data.AppID)
      .input('SecretKey', sql.NVarChar, data.SecretKey)
      .input('AccessToken', sql.NVarChar, data.AccessToken)
      .input('RefreshToken', sql.NVarChar, data.RefreshToken)
      .input('TemplateID_Moto', sql.NVarChar, data.TemplateID_Moto)
      .input('TemplateID_Oto', sql.NVarChar, data.TemplateID_Oto)
      .input('TemplateID_Oto_Stage2', sql.NVarChar, data.TemplateID_Oto_Stage2)
      .query(`
        UPDATE ZaloZNS_Config 
        SET AppID = @AppID, 
            SecretKey = @SecretKey, 
            AccessToken = @AccessToken, 
            RefreshToken = @RefreshToken, 
            TemplateID_Moto = @TemplateID_Moto, 
            TemplateID_Oto = @TemplateID_Oto,
            TemplateID_Oto_Stage2 = @TemplateID_Oto_Stage2
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/zalo-oa/config');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating Zalo config:", err);
    return { success: false, error: err.message };
  }
}

export async function refreshZaloToken() {
  const config = await getZaloConfig();
  if (!config || !config.AppID || !config.SecretKey || !config.RefreshToken) {
    return { success: false, error: "Thiếu thông tin cấu hình Zalo OA gốc." };
  }

  try {
    const url = "https://oauth.zaloapp.com/v4/oa/access_token";
    const body = new URLSearchParams();
    body.append('app_id', config.AppID);
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', config.RefreshToken);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': config.SecretKey
      },
      body: body.toString()
    });

    const data = await res.json();
    if (data.access_token && data.refresh_token) {
      const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
      await pool.request()
        .input('AccessToken', sql.NVarChar, data.access_token)
        .input('RefreshToken', sql.NVarChar, data.refresh_token)
        .query(`
          UPDATE ZaloZNS_Config 
          SET AccessToken = @AccessToken, 
              RefreshToken = @RefreshToken,
              LastRefresh = GETDATE()
        `);
      // pool.close(); // Managed by db.ts
      revalidatePath('/zalo-oa/config');
      return { success: true };
    } else {
      return { success: false, error: data.error_name || "Lỗi phản hồi từ hệ thống Zalo" };
    }
  } catch (err: any) {
    console.error("Error refreshing Zalo token:", err);
    return { success: false, error: "Lỗi kết nối: " + err.message };
  }
}

export async function checkZaloConnection(providedToken?: string) {
  let token = providedToken;
  if (!token) {
    const config = await getZaloConfig();
    token = config?.AccessToken;
  }
  
  if (!token) {
    return { success: false, error: "Hệ thống chưa ghi nhận Access Token. Vui lòng điền Token và thử lại." };
  }

  try {
    const res = await fetch("https://openapi.zalo.me/v2.0/oa/getoa", {
      method: 'GET',
      headers: {
        'access_token': token
      }
    });

    const data = await res.json();
    if (data.error === 0) {
      return { 
        success: true, 
        message: `Kết nối thành công! Tên OA: ${data.data?.name || 'Không xác định'}, ID: ${data.data?.oa_id || 'Không xác định'}` 
      };
    } else {
      return { 
        success: false, 
        error: `Lỗi kết nối Zalo (Mã ${data.error}): ${data.message}` 
      };
    }
  } catch (err: any) {
    return { success: false, error: "Lỗi mạng hoặc hệ thống Zalo không phản hồi: " + err.message };
  }
}

export async function checkZaloTemplate(templateId: string, providedToken?: string) {
  if (!templateId) return { success: false, error: "Vui lòng nhập ID Mẫu." };
  
  let token = providedToken;
  if (!token) {
    const config = await getZaloConfig();
    token = config?.AccessToken;
  }
  
  if (!token) {
    return { success: false, error: "Chưa có Access Token để kiểm tra." };
  }

  try {
    const res = await fetch(`https://business.openapi.zalo.me/template/info/v2?template_id=${templateId}`, {
      method: 'GET',
      headers: {
        'access_token': token
      }
    });

    const data = await res.json();
    if (data.error === 0) {
      return { 
        success: true, 
        message: `Mẫu hợp lệ! Tên mẫu: ${data.data?.templateName || 'Không xác định'}, Trạng thái: ${data.data?.status || 'Không xác định'}` 
      };
    } else {
      return { 
        success: false, 
        error: `Lỗi Zalo (Mã ${data.error}): ${data.message}` 
      };
    }
  } catch (err: any) {
    return { success: false, error: "Lỗi mạng hoặc hệ thống Zalo không phản hồi: " + err.message };
  }
}

export async function getZaloHistory(type?: 'MOTO' | 'OTO') {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    
    let query: string;
    if (type) {
      request.input('CampaignType', sql.NVarChar, type);
      query = "SELECT * FROM ZaloZNS_History WHERE CampaignType = @CampaignType ORDER BY ID DESC";
    } else {
      query = "SELECT * FROM ZaloZNS_History ORDER BY ID DESC";
    }
    
    const result = await request.query(query);
    // pool.close(); // Managed by db.ts
    return result.recordset;
  } catch (err) {
    console.error("Error fetching Zalo history:", err);
    return [];
  }
}

export async function sendZaloMessage(payload: {
  phone: string;
  template_id: string;
  template_data: any;
  campaignType: 'MOTO' | 'OTO';
  studentName: string;
  cccd: string;
  courseName: string;
  teacherName: string;
  scheduleStage2Date?: string; // e.g. '2023-12-01T00:00:00'
  courseType?: string; // Hạng đào tạo e.g. 'B2', 'C'
}) {
  const config = await getZaloConfig();
  if (!config || !config.AccessToken) {
    return { success: false, error: "Hệ thống chưa ghi nhận Access Token hợp lệ." };
  }

  let phone_number = payload.phone.replace(/\\D/g, '');
  if (phone_number.startsWith('0')) {
    phone_number = '84' + phone_number.substring(1);
  }

  const zaloPayload = {
    phone: phone_number,
    template_id: payload.template_id,
    template_data: payload.template_data
  };

  try {
    const res = await fetch("https://business.openapi.zalo.me/message/template", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.AccessToken
      },
      body: JSON.stringify(zaloPayload)
    });

    const result = await res.json();
    const isSuccess = result.error === 0;
    const msg = isSuccess ? "Thành công" : `Mã lỗi ${result.error}: ${result.message || 'Không xác định'}`;
    
    // Log to DB
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('CampaignType', sql.NVarChar, payload.campaignType)
      .input('StudentName', sql.NVarChar, payload.studentName)
      .input('CCCD', sql.NVarChar, payload.cccd)
      .input('Phone', sql.NVarChar, payload.phone)
      .input('CourseName', sql.NVarChar, payload.courseName)
      .input('Status', sql.NVarChar, isSuccess ? 'Thành công' : 'Thất bại')
      .input('ErrorDetail', sql.NVarChar, msg)
      .input('TemplateID', sql.NVarChar, payload.template_id)
      .input('TeacherName', sql.NVarChar, payload.teacherName)
      .query(`
        INSERT INTO ZaloZNS_History 
        (CampaignType, StudentName, CCCD, Phone, CourseName, SentTime, Status, ErrorDetail, TemplateID, TeacherName)
        VALUES (@CampaignType, @StudentName, @CCCD, @Phone, @CourseName, GETDATE(), @Status, @ErrorDetail, @TemplateID, @TeacherName)
      `);

    // Enqueue Stage 2 for OTO if success and scheduleStage2Date is provided
    if (isSuccess && payload.campaignType === 'OTO' && payload.scheduleStage2Date) {
      await pool.request()
        .input('StudentName', sql.NVarChar, payload.studentName)
        .input('CCCD', sql.NVarChar, payload.cccd)
        .input('Phone', sql.NVarChar, payload.phone)
        .input('CourseName', sql.NVarChar, payload.courseName)
        .input('CourseType', sql.NVarChar, payload.courseType || '')
        .input('Stage', sql.Int, 2)
        .input('ScheduledTime', sql.DateTime, new Date(payload.scheduleStage2Date))
        .query(`
          INSERT INTO ZaloZNS_Queue 
          (StudentName, CCCD, Phone, CourseName, CourseType, Stage, ScheduledTime, Status, CreatedAt, UpdatedAt)
          VALUES (@StudentName, @CCCD, @Phone, @CourseName, @CourseType, @Stage, @ScheduledTime, 'Pending', GETDATE(), GETDATE())
        `);
    }

    // pool.close(); // Managed by db.ts

    return { success: isSuccess, message: msg };
  } catch (err: any) {
    return { success: false, error: `Lỗi kết nối mạng: ${err.message}` };
  }
}

export async function getStudentsForZalo(courseId: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Lấy thông tin khóa học
    const courseResult = await pool.request()
      .input('MaKhoa', sql.NVarChar, courseId)
      .query(`
        SELECT 
          k.MaKhoa,
          a.TenKhoa,
          a.Hang,
          k.NgayHoc as KhaiGiang,
          k.NgayKt as BeGiang,
          a.NgaySatHach
        FROM App_DieuChinh_Khoa k
        LEFT JOIN App_Khoa a ON k.MaKhoa = a.MaKhoa
        WHERE k.MaKhoa = @MaKhoa
      `);
      
    if (courseResult.recordset.length === 0) return null;
    const course = courseResult.recordset[0];
    
    // Lấy danh sách học viên
    const studentsResult = await pool.request()
      .input('MaKhoa', sql.NVarChar, courseId)
      .query(`
        SELECT h.HoTen, h.NgaySinh, h.CCCD, h.SDT, g.HoTen as GV
        FROM App_HocVien_V2 h
        LEFT JOIN App_PhanCong_GV pg ON h.MaKhoa = pg.MaKhoa
        LEFT JOIN App_GiaoVien g ON pg.MaGV = CAST(g.Id AS VARCHAR)
        WHERE h.MaKhoa = @MaKhoa
      `);

    // pool.close(); // Managed by db.ts
    
    return {
      course: {
        id: course.MaKhoa,
        name: course.TenKhoa || course.MaKhoa,
        hang: course.Hang || '',
        khaiGiang: course.KhaiGiang || '',
        beGiang: course.BeGiang || '',
        satHach: course.NgaySatHach || '',
      },
      students: studentsResult.recordset.map(s => ({
        name: s.HoTen,
        dob: s.NgaySinh || '',
        cccd: s.CCCD || '',
        sdt: s.SDT || '',
        gv: s.GV || ''
      }))
    };
  } catch (err) {
    console.error("Error fetching students for Zalo:", err);
    return null;
  }
}

export async function getZaloQueue() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query("SELECT * FROM ZaloZNS_Queue ORDER BY ScheduledTime ASC");
    // pool.close(); // Managed by db.ts
    return result.recordset;
  } catch (err) {
    console.error("Error fetching Zalo Queue:", err);
    return [];
  }
}

export async function deleteZaloQueueItem(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('ID', sql.Int, id)
      .query("DELETE FROM ZaloZNS_Queue WHERE ID = @ID");
    // pool.close(); // Managed by db.ts
    revalidatePath('/zalo-oa/oto-queue');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateZaloQueueTime(id: number, scheduledTime: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('ID', sql.Int, id)
      .input('ScheduledTime', sql.DateTime, new Date(scheduledTime))
      .query("UPDATE ZaloZNS_Queue SET ScheduledTime = @ScheduledTime, UpdatedAt = GETDATE() WHERE ID = @ID");
    // pool.close(); // Managed by db.ts
    revalidatePath('/zalo-oa/oto-queue');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
