import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const templateName = data.template;

    if (!templateName || typeof templateName !== "string") {
      return NextResponse.json({ error: "Missing template name" }, { status: 400 });
    }

    const templatesDir = path.join(process.cwd(), "public", "templates", "lesson-plans");
    const templatePath = path.join(templatesDir, path.basename(templateName));
    if (
      path.extname(templatePath).toLowerCase() !== ".docx" ||
      !templatePath.startsWith(templatesDir + path.sep)
    ) {
      return NextResponse.json({ error: "Invalid template name" }, { status: 400 });
    }
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // Ensure all context variables from Python are present
    const context = {
      ma_khoa: data.ma_khoa || "",
      hang: data.hang || "",
      sl_hv: data.sl_hv || 0,
      sl_xe: data.sl_xe || 0,
      c1_bd: data.c1?.bd || "",
      c1_kt: data.c1?.kt || "",
      c1_ngay: data.c1?.soNgay || "0",
      c2_bd: data.c2?.bd || "",
      c2_kt: data.c2?.kt || "",
      c2_ngay: data.c2?.soNgay || "0",
      c3_bd: data.c3?.bd || "",
      c3_kt: data.c3?.kt || "",
      c3_ngay: data.c3?.soNgay || "0"
    };

    doc.render(context);

    const buf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    return new NextResponse(buf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="GiaoAn_${data.ma_khoa}.docx"`
      }
    });

  } catch (err: any) {
    console.error("DOCX Export Error:", err);
    return NextResponse.json({ error: "Không thể xuất file DOCX." }, { status: 500 });
  }
}
