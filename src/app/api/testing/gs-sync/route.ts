import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { getTestingStudents } from "@/actions/testing/students.actions";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { stt_by_order, scheduleId } = payload;

    const keyPath = path.join(process.cwd(), "admin_key.json");
    if (!fs.existsSync(keyPath)) {
      return NextResponse.json({ error: "Không tìm thấy file chứng chỉ admin_key.json" }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    });

    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client as any });
    
    // Tìm file DEMO1
    const resDrive = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name='DEMO1' and trashed=false`,
      fields: 'files(id, name)',
    });

    const files = resDrive.data.files;
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy Spreadsheet tên 'DEMO1' trên Google Drive." }, { status: 404 });
    }
    const spreadsheetId = files[0].id;

    const res = await getTestingStudents(scheduleId);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: "Lỗi khi lấy dữ liệu học viên" }, { status: 500 });
    }

    let students = res.data;
    if (!stt_by_order) {
      students.sort((a: any, b: any) => {
        const aSbd = parseInt(a.sbd || "999999", 10) || 999999;
        const bSbd = parseInt(b.sbd || "999999", 10) || 999999;
        return (aSbd % 1000) - (bSbd % 1000);
      });
    }

    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    // Clear sheet DATA
    const sheetName = 'DATA';
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId!,
      range: `${sheetName}!A1:Z`,
    });

    // Header
    const headers = ['STT', 'SBD', 'Họ Tên', 'Ngày Sinh', 'Tên Trường', 'CCCD', 'Hạng', 'NĐSH', 'Ghép', 'Ghi Chú', 'GV', 'Ngày Thi', 'Điểm LT', 'Điểm Hình', 'Điểm Đường'];
    
    // Rows
    const rows = [headers];
    let i = 1;
    for (const s of students) {
      rows.push([
        i++,
        s.sbd || "",
        s.name || "",
        s.dob || "",
        s.school || "",
        s.cccd || "",
        s.hang || "",
        s.ndsh || "",
        "", // Ghép
        "", // Ghi chú
        s.gv || "",
        s.exam_date || "",
        s.score_lt || "",
        s.score_hinh || "",
        s.score_duong || ""
      ]);
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId!,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows,
      },
    });

    return NextResponse.json({ success: true, message: `Đã đồng bộ ${students.length} học viên lên Google Sheets!` });

  } catch (err: any) {
    console.error("GS Sync Error:", err);
    return NextResponse.json({ error: err.message || "Lỗi đồng bộ Google Sheets" }, { status: 500 });
  }
}
