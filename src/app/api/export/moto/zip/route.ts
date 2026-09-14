import { NextResponse } from "next/server";
import { generateMotoDocxBuffer, generateMotoXlsxBuffer } from "@/lib/exportMoto";
import JSZip from "jszip";
import { getDriveService, getFolderId, createFolder } from "@/lib/drive";
import { Readable } from "stream";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.template || !data.biaTemplate || !data.excelTemplate || !data.khoa?.ma_khoa) {
      return NextResponse.json({ error: "Thiếu dữ liệu template hoặc mã khóa" }, { status: 400 });
    }

    const ma_khoa = data.khoa.ma_khoa;

    // 1. Sinh các file buffer
    // Giáo án Word
    const gaBuffer = await generateMotoDocxBuffer({ ...data, template: data.template });
    // Bìa Word
    const biaBuffer = await generateMotoDocxBuffer({ ...data, template: data.biaTemplate });
    // Sổ lên lớp Excel
    const excelBuffer = await generateMotoXlsxBuffer(data);

    // 2. Gom vào file ZIP
    const zip = new JSZip();
    zip.file(`GiaoAn_Moto_${ma_khoa}.docx`, gaBuffer);
    zip.file(`Bia_Moto_${ma_khoa}.docx`, biaBuffer);
    zip.file(`SoLenLop_Moto_${ma_khoa}.xlsx`, excelBuffer);
    
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // 3. Upload lên Google Drive (nếu cấu hình)
    try {
      const drive = getDriveService();
      let rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (rootFolderId) {
        if (rootFolderId.includes("folders/")) {
          rootFolderId = rootFolderId.split("folders/").pop()?.split("?")[0] || rootFolderId;
        }
        rootFolderId = rootFolderId.trim().replace(/\/$/, "");

        // Find/Create "Lưu Trữ Giáo án"
        let luuTruId = await getFolderId(drive, "Lưu Trữ Giáo án", rootFolderId);
        if (!luuTruId) luuTruId = await createFolder(drive, "Lưu Trữ Giáo án", rootFolderId);

        // Find/Create "giáo án Moto"
        let motoFolderId = await getFolderId(drive, "giáo án Moto", luuTruId);
        if (!motoFolderId) motoFolderId = await createFolder(drive, "giáo án Moto", luuTruId);

        // Find/Create "mã khóa"
        let khoaFolderId = await getFolderId(drive, ma_khoa, motoFolderId);
        if (!khoaFolderId) khoaFolderId = await createFolder(drive, ma_khoa, motoFolderId);

        const zipName = `${ma_khoa}.zip`;

        // Check if zip already exists to delete
        const existingFile = await getFolderId(drive, zipName, khoaFolderId);
        if (existingFile) {
          await drive.files.delete({ fileId: existingFile });
        }

        // Upload ZIP
        const stream = new Readable();
        stream.push(zipBuffer);
        stream.push(null);

        await drive.files.create({
          requestBody: {
            name: zipName,
            parents: [khoaFolderId],
          },
          media: {
            body: stream,
          },
          fields: "id",
        });
        console.log(`Uploaded ZIP to Drive: ${zipName}`);
      }
    } catch (driveError: any) {
      console.error("Lỗi khi upload Drive (nhưng file zip vẫn trả về được):", driveError.message);
      // Tiếp tục trả về file tải xuống cho người dùng dù Drive bị lỗi
    }

    // 4. Trả file ZIP về cho client download
    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${ma_khoa}.zip"`,
      },
    });

  } catch (error: any) {
    console.error("Export ZIP error:", error);
    return NextResponse.json(
      { error: "Lỗi tạo file ZIP." },
      { status: 500 }
    );
  }
}
