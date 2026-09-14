import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ExcelJS from "exceljs";

function getSeededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  seed = Math.abs(seed);
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function getComputedDates(khai_giang: any, ngay_thi: any, dates: any) {
  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  };

  const getNextWorkingDay = (date: Date) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    if (nextDate.getDay() === 0) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate;
  };

  let computedDates: string[] = [];
  let curr = parseDateStr(khai_giang || dates?.[0] || ngay_thi);
  if (curr) {
    if (curr.getDay() === 0) curr = getNextWorkingDay(curr);
    for (let i = 0; i < 30; i++) {
      const dd = String(curr.getDate()).padStart(2, '0');
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const yyyy = curr.getFullYear();
      computedDates.push(`${dd}/${mm}/${yyyy}`);
      curr = getNextWorkingDay(curr);
    }
  } else {
    computedDates = dates || [];
  }
  return computedDates;
}

function getCourseAbsences(ma_khoa: string, students: any[], totalDays: number) {
  const rand = getSeededRandom(ma_khoa);
  let absencesByDay: { [day: number]: number[] } = {}; 
  
  if (totalDays > 0 && students && students.length > 0) {
    const numAbsentDays = Math.floor(rand() * 3) + 1; // 1 to 3 days
    for (let i = 0; i < numAbsentDays; i++) {
      const d = Math.floor(rand() * totalDays);
      if (!absencesByDay[d]) absencesByDay[d] = [];
      const numHv = Math.floor(rand() * 3) + 1; // 1 to 3 students
      for (let j = 0; j < numHv; j++) {
        const hvIdx = Math.floor(rand() * students.length);
        if (!absencesByDay[d].includes(hvIdx)) {
          absencesByDay[d].push(hvIdx);
        }
      }
    }
  }
  return absencesByDay; 
}

export async function generateMotoDocxBuffer(data: any): Promise<Buffer> {
  const { 
    template, 
    khoa, 
    hang, 
    ngay_thi, 
    tu_ngay, 
    den_ngay, 
    ngay_ky_full, 
    lop, 
    giao_vien, 
    students 
  } = data;

  if (!template) throw new Error("Missing template");

  const templatePath = path.join(process.cwd(), "public", "templates", "lesson-plans", template);
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${template}`);

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    parser: function (tag) {
      return {
        get: function (scope) {
          if (tag === '.') return scope;
          return scope[tag] || "";
        }
      };
    },
    errorLogging: false,
  });

  const NHAN_XET_POOL = [
    "Lớp học nghiêm túc, tham gia đầy đủ",
    "Học viên tiếp thu bài tốt, thái độ học tập nghiêm túc",
    "Lớp học sôi nổi, nhiều ý kiến xây dựng",
    "Đảm bảo an toàn tuyệt đối trong quá trình học",
    "Học viên hoàn thành tốt nội dung đề ra",
    "Thái độ học tập tốt, hoàn thành đầy đủ bài tập",
    "Lớp học đạt yêu cầu, học viên nghiêm túc",
    "Tiếp thu nhanh các nội dung thực hành",
    "Học viên có ý thức tốt, tham gia đầy đủ",
    "Hoàn thành tốt các kỹ năng cơ bản",
    "Lớp học tập trung, nắm vững lý thuyết",
    "Thực hành tốt, thái độ tích cực"
  ];

  const tong_hs = students?.length || 0;
  let ngay_thi_str = ngay_thi || "";
  let th_thi = "";
  let nm_thi = "";
  let ng_thi = "";

  if (ngay_thi_str) {
    const parts = ngay_thi_str.split('/');
    if (parts.length === 3) {
      ng_thi = parts[0];
      th_thi = parts[1];
      nm_thi = parts[2];
      ngay_thi_str = `Ngày ${ng_thi} tháng ${th_thi} năm ${nm_thi}`;
    }
  }

  const context: any = {
    makhoa: khoa?.ma_khoa || "",
    ma_khoa: khoa?.ma_khoa || "",
    hang: hang || "",
    sl_hv: tong_hs.toString(),
    tong_hs: tong_hs.toString(),
    ngay_thi: ng_thi,
    thang_thi: th_thi,
    nam_thi: nm_thi,
    ngay_thi_full: ngay_thi_str,
    tu_ngay: tu_ngay || "",
    den_ngay: den_ngay || "",
    ngay_ky_full: ngay_ky_full || "",
    ten_giaovien: giao_vien || "",
    lop: lop || ""
  };

  const ma_khoa = khoa?.ma_khoa || "MOTO";
  const computedDates = getComputedDates(khoa?.khai_giang, ngay_thi, data.dates);
  const totalDays = Math.min(computedDates.length, 10);
  const absencesByDay = getCourseAbsences(ma_khoa, students || [], totalDays);
  const rand = getSeededRandom(ma_khoa + "_nx");

  for (let i = 1; i <= 20; i++) {
    let dayAbsences = absencesByDay[i - 1] || [];
    let hs_vang = dayAbsences.length;
    let hs_co_mat = tong_hs - hs_vang;
    let ten_hs_vang = hs_vang > 0 ? dayAbsences.map(idx => students[idx].HoTen).join(", ") : "Không";

    const nx = NHAN_XET_POOL[Math.floor(rand() * NHAN_XET_POOL.length)];
    context[`hs_vang_${i}`] = hs_vang.toString();
    context[`hs_co_mat_${i}`] = hs_co_mat.toString();
    context[`ten_hs_vang_${i}`] = ten_hs_vang;
    context[`nhan_xet_gv_${i}`] = nx;
  }

  context['hs_vang'] = context['hs_vang_1'] || "0";
  context['hs_co_mat'] = context['hs_co_mat_1'] || tong_hs.toString();
  context['ten_hs_vang'] = context['ten_hs_vang_1'] || "Không";
  context['nhan_xet_gv'] = context['nhan_xet_gv_1'] || "";

  try {
    doc.render(context);
  } catch (error: any) {
    throw error;
  }

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function generateMotoXlsxBuffer(data: any): Promise<Buffer> {
  const { 
    excelTemplate, 
    khoa, 
    hang,
    ngay_thi, 
    tu_ngay,
    den_ngay,
    khai_giang,
    lop, 
    gv_lt,
    gv_th, 
    dates,
    students 
  } = data;

  if (!excelTemplate) throw new Error("Missing excelTemplate");

  const templatePath = path.join(process.cwd(), "public", "templates", "lesson-plans", excelTemplate);
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${excelTemplate}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const ma_khoa = khoa?.ma_khoa || "MOTO";
  const quyet_dinh = khoa?.quyet_dinh || ma_khoa;
  const sl_hv = khoa?.sl_hv || students?.length || 0;

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d.getTime())) {
        const day = d.getDay();
        return day === 0 ? "CN" : `${day + 1}`;
      }
    }
    return "";
  };

  const computedDates = getComputedDates(khai_giang || khoa?.khai_giang, ngay_thi, dates);
  const totalDays = Math.min(computedDates.length, 10);
  const absencesByDay = getCourseAbsences(ma_khoa, students || [], totalDays);

  const sheetBia = workbook.getWorksheet("BÌA");
  if (sheetBia) {
    sheetBia.getCell("E20").value = `Mô tô hạng ${hang || "A1"}`;
    sheetBia.getCell("F20").value = ""; 
    sheetBia.getCell("E22").value = ma_khoa;
    sheetBia.getCell("F22").value = ""; 
    sheetBia.getCell("E23").value = ngay_thi || "";
    sheetBia.getCell("F23").value = ""; 
  }

  const sheetTT = workbook.getWorksheet("THÔNG TIN LỚP HỌC");
  if (sheetTT) {
    const qdText = `2. Quyết định thành lập lớp học: ${quyet_dinh}`;
    sheetTT.getCell("B13").value = qdText;
    sheetTT.getCell("F13").value = qdText;
    const ssText = `          a)  Sĩ số lớp học: ${sl_hv}`;
    sheetTT.getCell("B17").value = ssText;
    sheetTT.getCell("E17").value = ssText;
    sheetTT.getCell("E20").value = gv_lt || gv_th || "";
    sheetTT.getCell("E21").value = gv_th || "";
    sheetTT.getCell("E25").value = "x";
    sheetTT.getCell("E25").alignment = { horizontal: "right" };
    sheetTT.getCell("E26").value = "x";
    sheetTT.getCell("E26").alignment = { horizontal: "right" };
    sheetTT.getCell("G27").value = "x";
    sheetTT.getCell("G27").alignment = { horizontal: "right" };
  }

  const sheetTKB = workbook.getWorksheet("THỜI KHÓA BIỂU");
  if (sheetTKB) {
    let dateIdx = 0;
    sheetTKB.eachRow((row, r) => {
      row.eachCell((cell, c) => {
        if (cell.isMerged && cell.master.address !== cell.address) return;
        const val = String(cell.value || "");
        if (val.toLowerCase().includes("thứ")) {
          if (dateIdx < computedDates.length) {
            const dStr = computedDates[dateIdx];
            const dayName = getDayName(dStr);
            const shortDate = dStr.substring(0, 5);
            cell.value = `Thứ ${dayName}       ${shortDate}`;
            dateIdx++;
          } else {
            cell.value = ""; 
          }
        }
      });
    });

    sheetTKB.getCell("E2").value = tu_ngay || "";
    sheetTKB.getCell("G2").value = den_ngay || "";
    sheetTKB.getCell("E17").value = tu_ngay || "";
    sheetTKB.getCell("G17").value = den_ngay || "";
    sheetTKB.getCell("C11").value = gv_lt || "";
    sheetTKB.getCell("C13").value = gv_th || "";
    sheetTKB.getCell("C26").value = gv_lt || "";
    sheetTKB.getCell("C28").value = gv_th || "";
  }

  let sheetDS = workbook.getWorksheet("DANH SÁCH");
  if (!sheetDS) sheetDS = workbook.getWorksheet("THEO DÕI");

  if (sheetDS && students && students.length > 0) {
    if (totalDays > 0) {
      const row5 = sheetDS.getRow(5);
      for (let i = 0; i < totalDays; i++) {
        const col = 3 + i;
        const cell = row5.getCell(col);
        cell.value = computedDates[i].substring(0, 5);
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
      row5.commit();
    }

    const startRow = 6;
    students.forEach((hv: any, idx: number) => {
      const row = sheetDS!.getRow(startRow + idx);
      row.getCell(1).value = idx + 1;
      row.getCell(2).value = hv.HoTen || "";
      
      let soNgayVang = 0;
      for (let i = 0; i < totalDays; i++) {
        const dayAbsences = absencesByDay[i] || [];
        const isVang = dayAbsences.includes(idx);
        
        const cell = row.getCell(3 + i);
        cell.value = isVang ? "x" : "";
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (isVang) soNgayVang++;
      }

      if (soNgayVang > 0) {
        const mCell = row.getCell(13);
        mCell.value = soNgayVang * 2;
        mCell.alignment = { horizontal: "center", vertical: "middle" };
        row.getCell(14).value = "Vắng phép";
      } else {
        row.getCell(13).value = "";
        row.getCell(14).value = "";
      }

      row.commit();
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
