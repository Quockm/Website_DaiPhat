import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const docType = formData.get("docType") as string || "cong_van";
    
    const targetFolderName = docType === "quyet_dinh" ? "Quyết Định chung" : "Công văn chung";
    const folderPath = `Lưu Trữ Công văn/${targetFolderName}`;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      const fileNamePrefix = `cv`; // Prefix for cong_van
      const result = await uploadFile(file, folderPath, fileNamePrefix);

      uploadedFiles.push({
        id: result.url,
        name: file.name,
        webViewLink: result.url,
        createdTime: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles 
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Tải file lên thất bại." }, { status: 500 });
  }
}

