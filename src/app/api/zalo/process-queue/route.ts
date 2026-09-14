import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

/**
 * GET /api/zalo/process-queue
 *
 * Xử lý hàng đợi ZNS đến hạn. Được gọi bởi zalo_worker.js mỗi phút.
 * - Tìm các item trong ZaloZNS_Queue có Status='Pending' và ScheduledTime <= NOW()
 * - Gửi tin nhắn ZNS qua Zalo API
 * - Cập nhật trạng thái Sent/Failed và ghi log vào ZaloZNS_History
 */
export async function GET(request: Request) {
  // Bảo mật: kiểm tra header secret từ worker
  const authHeader = request.headers.get('x-worker-secret');
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerSecret || authHeader !== workerSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');

    // 1. Lấy danh sách item đến hạn
    const dueItemsResult = await pool.request().query(`
      SELECT
        ID, StudentName, CCCD, Phone, CourseName, CourseType, Stage,
        ScheduledTime, Status, CreatedAt
      FROM ZaloZNS_Queue
      WHERE Status = 'Pending'
        AND ScheduledTime <= DATEADD(hour, 7, GETUTCDATE())
      ORDER BY ScheduledTime ASC
    `);

    const dueItems = dueItemsResult.recordset;

    if (dueItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có tin nhắn nào trong hàng đợi cần gửi.',
        processed: 0,
      });
    }

    // 2. Lấy cấu hình Zalo
    const configResult = await pool.request().query(`
      SELECT TOP 1 AccessToken, TemplateID_Oto_Stage2
      FROM ZaloZNS_Config
    `);

    const config = configResult.recordset[0];

    if (!config || !config.AccessToken) {
      return NextResponse.json({
        success: false,
        error: 'Chưa cấu hình Zalo Access Token.',
        processed: 0,
      }, { status: 500 });
    }

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    // 3. Xử lý từng item
    for (const item of dueItems) {
      try {
        // Chuẩn hóa số điện thoại
        let phone = (item.Phone || '').replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '84' + phone.substring(1);
        }

        if (!phone || phone.length < 10) {
          throw new Error(`Số điện thoại không hợp lệ: ${item.Phone}`);
        }

        // Dữ liệu template giai đoạn 2 (OTO)
        const templateData = {
          student_name: item.StudentName || '',
          course_name: item.CourseName || '',
          course_type: item.CourseType || '',
        };

        // Gửi ZNS
        const zaloRes = await fetch('https://business.openapi.zalo.me/message/template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': config.AccessToken,
          },
          body: JSON.stringify({
            phone,
            template_id: config.TemplateID_Oto_Stage2,
            template_data: templateData,
          }),
        });

        const zaloData = await zaloRes.json();
        const isSuccess = zaloData.error === 0;
        const statusMsg = isSuccess
          ? 'Sent'
          : `Failed: ${zaloData.error} - ${zaloData.message || 'Unknown error'}`;

        // 4. Cập nhật trạng thái trong hàng đợi
        await pool.request()
          .input('ID', sql.Int, item.ID)
          .input('Status', sql.NVarChar, isSuccess ? 'Sent' : 'Failed')
          .query(`
            UPDATE ZaloZNS_Queue
            SET Status = @Status, UpdatedAt = DATEADD(hour, 7, GETUTCDATE())
            WHERE ID = @ID
          `);

        // 5. Ghi log vào lịch sử
        await pool.request()
          .input('CampaignType', sql.NVarChar, 'OTO')
          .input('StudentName', sql.NVarChar, item.StudentName || '')
          .input('CCCD', sql.NVarChar, item.CCCD || '')
          .input('Phone', sql.NVarChar, item.Phone || '')
          .input('CourseName', sql.NVarChar, item.CourseName || '')
          .input('Status', sql.NVarChar, isSuccess ? 'Thành công' : 'Thất bại')
          .input('ErrorDetail', sql.NVarChar, statusMsg)
          .input('TemplateID', sql.NVarChar, config.TemplateID_Oto_Stage2 || '')
          .query(`
            INSERT INTO ZaloZNS_History
            (CampaignType, StudentName, CCCD, Phone, CourseName, SentTime, Status, ErrorDetail, TemplateID, TeacherName)
            VALUES (@CampaignType, @StudentName, @CCCD, @Phone, @CourseName, DATEADD(hour, 7, GETUTCDATE()), @Status, @ErrorDetail, @TemplateID, N'')
          `);

        if (isSuccess) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`ID ${item.ID} (${item.StudentName}): ${statusMsg}`);
        }

      } catch (itemErr: any) {
        console.error(`[ZaloWorker] Error processing queue item ID ${item.ID}:`, itemErr);
        results.failed++;
        results.errors.push(`ID ${item.ID} (${item.StudentName}): ${itemErr.message}`);

        // Đánh dấu Failed
        try {
          await pool.request()
            .input('ID', sql.Int, item.ID)
            .query(`
              UPDATE ZaloZNS_Queue
              SET Status = 'Failed', UpdatedAt = DATEADD(hour, 7, GETUTCDATE())
              WHERE ID = @ID
            `);
        } catch (_) { /* bỏ qua */ }
      }
    }

    console.log(`[ZaloWorker] Processed ${dueItems.length} items: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Đã xử lý ${dueItems.length} tin nhắn trong hàng đợi.`,
      processed: dueItems.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });

  } catch (err: any) {
    console.error('[ZaloWorker] Fatal error in process-queue API:', err);
    return NextResponse.json({ success: false, error: 'Lỗi xử lý hàng đợi ZNS.' }, { status: 500 });
  }
}
