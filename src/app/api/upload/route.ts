import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import { Readable } from "stream";
import fs from "fs";

// Find the credentials file case-insensitively
const findCredentialsFile = () => {
  const dir = process.cwd();
  const files = fs.readdirSync(dir);
  const credFile = files.find(f => f.toLowerCase().includes('quan-ly-zns-dai-phat') && f.toLowerCase().endsWith('.json'));
  return credFile ? path.join(dir, credFile) : null;
};

const getDriveService = () => {
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

async function getFolderId(drive: any, folderName: string, parentId?: string): Promise<string | null> {
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

async function createFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const objectId = formData.get("objectId") as string; // Teacher or Car ID / Name
    const docType = formData.get("docType") as string; // CCCD, GPLX, etc.

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const drive = getDriveService();
    
    let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json({ 
        error: "Chưa cấu hình GOOGLE_DRIVE_FOLDER_ID trong file .env. Hãy tạo 1 thư mục trên Drive của bạn, chia sẻ quyền Chỉnh sửa cho email drive-bot@... và lấy ID thư mục dán vào file .env" 
      }, { status: 400 });
    }

    // Nếu người dùng paste cả đường link (https://drive.google.com/drive/u/0/folders/1ycIZAch...)
    // thì lấy phần ID cuối cùng
    if (folderId.includes("folders/")) {
      folderId = folderId.split("folders/").pop()?.split("?")[0] || folderId;
    }
    // Remove any trailing slashes or spaces
    folderId = folderId.trim().replace(/\/$/, "");

    // Convert File to a stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Xác định thư mục cha (Giáo viên hay Xe)
    const isTeacher = objectId.startsWith("GV_");
    const parentFolderName = isTeacher ? "Hồ sơ Giáo viên" : "Hồ sơ Phương tiện";
    
    // Tìm hoặc tạo thư mục loại (Teacher/Car) bên trong GOOGLE_DRIVE_FOLDER_ID
    let categoryFolderId = await getFolderId(drive, parentFolderName, folderId);
    if (!categoryFolderId) {
      categoryFolderId = await createFolder(drive, parentFolderName, folderId);
    }

    // Tên thư mục của đối tượng (ví dụ: GV_NguyenVanA hoặc XE_51A_12345)
    // Giữ nguyên tiếng Việt, chỉ bỏ các ký tự đặc biệt có thể gây lỗi hiển thị
    const objectFolderName = objectId.trim();

    // Tìm hoặc tạo thư mục cho đối tượng
    let objectFolderId = await getFolderId(drive, objectFolderName, categoryFolderId);
    if (!objectFolderId) {
      objectFolderId = await createFolder(drive, objectFolderName, categoryFolderId);
    }

    // Create file name: Object_DocType_Filename
    const fileName = `${objectId}_${docType}_${file.name}`;

    const fileMetadata = {
      name: fileName,
      parents: [objectFolderId],
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink, webContentLink, thumbnailLink",
    });

    // Make the file public so the web app can view it directly
    await drive.permissions.create({
      fileId: uploadedFile.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      }
    });

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.data.id,
      webViewLink: uploadedFile.data.webViewLink,
      webContentLink: uploadedFile.data.webContentLink,
      thumbnailLink: uploadedFile.data.thumbnailLink ? uploadedFile.data.thumbnailLink.replace(/=s\d+$/, '=s1000') : null,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
