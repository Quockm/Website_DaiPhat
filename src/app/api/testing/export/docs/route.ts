import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { getTestingStudents } from "@/actions/testing/students.actions";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { single_val, single_type, day, month, don_vi, tt_sh, stt_by_order, scheduleId } = payload;

    const res = await getTestingStudents(scheduleId);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: "Lỗi khi lấy dữ liệu học viên" }, { status: 500 });
    }

    let students: any[] = res.data as any[];

    // Filter single
    if (single_val) {
      const val = single_val.trim().toLowerCase();
      if (single_type === "stt") {
        students = students.filter((s: any) => String(s.stt) === val);
      } else {
        students = students.filter((s: any) => String(s.sbd).trim().toLowerCase() === val || String(s.cccd).trim().toLowerCase() === val);
      }
    }

    if (students.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy dữ liệu phù hợp." }, { status: 400 });
    }

    // Sort if not stt_by_order
    if (!stt_by_order) {
      students.sort((a: any, b: any) => {
        const aSbd = parseInt(a.sbd || "999999", 10) || 999999;
        const bSbd = parseInt(b.sbd || "999999", 10) || 999999;
        return (aSbd % 1000) - (bSbd % 1000);
      });
    }

    const zip = new JSZip();

    // 1. Generate Excel
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
    let listStt = 1;
    for (const s of students) {
      ws.addRow({
        stt: listStt++,
        name: s.name,
        dob: s.dob,
        cccd: s.cccd,
        hang: s.hang,
        sbd: s.sbd,
        gv: s.gv || "",
        note: s.ndsh || ""
      });
    }
    const excelBuffer = await wb.xlsx.writeBuffer();
    zip.file(`DanhSachHocVien_${day || "XX"}_${month || "XX"}.xlsx`, excelBuffer);

    // 2. Generate Docs
    const templatesDir = path.join(process.cwd(), "public", "templates", "docs");
    const templateA = fs.readFileSync(path.join(templatesDir, "A.docx"), "binary");
    const templateB = fs.readFileSync(path.join(templatesDir, "B.docx"), "binary");
    const templateC = fs.readFileSync(path.join(templatesDir, "C1.docx"), "binary");

    let docStt = 1;
    for (const student of students) {
      const hang = (student.hang || "").toString().toUpperCase();
      let tplBinary = templateC;
      if (hang === "A1" || hang === "A2") {
        tplBinary = templateA;
      } else if (hang === "B1" || hang === "B2") {
        tplBinary = templateB;
      } else if (hang === "C" || hang === "C1") {
        tplBinary = templateC;
      }

      const zipDocx = new PizZip(tplBinary);
      const doc = new Docxtemplater(zipDocx, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '[[', end: ']]' }
      });

      // Data cho template
      const currentYear = new Date().getFullYear();
      let ndsh = student.ndsh || "";
      if (!ndsh) ndsh = "LT, TH"; // Fallback
      
      const docData = {
        ten_hv: (student.name || "").toUpperCase(),
        ngaysinh: student.dob || "",
        cccd: student.cccd || "",
        hsh: hang,
        SBD: student.sbd || "",
        trungtam: tt_sh || "",
        // Keep old mapping just in case
        dob: student.dob || "",
        cmnd: student.cccd || "",
        hang_xe: hang,
        sbd: student.sbd || "",
        ngay: day || "...",
        thang: month || "...",
        nam: currentYear.toString(),
        don_vi: don_vi || "",
        trung_tam: tt_sh || "",
        ndsh: ndsh,
        stt: docStt,
        truong: don_vi || "", // Map to truong as well if needed
      };

      // Manually replace [n] and [t] inside the document.xml since Docxtemplater uses [[ ]]
      const xmlFile = zipDocx.file("word/document.xml");
      if (xmlFile) {
        let xml = xmlFile.asText();
        xml = xml.replace(/\[n\]/g, day || "...");
        xml = xml.replace(/\[t\]/g, month || "...");
        zipDocx.file("word/document.xml", xml);
      }

      doc.render(docData);
      const buf = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      const safeName = (student.name || "KhongTen").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_");
      zip.file(`HOSO_${docStt}_${safeName}.docx`, buf);
      docStt++;
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    const tt = (don_vi || "").replace("TRUNG TÂM GDNN", "").trim().replace(/\s+/g, "");
    const dStr = day || "HomNay";
    const customName = `${tt}_${dStr}.zip`;

    return new NextResponse(zipContent as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(customName)}`,
      }
    });

  } catch (err: any) {
    console.error("Docs Export Error:", err);
    return NextResponse.json({ error: "Không thể xuất file Docs." }, { status: 500 });
  }
}
