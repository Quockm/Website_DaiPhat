import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "Không tìm thấy file ảnh nào." });
    }

    const pool = await getDbConnection("DP_SH_System");
    let savedCount = 0;
    let notFoundCount = 0;

    const portraitsDir = "E:\\QRCODE DP\\daiphat-qrcode-web\\frontend\\images\\portraits";
    if (!fs.existsSync(portraitsDir)) {
      fs.mkdirSync(portraitsDir, { recursive: true });
    }

    for (const file of files) {
      // file.name will be the base name like "79106-20260202163407123.jpg"
      const fileName = file.name;
      const ma_dk = fileName.replace(/\.[^/.]+$/, ""); // remove extension
      
      const queryRes = await pool.request()
        .input('ma_dk', ma_dk)
        .query(`SELECT cccd FROM students WHERE REPLACE(REPLACE(REPLACE(LOWER(LTRIM(RTRIM(ma_dk))), '/', ''), '_', ''), '-', '') = REPLACE(REPLACE(REPLACE(LOWER(LTRIM(RTRIM(@ma_dk))), '/', ''), '_', ''), '-', '')`);
        
      if (queryRes.recordset.length > 0) {
        const cccd = queryRes.recordset[0].cccd;
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const savePath = path.join(portraitsDir, `${cccd}.jpg`);
        fs.writeFileSync(savePath, buffer);
        savedCount++;
      } else {
        notFoundCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã map và lưu thành công ${savedCount} ảnh. ${notFoundCount > 0 ? `(Không tìm thấy Mã ĐK cho ${notFoundCount} ảnh)` : ''}`,
      savedCount,
      notFoundCount
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
