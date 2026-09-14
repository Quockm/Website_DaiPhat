import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;
    const docId = formData.get("docId") as string; 
    const fileName = formData.get("fileName") as string;

    if (!file || !courseId || !docId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const folderPath = `Quyet_dinh/${courseId}`;
    const fileNamePrefix = docId.replace(/[^a-zA-Z0-9_-]/g, '');

    const result = await uploadFile(file, folderPath, fileNamePrefix);

    return NextResponse.json({ 
      success: true, 
      file: {
        id: result.url,
        name: file.name,
        webViewLink: result.url
      }
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Tải file lên thất bại." }, { status: 500 });
  }
}

