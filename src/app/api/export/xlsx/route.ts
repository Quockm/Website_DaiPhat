import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { ma_khoa, template, students, datRecords } = payload;

    if (!template || !ma_khoa) {
      return NextResponse.json({ error: "Missing template or ma_khoa" }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), "public", "templates", "lesson-plans", template);
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template ${template} not found` }, { status: 404 });
    }

    const templateBuffer = fs.readFileSync(templatePath);
    
    // Tạo duy nhất 1 Sổ theo dõi cho cả khóa/xe
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(templateBuffer as any);

    // Điền "DANH SÁCH"
    const dsSheet = wb.getWorksheet("DANH SÁCH");
    if (dsSheet) {
      let startRow = 3;
      for (let j = 0; j < students.length; j++) {
        const row = dsSheet.getRow(startRow + j);
        row.getCell(2).value = j + 1;
        row.getCell(3).value = students[j].HoTen || '';
        row.getCell(4).value = students[j].NgaySinh || '';
        row.getCell(5).value = students[j].CCCD || '';
        row.commit();
      }
    }

    // Điền "IN DAT"
    const datSheet = wb.getWorksheet("IN DAT") || wb.getWorksheet("DAT");
    
    // Lấy đại diện học viên đầu tiên đã upload DAT để điền làm lịch trình mẫu cho Xe
    // Logic của sổ theo dõi là ghi nhật ký xe, nên thường dùng 1 học viên mẫu
    const representativeIdx = Object.keys(datRecords)[0] || "0";
    const datData = datRecords[representativeIdx as any];
    const hv = students[parseInt(representativeIdx)] || students[0] || {};

    if (datSheet && datData) {
      datSheet.getCell("C4").value = hv.HoTen || '';
      datSheet.getCell("C5").value = hv.NgaySinh || '';
      datSheet.getCell("G4").value = ma_khoa || '';
      datSheet.getCell("G5").value = "Chưa phân xe";

      const fillLesson = (startRow: number, dataArray: any[]) => {
        if (!dataArray) return;
        for (let k = 0; k < dataArray.length; k++) {
          if (k >= 5) break; 
          const r = startRow + k;
          const row = datSheet.getRow(r);
          row.getCell("D").value = dataArray[k].dateStr;
          row.getCell("F").value = dataArray[k].duration;
          row.getCell("G").value = dataArray[k].km;
          row.commit();
        }
      };

      for (let r = 5; r <= 50; r++) {
        const row = datSheet.getRow(r);
        let cellValue = row.getCell("B").value;
        let val = "";
        
        // Xử lý đọc giá trị ô kể cả khi bị merged hoặc formula
        if (cellValue !== null && typeof cellValue === 'object' && 'result' in cellValue) {
            val = String(cellValue.result).trim();
        } else if (cellValue !== null && typeof cellValue === 'object' && 'richText' in cellValue) {
            val = (cellValue as any).richText.map((rt: any) => rt.text).join('').trim();
        } else {
            val = String(cellValue || "").trim();
        }

        const valLower = val.toLowerCase();
        if (valLower.includes('bài 7:') || valLower === '7') fillLesson(r, datData.b7);
        else if (valLower.includes('bài 8:') || valLower === '8') fillLesson(r, datData.b8);
        else if (valLower.includes('bài 9:') || valLower === '9') fillLesson(r, datData.b9);
        else if (valLower.includes('bài 10:') || valLower === '10') fillLesson(r, datData.b10);
        else if (valLower.includes('bài 11:') || valLower === '11') fillLesson(r, datData.b11);
        else if (valLower.includes('bài 12:') || valLower === '12') fillLesson(r, datData.b12);
      }
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="SoTheoDoi_${ma_khoa}.xlsx"`
      }
    });

  } catch (err: any) {
    console.error("XLSX Export Error:", err);
    return NextResponse.json({ error: "Không thể xuất file Excel." }, { status: 500 });
  }
}
