import { NextRequest, NextResponse } from "next/server";
import { getDriveService, getFolderId } from "@/lib/drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const drive = getDriveService();
    let rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!rootFolderId) {
      return NextResponse.json({ files: [] });
    }

    if (rootFolderId.includes("folders/")) {
      rootFolderId = rootFolderId.split("folders/").pop()?.split("?")[0] || rootFolderId;
    }
    rootFolderId = rootFolderId.trim().replace(/\/$/, "");

    // 1. Find "Lưu Trữ Công văn" folder
    const parentFolderId = await getFolderId(drive, "Lưu Trữ Công văn", rootFolderId);
    if (!parentFolderId) return NextResponse.json({ congVanFiles: [], quyetDinhFiles: [] });

    // 2. Find target folders
    const congVanFolderId = await getFolderId(drive, "Công văn chung", parentFolderId);
    const quyetDinhFolderId = await getFolderId(drive, "Quyết Định chung", parentFolderId);

    // 3. List files helper
    const getFilesFromFolder = async (folderId: string | null) => {
      if (!folderId) return [];
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: "files(id, name, webViewLink, createdTime)",
        spaces: "drive",
        orderBy: "createdTime desc"
      });
      return res.data.files || [];
    };

    const congVanFiles = await getFilesFromFolder(congVanFolderId);
    const quyetDinhFiles = await getFilesFromFolder(quyetDinhFolderId);
    
    return NextResponse.json({ congVanFiles, quyetDinhFiles });
  } catch (error: any) {
    console.error("Error fetching document files:", error);
    return NextResponse.json({ error: "Không thể tải danh sách file." }, { status: 500 });
  }
}
