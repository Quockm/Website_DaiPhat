import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getTestingStudents } from "@/actions/testing/students.actions";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { single_val, single_type, day, month, don_vi, tt_sh, scheduleId } = payload;

    const res = await getTestingStudents(scheduleId);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: "Lỗi khi lấy dữ liệu học viên" }, { status: 500 });
    }

    let students: any[] = res.data as any[];

    if (single_val) {
      const val = single_val.trim().toLowerCase();
      if (single_type === "stt") {
        students = students.filter((s: any) => String(s.stt) === val);
      } else {
        students = students.filter((s: any) => String(s.sbd).trim().toLowerCase() === val || String(s.cccd).trim().toLowerCase() === val);
      }
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("DanhSachHocVien");

    ws.columns = [
      { header: "STT", key: "stt", width: 10 },
      { header: "HỌ VÀ TÊN", key: "name", width: 25 },
      { header: "NĂM SINH", key: "dob", width: 15 },
      { header: "CCCD", key: "cccd", width: 15 },
      { header: "HẠNG", key: "hang", width: 10 },
      { header: "SỐ BÁO DANH", key: "sbd", width: 15 },
      { header: "GIÁO VIÊN", key: "gv", width: 20 },
      { header: "GHI CHÚ", key: "note", width: 20 },
    ];

    ws.getRow(1).font = { bold: true };

    let i = 1;
    for (const s of students) {
      ws.addRow({
        stt: i++,
        name: s.name,
        dob: s.dob,
        cccd: s.cccd,
        hang: s.hang,
        sbd: s.sbd,
        gv: s.gv || "",
        note: s.ndsh || ""
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const fileName = "DanhSachHocVien.xlsx";

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
      }
    });

  } catch (err: any) {
    console.error("XLSX Export Error:", err);
    return NextResponse.json({ error: "Không thể xuất file Excel." }, { status: 500 });
  }
}
