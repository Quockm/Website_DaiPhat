import { getDriveService, getFolderId, createFolder, uploadToDrive } from "./drive";

export async function uploadFile(
  file: File,
  folderPath: string, // VD: "Hồ sơ Giáo viên/GV_NguyenVanA"
  fileNamePrefix: string
): Promise<{ url: string; thumbnailUrl: string; isLocal: boolean }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const finalFileName = `${fileNamePrefix}_${Date.now()}_${safeFileName}`;

  // Use Google Drive
  const drive = getDriveService();
  let rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID in environment");
  }

  // Clean rootFolderId if it's a URL
  if (rootFolderId.includes("folders/")) {
    rootFolderId = rootFolderId.split("folders/").pop()?.split("?")[0] || rootFolderId;
  }
  rootFolderId = rootFolderId.trim().replace(/\/$/, "");

  // Resolve folder path on Drive
  const pathParts = folderPath.split("/").map(p => p.trim()).filter(Boolean);
  let currentParentId = rootFolderId;

  for (const part of pathParts) {
    let folderId = await getFolderId(drive, part, currentParentId);
    if (!folderId) {
      folderId = await createFolder(drive, part, currentParentId);
    }
    currentParentId = folderId;
  }

  // Determine mimeType
  const mimeType = file.type || "application/octet-stream";

  // Upload to Drive
  const result = await uploadToDrive(
    drive,
    buffer,
    finalFileName,
    mimeType,
    currentParentId
  );

  return {
    url: result.webViewLink,
    thumbnailUrl: result.webViewLink, // Client proxies drive links
    isLocal: false,
  };
}
