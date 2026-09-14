import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import JSZip from "jszip";

import Docxtemplater from "docxtemplater";

function processSingleStudent(templateContent: any, student: any, extraData: any = {}) {
  const zip = new PizZip(templateContent);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Could not find word/document.xml in template");
  let xml = docFile.asText();
  
  // 1. Break MERGEFIELD instructions so they don't overwrite our values if updated in Word
  xml = xml.replace(/MERGEFIELD\s+[^<]*<\/w:instrText>/gi, '</w:instrText>');
  zip.file("word/document.xml", xml);
  
  const context = {
    "Số_HỢP_ĐỒNG": student.MaDK || "",
    "So_HOP_DONG": student.MaDK || "",
    "Ho_Ten": student.HoTen || "",
    "Họ_Tên": student.HoTen || "",
    "Họ_và_tên": student.HoTen || "",
    "HoTen": student.HoTen || "",
    "NgaySinh": student.NgaySinh || "",
    "Ngày_sinh": student.NgaySinh || "",
    "CCCD": student.CCCD || "",
    "CMND": student.CCCD || "",
    "F6": student.CCCD || "",
    "SDT": student.SDT || "",
    "SĐT": student.SDT || "",
    "DiaChi": student.DiaChi || "",
    "Địa_chỉ": student.DiaChi || "",
    "Nơi_cư_trú": student.DiaChi || "",
    "HocPhi": student.HocPhi ? student.HocPhi.toLocaleString() : "",
    "Học_phí": student.HocPhi ? student.HocPhi.toLocaleString() : "",
    "MaKhoa": student.MaKhoa || extraData.courseName || "",
    "Mã Khóa": student.MaKhoa || extraData.courseName || "",
    "Hạng": extraData.hangXe || "",
    "Năm": new Date().getFullYear().toString(),
    "Nam": new Date().getFullYear().toString(),
    "N": new Date().getDate().toString().padStart(2, '0'),
    "T": (new Date().getMonth() + 1).toString().padStart(2, '0'),
    "STT": extraData.stt ? extraData.stt.toString() : "1"
  };

  try {
    const nullGetter = function(part: any) { return ""; };

    // 2. Process { } delimiters (standard)
    let doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter });
    doc.render(context);
    
    // 3. Process « » delimiters (used by mailmerge display texts)
    const zip2 = new PizZip(doc.getZip().generate({ type: "nodebuffer" }));
    let doc2 = new Docxtemplater(zip2, { paragraphLoop: true, linebreaks: true, delimiters: { start: '«', end: '»' }, nullGetter });
    doc2.render(context);
    
    // 4. Process [ ] delimiters (used by some custom templates)
    const zip3 = new PizZip(doc2.getZip().generate({ type: "nodebuffer" }));
    let doc3 = new Docxtemplater(zip3, { paragraphLoop: true, linebreaks: true, delimiters: { start: '[', end: ']' }, nullGetter });
    doc3.render(context);
    
    return doc3.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
  } catch (error: any) {
    console.error("Docxtemplater error:", error.properties?.errors || error);
    return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  }
}

import { getDbConnection } from "@/lib/db";
import sql from "mssql";

function getDocumentType(templateName: string) {
  const lower = templateName.toLowerCase();
  if (lower.includes("hđ") || lower.includes("hợp đồng") || lower.includes("hd")) return "HOP_DONG";
  if (lower.includes("thanh lý") || lower.includes("bbtl")) return "THANH_LY";
  if (lower.includes("phiếu thu")) return "PHIEU_THU";
  return "OTHER";
}

async function hasPrinted(cccd: string, docType: string) {
  if (docType === "OTHER" || !cccd) return false;
  const pool = await getDbConnection("DP_SH_System");
  const result = await pool.request()
    .input('cccd', sql.VarChar, cccd)
    .input('docType', sql.VarChar, docType)
    .query(`SELECT id FROM print_logs WHERE entity_type = 'STUDENT' AND entity_id = @cccd AND document_type = @docType`);
  return result.recordset.length > 0;
}

async function logPrint(cccd: string, docType: string, templateName: string) {
  if (!cccd) return;
  const pool = await getDbConnection("DP_SH_System");
  await pool.request()
    .input('cccd', sql.VarChar, cccd)
    .input('docType', sql.VarChar, docType)
    .input('docName', sql.NVarChar, templateName)
    .query(`
      INSERT INTO print_logs (entity_type, entity_id, document_type, document_name, printed_by)
      VALUES ('STUDENT', @cccd, @docType, @docName, 'System')
    `);
}

export async function POST(req: NextRequest) {
  try {
    const { template, student, students, bulk, courseName, hangXe } = await req.json();
    
    if (!template) {
      return NextResponse.json({ error: "No template specified" }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), "public", "templates", "contracts", template);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template file not found: ${template}` }, { status: 404 });
    }
    
    const content = fs.readFileSync(templatePath, "binary");
    const docType = getDocumentType(template);

    if (bulk && students && students.length > 0) {
      // Bulk export
      const archive = new JSZip();
      let printedCount = 0;
      let skippedCount = 0;
      
      for (let i = 0; i < students.length; i++) {
        const s = students[i];
        if (s.CCCD && await hasPrinted(s.CCCD, docType)) {
          skippedCount++;
          continue;
        }

        const extraData = { courseName, hangXe, stt: i + 1 };
        const docxBuffer = processSingleStudent(content, s, extraData);
        // Clean filename to avoid special characters
        const safeName = (s.HoTen || "HocVien").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_");
        const safeCCCD = s.CCCD || "unknown";
        archive.file(`${safeName}_${safeCCCD}.docx`, docxBuffer);
        
        if (s.CCCD) {
          await logPrint(s.CCCD, docType, template);
        }
        printedCount++;
      }
      
      if (printedCount === 0) {
        return NextResponse.json({ error: `Đã bỏ qua tất cả ${skippedCount} học viên vì đã in biểu mẫu này rồi.` }, { status: 400 });
      }

      const zipBuffer = await archive.generateAsync({ type: "nodebuffer" });
      const encodedFilename = encodeURIComponent(`HopDong_${courseName || 'HangLoat'}.zip`);
      
      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
          "X-Print-Summary": encodeURIComponent(`Đã in ${printedCount} file, bỏ qua ${skippedCount} học viên đã in trước đó.`)
        }
      });
      
    } else if (student) {
      // Single file export
      if (student.CCCD && await hasPrinted(student.CCCD, docType)) {
        return NextResponse.json({ error: `Học viên này đã in biểu mẫu '${template}' rồi.` }, { status: 400 });
      }

      const extraData = { courseName, hangXe, stt: 1 };
      const docxBuffer = processSingleStudent(content, student, extraData);
      
      if (student.CCCD) {
        await logPrint(student.CCCD, docType, template);
      }

      const safeName = (student.HoTen || "HocVien").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_");
      const safeTemplate = template.replace(/[^a-zA-Z0-9 .\-_]/g, "");
      const encodedFilename = encodeURIComponent(`${safeName}_${safeTemplate}`);
      
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`
        }
      });
    } else {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
