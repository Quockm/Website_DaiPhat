import { NextRequest, NextResponse } from "next/server";
import { getDriveService } from "@/lib/drive";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    const drive = getDriveService();

    await drive.files.delete({
      fileId: fileId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Xóa file thất bại." }, { status: 500 });
  }
}
