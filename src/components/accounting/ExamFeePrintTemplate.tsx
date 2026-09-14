import React from "react";
import { ExamStudent } from "@/actions/exam_fees";

export type PrintStudent = ExamStudent & { qrDataUri?: string | null };

interface ExamFeePrintTemplateProps {
  students: PrintStudent[];
  isGrouped: boolean;
  teacherFilter?: string;
}

export const ExamFeePrintTemplate = React.forwardRef<HTMLDivElement, ExamFeePrintTemplateProps>(
  ({ students, isGrouped, teacherFilter }, ref) => {
    
    // Group students by teacher
    const byTeacher = React.useMemo(() => {
      if (!isGrouped) {
        return { "Tất cả": students };
      }
      return students.reduce((acc: Record<string, PrintStudent[]>, curr) => {
        const gv = curr.GiaoVien || "Khác";
        if (!acc[gv]) acc[gv] = [];
        acc[gv].push(curr);
        return acc;
      }, {});
    }, [students, isGrouped]);

    const gvList = teacherFilter ? [teacherFilter] : Object.keys(byTeacher);

    return (
      <div ref={ref} className="bg-white print:p-8 p-4">
        {/* Style specifically for print to ensure landscape and breaks */}
        <style type="text/css" media="print">
          {`
            @page { size: A4 landscape; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-before: always; break-before: page; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          `}
        </style>

        {gvList.map((gv, index) => {
          const list = byTeacher[gv] || [];
          if (list.length === 0) return null;

          const td_ngay = list[0]?.NgayThi ? `Ngày thi: ${list[0].NgayThi}` : "";
          const titleStr = isGrouped 
            ? `Đầu mối: ${gv}  |  ${td_ngay}  |  Tổng số: ${list.length} hồ sơ`
            : `${td_ngay}  |  Tổng số: ${list.length} hồ sơ`;

          return (
            <div key={gv} className={index > 0 ? "page-break mt-8" : ""}>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase text-slate-800">Danh sách học viên sát hạch lái xe</h1>
                <p className="text-sm font-semibold mt-2 text-slate-700">{titleStr}</p>
              </div>

              <table className="w-full border-collapse border border-gray-800 text-xs text-slate-800">
                <thead className="bg-gray-100 font-bold text-center">
                  <tr>
                    <th className="border border-gray-800 p-3 w-10">STT</th>
                    <th className="border border-gray-800 p-3">Họ tên</th>
                    <th className="border border-gray-800 p-3 w-20">Ngày sinh</th>
                    <th className="border border-gray-800 p-3 w-24">CCCD</th>
                    {!isGrouped && <th className="border border-gray-800 p-3 w-28">Giáo viên</th>}
                    <th className="border border-gray-800 p-3 w-16">Hạng</th>
                    <th className="border border-gray-800 p-3 w-24">Ghi chú</th>
                    <th className="border border-gray-800 p-3 w-24">Thành tiền</th>
                    <th className="border border-gray-800 p-3 w-24">Mã QR</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s, i) => (
                    <tr key={i} className="text-center">
                      <td className="border border-gray-800 p-2">{s.STT || (i + 1)}</td>
                      <td className="border border-gray-800 p-2 text-left font-medium">{s.HoTen}</td>
                      <td className="border border-gray-800 p-2">{s.NgaySinh}</td>
                      <td className="border border-gray-800 p-2">{s.CCCD}</td>
                      {!isGrouped && <td className="border border-gray-800 p-2 text-left">{s.GiaoVien}</td>}
                      <td className="border border-gray-800 p-2">{s.Hang}</td>
                      <td className="border border-gray-800 p-2 text-left">{s.GhiChu}</td>
                      <td className="border border-gray-800 p-2 text-right font-medium">
                        {s.ThanhTien ? Number(s.ThanhTien).toLocaleString('vi-VN') : ""}
                      </td>
                      <td className="border border-gray-800 p-2 text-center align-middle">
                        {s.qrDataUri ? (
                          <img src={s.qrDataUri} alt="QR" className="w-[60px] h-[60px] object-contain inline-block" />
                        ) : (
                          <span className="text-red-500 font-medium">{s.MaQR ? "Lỗi QR" : ""}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }
);

ExamFeePrintTemplate.displayName = "ExamFeePrintTemplate";
