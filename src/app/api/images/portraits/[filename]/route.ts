import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  
  // Đường dẫn đến thư mục chứa ảnh gốc của hệ thống cũ
  const imagePath = path.join("E:\\QRCODE DP\\daiphat-qrcode-web\\frontend\\images\\portraits", filename);

  try {
    if (fs.existsSync(imagePath)) {
      const fileBuffer = fs.readFileSync(imagePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } else {
      return new NextResponse("Image not found", { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Error reading image", { status: 500 });
  }
}
