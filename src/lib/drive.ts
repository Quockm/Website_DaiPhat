import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

export const findCredentialsFile = () => {
  const dir = process.cwd();
  const files = fs.readdirSync(dir);
  const credFile = files.find(f => f.toLowerCase().includes('quan-ly-zns-dai-phat') && f.toLowerCase().endsWith('.json'));
  return credFile ? path.join(dir, credFile) : null;
};

export const getDriveService = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    return google.drive({ version: "v3", auth: oauth2Client });
  }

  const keyFilePath = findCredentialsFile();
  if (keyFilePath) {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
    });
    return google.drive({ version: "v3", auth });
  }
  
  throw new Error("Không tìm thấy thông tin xác thực Google Drive (OAuth2 hoặc Service Account)");
};

export async function getFolderId(drive: any, folderName: string, parentId?: string): Promise<string | null> {
  try {
    let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentId) {
      q += ` and '${parentId}' in parents`;
    }
    const res = await drive.files.list({
      q,
      fields: "files(id, name)",
      spaces: "drive",
    });
    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }
    return null;
  } catch (e) {
    console.error("Error finding folder", e);
    return null;
  }
}

export async function createFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
  const fileMetadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }
  const file = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });
  return file.data.id;
}

export async function uploadToDrive(
  drive: any,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  parentId?: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  const fileMetadata: any = {
    name: fileName,
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const media = {
    mimeType: mimeType,
    body: Readable.from(buffer),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, webViewLink, webContentLink",
  });

  const fileId = res.data.id;

  // Set file to be public so that frontend proxy or direct links can read it
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (err) {
    console.warn("Could not set permission to public for file:", fileId, err);
  }

  return {
    id: fileId,
    webViewLink: res.data.webViewLink,
    webContentLink: res.data.webContentLink,
  };
}
