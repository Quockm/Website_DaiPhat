import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const objectId = formData.get("objectId") as string; // Teacher or Car ID / Name
    const docType = formData.get("docType") as string; // CCCD, GPLX, etc.

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Xác định thư mục cha (Giáo viên hay Xe hay Học viên)
    const isTeacher = objectId?.startsWith("GV_") || false;
    const isStudent = objectId?.startsWith("HV_") || false;
    
    let parentFolder = isTeacher ? "Ho_so_Giao_vien" : "Ho_so_Phuong_tien";
    if (isStudent) {
      parentFolder = "Ho_so_Hoc_vien";
    }

    // Dùng không dấu để tránh lỗi font trên Windows
    const folderPath = `${parentFolder}/${objectId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const fileNamePrefix = `${objectId.replace(/[^a-zA-Z0-9_-]/g, '')}_${docType.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    // Upload using new storage module
    const result = await uploadFile(file, folderPath, fileNamePrefix);

    return NextResponse.json({
      success: true,
      fileId: result.url, // Using URL as ID for simpler tracking
      webViewLink: result.url,
      webContentLink: result.url,
      thumbnailLink: result.thumbnailUrl,
      isLocal: result.isLocal,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Tải file lên thất bại." }, { status: 500 });
  }
}

