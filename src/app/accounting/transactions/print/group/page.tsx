import { getGroupedFeeStudents } from "@/actions/accounting";

function numberToWords(num: number): string {
  if (num === 0) return "Không đồng";
  
  const ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ"];

  let words = "";
  let scaleIndex = 0;

  while (num > 0) {
    let chunk = num % 1000;
    if (chunk > 0) {
      let chunkWords = "";
      
      let h = Math.floor(chunk / 100);
      let t = Math.floor((chunk % 100) / 10);
      let o = chunk % 10;

      if (h > 0) {
        chunkWords += ones[h] + " trăm ";
        if (t === 0 && o > 0) chunkWords += "lẻ ";
      }
      
      if (t > 0) {
        chunkWords += tens[t] + " ";
      }
      
      if (o > 0) {
        if (o === 1 && t > 1) chunkWords += "mốt ";
        else if (o === 5 && t > 0) chunkWords += "lăm ";
        else chunkWords += ones[o] + " ";
      }
      
      words = chunkWords + scales[scaleIndex] + " " + words;
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  
  const finalStr = words.trim().replace(/\s+/g, ' ');
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + " đồng chẵn.";
}

export default async function PrintGroupReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const nguoiNop = (params.nguoiNop as string) || "Khách lẻ";
  const maKhoa = (params.maKhoa as string) || "ALL";
  const ngayDuyet = params.ngayDuyet as string;

  const d = new Date(ngayDuyet);
  const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  
  const students = await getGroupedFeeStudents(nguoiNop, maKhoa === 'ALL' ? '' : maKhoa, dateStr);
  const soTien = students.reduce((acc, s) => acc + (s.daNop || 0), 0);
  
  // They might have different payment methods, but we just take the first one or default to Tiền mặt
  const hinhThuc = students.length > 0 && students[0].hinhThucThu ? students[0].hinhThucThu : "Tiền mặt";
  
  const maGD = `HPG_${nguoiNop}_${maKhoa}_${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  
  const receiptTitle = "PHIẾU THU";
  // User requested: "họ tên người nhận tiền là đầu mối/ giáo viên"
  // Normally Phiếu Thu is "Họ, tên người nộp tiền", but we'll fulfill their exact wording if they want,
  // or we'll stick to normal Phiếu Thu formatting which uses NguoiNop.
  // Actually, I'll use "Họ, tên người nộp tiền/ nhận tiền" or just "Họ, tên người nộp tiền" but put the teacher's name there.
  // "vẫn có chức năng in phiếu thu/chi như thu chi bình thường, trong đó họ tên người nhận tiền là đầu mối/ giáo viên"
  // This probably means the field should display the teacher's name. In normal receipt, the field is "nguoiNhanNop".
  const personRole = "Họ, tên người nộp tiền"; 
  const reasonText = "Lý do nộp";
  const titleColor = "text-emerald-700";
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return (
    <div className="bg-white print:min-h-0 print:h-screen print:overflow-hidden">
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      
      <div className="max-w-3xl mx-auto p-6 text-slate-900 bg-white shadow-xl my-8 print:shadow-none print:m-0 print:p-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-base uppercase">CÔNG TY TNHH PHÁT TRIỂN GIÁO DỤC NGHỀ NGHIỆP HÒA BÌNH</h2>
            <h2 className="font-bold text-base uppercase">TRUNG TÂM GDNN ĐẠI PHÁT</h2>
            <p className="text-sm italic">Bộ phận Kế toán</p>
          </div>
          <div className="text-right text-sm">
            <p>Mẫu số: <strong>01-TT</strong></p>
            <p>Mã chứng từ: <strong>{maGD}</strong></p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-1 ${titleColor}`}>{receiptTitle}</h1>
          <p className="italic text-sm">Ngày {day} tháng {month} năm {year}</p>
        </div>

        <div className="space-y-3.5 mb-8 text-base leading-relaxed">
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">{personRole}:</span>
            <span className="flex-1 font-bold">{nguoiNop}</span>
          </div>
          
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">{reasonText}:</span>
            <span className="flex-1">Thu học phí {maKhoa !== 'ALL' ? `(Khoá ${maKhoa})` : ''}</span>
          </div>
          
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">Số tiền:</span>
            <span className="flex-1 font-bold text-lg">{Number(soTien).toLocaleString('en-US')} VNĐ</span>
          </div>
          
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">Bằng chữ:</span>
            <span className="flex-1 italic">{numberToWords(soTien)}</span>
          </div>

          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">Hình thức thanh toán:</span>
            <span className="flex-1 font-bold">{hinhThuc}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center mt-6 pt-2">
          <div>
            <p className="font-bold">Giám đốc</p>
            <p className="italic text-xs text-slate-500">(Ký, họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Kế toán trưởng</p>
            <p className="italic text-xs text-slate-500">(Ký, họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Người lập phiếu</p>
            <p className="italic text-xs text-slate-500">(Ký, họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Người nộp tiền</p>
            <p className="italic text-xs text-slate-500">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold">{nguoiNop}</p>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { height: 100vh; margin: 0; padding: 0; overflow: hidden; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          @page { size: A5 landscape; margin: 0.5cm; }
        }
      `}} />
    </div>
  );
}
