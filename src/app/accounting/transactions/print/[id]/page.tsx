import { getTransactionById } from "@/actions/accounting";
import { notFound } from "next/navigation";

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
  
  // Clean up extra spaces and capitalize first letter
  const finalStr = words.trim().replace(/\s+/g, ' ');
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + " đồng chẵn.";
}

export default async function PrintReceiptPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const transaction = await getTransactionById(params.id);

  if (!transaction) {
    notFound();
  }

  const isThu = transaction.loaiGD === 'THU';
  const receiptTitle = isThu ? "PHIẾU THU" : "PHIẾU CHI";
  const personRole = isThu ? "Họ, tên người nộp tiền" : "Họ, tên người nhận tiền";
  const reasonText = isThu ? "Lý do nộp" : "Lý do chi";
  const titleColor = isThu ? "text-emerald-700" : "text-rose-700";
  
  const txDate = new Date(transaction.ngayGD);
  const day = txDate.getDate().toString().padStart(2, '0');
  const month = (txDate.getMonth() + 1).toString().padStart(2, '0');
  const year = txDate.getFullYear();

  return (
    <div className="bg-white print:min-h-0 print:h-screen print:overflow-hidden">
      {/* Script to auto-print */}
      <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { window.print(); }` }} />
      
      {/* Printable Area - A5 / Half A4 roughly */}
      <div className="max-w-3xl mx-auto p-6 text-slate-900 bg-white shadow-xl my-8 print:shadow-none print:m-0 print:p-0" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-base uppercase">CÔNG TY TNHH PHÁT TRIỂN GIÁO DỤC NGHỀ NGHIỆP HÒA BÌNH</h2>
            <h2 className="font-bold text-base uppercase">TRUNG TÂM GDNN ĐẠI PHÁT</h2>
            <p className="text-sm italic">Bộ phận Kế toán</p>
          </div>
          <div className="text-right text-sm">
            <p>Mẫu số: <strong>01-TT</strong></p>
            <p>Mã chứng từ: <strong>{transaction.maGD}</strong></p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className={`text-3xl font-bold mb-1 ${titleColor}`}>{receiptTitle}</h1>
          <p className="italic text-sm">Ngày {day} tháng {month} năm {year}</p>
        </div>

        {/* Content */}
        <div className="space-y-3.5 mb-8 text-base leading-relaxed">
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">{personRole}:</span>
            <span className="flex-1 font-bold">{transaction.nguoiNhanNop || '...................................................'}</span>
          </div>
          
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">{reasonText}:</span>
            <span className="flex-1">{transaction.danhMuc || '...................................................'}</span>
          </div>
          
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">Số tiền:</span>
            <span className="flex-1 font-bold text-lg">{Number(transaction.soTien).toLocaleString('vi-VN')} VNĐ</span>
          </div>
          
          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">Bằng chữ:</span>
            <span className="flex-1 italic">{numberToWords(Number(transaction.soTien))}</span>
          </div>

          <div className="flex border-b border-dotted border-slate-300 pb-1">
            <span className="w-48 font-semibold">Hình thức thanh toán:</span>
            <span className="flex-1 font-bold">{transaction.hinhThuc || '...................................................'}</span>
          </div>
        </div>

        {/* Signatures */}
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
            <p className="font-bold">{isThu ? 'Người nộp tiền' : 'Người nhận tiền'}</p>
            <p className="italic text-xs text-slate-500">(Ký, họ tên)</p>
            <div className="h-16"></div>
            <p className="font-bold">{transaction.nguoiNhanNop}</p>
          </div>
        </div>
      </div>
      
      {/* Hide next.js dev stuff during print */}
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
