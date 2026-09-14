import { NextRequest, NextResponse } from "next/server";
import { getDriveService, getFolderId } from "@/lib/drive";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const drive = getDriveService();
    let rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!rootFolderId) {
      return NextResponse.json({ files: [] }); // Or error
    }

    if (rootFolderId.includes("folders/")) {
      rootFolderId = rootFolderId.split("folders/").pop()?.split("?")[0] || rootFolderId;
    }
    rootFolderId = rootFolderId.trim().replace(/\/$/, "");

    // 1. Find "Quyết định" folder
    const decisionFolderId = await getFolderId(drive, "Quyết định", rootFolderId);
    if (!decisionFolderId) return NextResponse.json({ files: [] });

    // 2. Find course folder
    const courseFolderId = await getFolderId(drive, courseId, decisionFolderId);
    if (!courseFolderId) return NextResponse.json({ files: [] });

    // 3. List files
    const res = await drive.files.list({
      q: `'${courseFolderId}' in parents and trashed=false`,
      fields: "files(id, name, webViewLink)",
      spaces: "drive",
    });

    const files = res.data.files || [];
    
    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error fetching decision files:", error);
    return NextResponse.json({ error: "Không thể tải danh sách file." }, { status: 500 });
  }
}
