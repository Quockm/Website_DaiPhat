import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { getTestingStudents } from "@/actions/testing/students.actions";

// Khởi tạo fonts một lần nếu có thể
const fontPath = path.join(process.cwd(), "public", "fonts");
try {
  registerFont(path.join(fontPath, "arial.ttf"), { family: "Arial" });
  registerFont(path.join(fontPath, "arialbd.ttf"), { family: "Arial", weight: "bold" });
  registerFont(path.join(fontPath, "timesbd.ttf"), { family: "Times New Roman", weight: "bold" });
} catch (e) {
  console.log("Could not register fonts. Fallback to system fonts.");
}

function getFittedFont(ctx: any, text: string, maxWidth: number, startSize: number, fontName: string) {
  let size = startSize;
  ctx.font = `${size}px "${fontName}"`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${size}px "${fontName}"`;
  }
  return ctx.font;
}

async function generateSingleCard(data: any, config: any) {
  const width = 1118;
  const height = 661;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Fill white background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  const headerHeight = 140;
  const cardColor = config.card_color || "white";
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = "black";
  ctx.strokeRect(0, 0, width, height);

  let headerTextColor = "black";
  if (cardColor === "blue") {
    ctx.fillStyle = "#0070c0";
    ctx.fillRect(0, 0, width, headerHeight);
    headerTextColor = "white";
  }
  ctx.strokeRect(0, 0, width, headerHeight);

  const ttText = (config.tt_sh || "").trim().toUpperCase();
  const dvText = (config.don_vi || "").trim().toUpperCase();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = headerTextColor;

  ctx.font = getFittedFont(ctx, ttText, width - 40, 48, "Times New Roman bold");
  ctx.fillText(ttText, width / 2, 55);

  ctx.font = getFittedFont(ctx, dvText, width - 40, 42, "Times New Roman bold");
  ctx.fillText(dvText, width / 2, 105);

  const boxX = 15;
  const boxY = headerHeight + 15;
  const boxH = height - boxY - 15;
  const boxW = Math.floor(boxH * 0.75);

  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Load photo
  if (data.cccd) {
    try {
      const imgPath = path.join(process.cwd(), "DATA", "IMAGE", `${data.cccd}.jpg`);
      if (fs.existsSync(imgPath)) {
        const photo = await loadImage(imgPath);
        ctx.drawImage(photo, boxX + 2, boxY + 2, boxW - 4, boxH - 4);
      }
    } catch (e) {
      console.log("Image load error for", data.cccd);
    }
  }

  const textAreaX = boxX + boxW + 15;
  const textCenterX = textAreaX + (width - textAreaX) / 2;

  const y1 = headerHeight + 80;
  const y2 = y1 + 80;
  const y3 = y2 + 90;
  const y4 = y3 + 90;
  const y5 = y4 + 85;

  ctx.fillStyle = "black";
  ctx.font = `bold 52px Arial`;
  ctx.fillText("THẺ DỰ SÁT HẠCH", textCenterX, y1);

  ctx.font = `46px Arial`;
  ctx.fillText(`NGÀY THI: ${data.exam_date || ""}`, textCenterX, y2);

  const studentName = data.name || "";
  const maxNameWidth = width - textAreaX - 30;
  ctx.font = getFittedFont(ctx, studentName, maxNameWidth, 66, "Times New Roman bold");
  ctx.fillText(studentName, textCenterX, y3);

  ctx.font = `46px Arial`;
  ctx.fillText(`NGÀY SINH: ${data.dob || ""}`, textCenterX, y4);

  const hangLbl = "HẠNG: ";
  const rankVal = data.rank || "";
  const sbdLbl = "SBD: ";
  const sbdVal = data.sbd || "";

  ctx.font = `46px Arial`;
  const wHangLbl = ctx.measureText(hangLbl).width;
  ctx.font = `bold 46px Arial`;
  const wRankVal = ctx.measureText(rankVal).width;
  
  ctx.font = `46px Arial`;
  const wSpace = ctx.measureText("           ").width;
  const wSbdLbl = ctx.measureText(sbdLbl).width;
  
  ctx.font = `bold 46px Arial`;
  const wSbdVal = ctx.measureText(sbdVal).width;

  const totalW = wHangLbl + wRankVal + wSpace + wSbdLbl + wSbdVal;
  let startX = textCenterX - totalW / 2;

  ctx.textAlign = "left";
  
  ctx.font = `46px Arial`;
  ctx.fillText(hangLbl, startX, y5);
  startX += wHangLbl;
  
  ctx.font = `bold 46px Arial`;
  ctx.fillText(rankVal, startX, y5);
  startX += wRankVal + wSpace;
  
  ctx.font = `46px Arial`;
  ctx.fillText(sbdLbl, startX, y5);
  startX += wSbdLbl;
  
  ctx.font = `bold 46px Arial`;
  ctx.fillText(sbdVal, startX, y5);

  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { single_val, single_type, exam_date, don_vi, tt_sh, card_color, stt_by_order, scheduleId } = payload;

    const res = await getTestingStudents(scheduleId);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: "Lỗi khi lấy dữ liệu học viên" }, { status: 500 });
    }

    let students: any[] = res.data as any[];

    // Filter
    if (single_val) {
      const val = single_val.trim().toLowerCase();
      if (single_type === "stt") {
        students = students.filter((s: any) => String(s.stt) === val);
      } else {
        students = students.filter((s: any) => String(s.sbd).trim().toLowerCase() === val || String(s.cccd).trim().toLowerCase() === val);
      }
    }

    if (students.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy dữ liệu phù hợp." }, { status: 400 });
    }

    if (!stt_by_order) {
      students.sort((a: any, b: any) => {
        const aSbd = parseInt(a.sbd || "999999", 10) || 999999;
        const bSbd = parseInt(b.sbd || "999999", 10) || 999999;
        return (aSbd % 1000) - (bSbd % 1000);
      });
    }

    // Group by GV
    const groupByGv: Record<string, any[]> = {};
    for (const s of students) {
      const gv = s.gv || "KhongXacDinh";
      if (!groupByGv[gv]) groupByGv[gv] = [];
      groupByGv[gv].push(s);
    }

    const zip = new JSZip();

    for (const gvName of Object.keys(groupByGv)) {
      const groupStudents = groupByGv[gvName];
      const safeGvName = gvName.replace(/[^a-zA-Z0-9\s]/g, "").trim();

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const a4w = 595.28; // pt
      const a4h = 841.89;
      
      const margin = 20;
      const cardPtW = (a4w - margin * 3) / 2;
      const cardPtH = cardPtW * (661 / 1118); // maintain aspect ratio

      let countPerPage = 0;
      const maxPerPage = 10; // 2 cols x 5 rows

      for (let i = 0; i < groupStudents.length; i++) {
        const s = groupStudents[i];
        const dataUrl = await generateSingleCard(
          {
            name: s.name,
            dob: s.dob,
            sbd: s.sbd,
            exam_date,
            cccd: s.cccd,
            rank: s.hang,
          },
          { tt_sh, don_vi, card_color }
        );

        if (countPerPage === maxPerPage) {
          doc.addPage();
          countPerPage = 0;
        }

        const row = Math.floor(countPerPage / 2);
        const col = countPerPage % 2;

        const x = margin + col * (cardPtW + margin);
        const y = margin + row * (cardPtH + margin);

        doc.addImage(dataUrl, "JPEG", x, y, cardPtW, cardPtH);
        countPerPage++;
      }

      const pdfArrayBuffer = doc.output("arraybuffer");
      zip.file(`${safeGvName}_${groupStudents.length}.pdf`, pdfArrayBuffer);
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    const tt = (don_vi || "").replace("TRUNG TÂM GDNN", "").trim().replace(/\s+/g, "");
    const dStr = exam_date ? exam_date.replace(/\//g, "") : "HomNay";
    const customName = `TheDuThi_${tt}_${dStr}.zip`;

    return new NextResponse(zipContent as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(customName)}`,
      }
    });

  } catch (err: any) {
    console.error("Cards Export Error:", err);
    return NextResponse.json({ error: "Không thể xuất file Thẻ Dự Thi." }, { status: 500 });
  }
}
