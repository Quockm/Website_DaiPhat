import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface StudentPrintData {
  cccd: string;
  stt: string;
  sbd: string;
  name: string;
  dob: string;
  school: string;
  hang: string;
  ndsh: string;
  qr_hinh: string;
  qr_duong: string;
  qr_gplx: string;
}

interface PrintBienBanProps {
  students: StudentPrintData[];
  center: string;
  day: string;
  month: string;
}

export const PrintBienBan = forwardRef<HTMLDivElement, PrintBienBanProps>(({ students, center, day, month }, ref) => {
  const currentYear = new Date().getFullYear();

  // Helper to render the specific table structure based on 'hang'
  const renderFrontPageTables = (st: StudentPrintData) => {
    const hang = (st.hang || "").toUpperCase();
    
    // A1, A2
    if (hang === 'A1' || hang === 'A2') {
      return (
        <div className="space-y-[10px]">
          <table className="w-full border-collapse border border-black text-[15px] text-center">
            <tbody>
              <tr><td colSpan={3} className="border border-black font-bold p-1">KẾT QUẢ SÁT HẠCH LÝ THUYẾT</td></tr>
              <tr>
                <td className="border border-black p-1 w-1/3">Số điểm tối đa</td>
                <td className="border border-black p-1 w-1/3">Số điểm đạt được</td>
                <td className="border border-black p-1 w-1/3">Sát hạch viên nhận xét và ký tên</td>
              </tr>
              <tr>
                <td className="border border-black p-1 h-20 align-top">25</td>
                <td className="border border-black p-1 h-20"></td>
                <td className="border border-black p-1 h-20"></td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black p-1 text-right italic pr-12">Thí sinh ký tên:</td>
              </tr>
            </tbody>
          </table>
          <table className="w-full border-collapse border border-black text-[15px] text-center">
            <tbody>
              <tr><td colSpan={3} className="border border-black font-bold p-1">KẾT QUẢ SÁT HẠCH THỰC HÀNH LÁI XE</td></tr>
              <tr>
                <td className="border border-black p-1 w-1/3">Số điểm tối đa</td>
                <td className="border border-black p-1 w-1/3">Số điểm đạt được</td>
                <td className="border border-black p-1 w-1/3">Sát hạch viên nhận xét và ký tên</td>
              </tr>
              <tr>
                <td className="border border-black p-1 h-20 align-top">100</td>
                <td className="border border-black p-1 h-20"></td>
                <td className="border border-black p-1 h-20"></td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-black p-1 text-right italic pr-12">Thí sinh ký tên:</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // B1, B, B11, C, C1...
    const ltMaxScore = (hang === 'C' || hang === 'C1' || hang === 'D' || hang === 'E' || hang === 'F') ? '35' : '30';
    return (
      <div className="space-y-[10px]">
        <table className="w-full border-collapse border border-black text-[15px] text-center leading-tight">
          <tbody>
            <tr><td colSpan={3} className="border border-black font-bold p-1">KẾT QUẢ SÁT HẠCH LÝ THUYẾT</td></tr>
            <tr>
              <td className="border border-black p-1 w-1/3">Số điểm tối đa</td>
              <td className="border border-black p-1 w-1/3">Số điểm đạt được</td>
              <td className="border border-black p-1 w-1/3">Sát hạch viên nhận xét và ký tên</td>
            </tr>
            <tr>
              <td className="border border-black p-1 h-14 align-top">{ltMaxScore}</td>
              <td className="border border-black p-1 h-14"></td>
              <td className="border border-black p-1 h-14"></td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black p-1 text-right italic pr-12">Thí sinh ký tên:</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse border border-black text-[15px] text-center leading-tight">
          <tbody>
            <tr><td colSpan={3} className="border border-black font-bold p-1">KẾT QUẢ SÁT HẠCH THỰC HÀNH LÁI XE TRONG HÌNH</td></tr>
            <tr>
              <td className="border border-black p-1 w-1/3">Số điểm tối đa</td>
              <td className="border border-black p-1 w-1/3">Số điểm đạt được</td>
              <td className="border border-black p-1 w-1/3">Sát hạch viên nhận xét và ký tên</td>
            </tr>
            <tr>
              <td className="border border-black p-1 h-14 align-top">100</td>
              <td className="border border-black p-1 h-14"></td>
              <td className="border border-black p-1 h-14"></td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black p-1 text-right italic pr-12">Thí sinh ký tên:</td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse border border-black text-[15px] text-center leading-tight">
          <tbody>
            <tr><td colSpan={3} className="border border-black font-bold p-1">KẾT QUẢ SÁT HẠCH THỰC HÀNH LÁI XE TRÊN ĐƯỜNG</td></tr>
            <tr>
              <td className="border border-black p-1 w-1/3">Số điểm tối đa</td>
              <td className="border border-black p-1 w-1/3">Số điểm đạt được</td>
              <td className="border border-black p-1 w-1/3">Sát hạch viên nhận xét và ký tên</td>
            </tr>
            <tr>
              <td className="border border-black p-1 h-14 align-top">100</td>
              <td className="border border-black p-1 h-14"></td>
              <td className="border border-black p-1 h-14"></td>
            </tr>
            <tr>
              <td colSpan={3} className="border border-black p-1 text-right italic pr-12">Thí sinh ký tên:</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div ref={ref} className="bg-white text-black w-full" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <style type="text/css">
        {`
          @media print {
            .page-break { page-break-after: always; }
            @page { margin: 15mm; }
          }
        `}
      </style>
      {students.map((st, idx) => (
        <React.Fragment key={st.cccd}>
          {/* MẶT TRƯỚC (Trang 1) */}
          <div className="page-break w-full max-w-[210mm] mx-auto min-h-[297mm] pt-4 px-6 relative box-border">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 text-[15px] leading-tight">
              <div className="text-left font-bold" style={{ width: '40%' }}>
                <p className="uppercase">{center}</p>
                <p className="mt-1">SBD: {st.sbd}</p>
                <p className="mt-1">Xe số: ..............................</p>
              </div>
              <div className="text-center" style={{ width: '60%' }}>
                <p className="font-bold text-[16px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[16px] border-b-[1.5px] border-black inline-block pb-1 mt-1">Độc lập - Tự do - Hạnh phúc</p>
              </div>
            </div>

            {/* Tiêu đề */}
            <h1 className="text-center font-bold text-[20px] mb-6 mt-4">
              BIÊN BẢN TỔNG HỢP KẾT QUẢ SÁT HẠCH LÁI XE {st.hang?.toUpperCase().startsWith('A') ? 'MÔ TÔ' : 'Ô TÔ'}
            </h1>

            {/* Thông tin học viên */}
            <div className="flex gap-4 mb-4">
              <div className="w-[3cm] h-[4cm] border border-black flex items-center justify-center text-xs text-gray-500 relative overflow-hidden flex-shrink-0">
                <span className="z-10 bg-white/80 p-1 rounded">Ảnh 3x4</span>
              </div>
              <div className="flex-1 text-[16px] leading-[1.6]">
                <p>Họ và tên thí sinh: <strong>{st.name?.toUpperCase()}</strong></p>
                <p>Ngày tháng năm sinh: <strong>{st.dob}</strong></p>
                <p>Số định danh (hoặc Hộ chiếu): <strong>{st.cccd}</strong></p>
                <p>Hoặc Hộ chiếu số: .................................. ngày cấp ...................... nơi cấp ........................................</p>
                <p>Thi lấy giấy phép lái xe hạng: <strong>{st.hang?.toUpperCase()}</strong></p>
                
                <div className="text-right mt-1">
                  <p className="italic">Tp. Hồ Chí Minh, ngày {day || "..."} tháng {month || "..."} năm {currentYear}</p>
                  <p className="mr-8">(Thí sinh ký và ghi rõ họ tên)</p>
                  <div className="h-[2cm]"></div>
                </div>
              </div>
            </div>

            {/* Bảng điểm */}
            {renderFrontPageTables(st)}

            {/* Kết luận */}
            <div className="mt-[15px] text-[16px]">
              <h2 className="font-bold underline italic mb-2">Kết luận của Chủ tịch hội đồng</h2>
              <div className="flex justify-between items-start">
                <div className="pt-2">
                  <p className="mb-2">Hạng: <strong>{st.hang?.toUpperCase()}</strong></p>
                  <p>Đạt: .................... Không Đạt: ....................</p>
                </div>
                <div className="text-center">
                  <p className="italic mb-1">Tp. Hồ Chí Minh, ngày {day || "..."} tháng {month || "..."} năm {currentYear}</p>
                  <p className="font-bold mb-1">TM. HỘI ĐỒNG SÁT HẠCH</p>
                  <p className="font-bold mb-[2.5cm]">P. CHỦ TỊCH</p>
                  <p>(Ký tên, đóng dấu)</p>
                </div>
              </div>
            </div>
          </div>

          {/* MẶT SAU (Trang 2) */}
          <div className="page-break w-full max-w-[210mm] mx-auto min-h-[297mm] p-10 relative box-border flex flex-col">
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-bold uppercase mb-2">Thông Tin Sát Hạch Học Viên</h2>
              <p className="text-lg">STT: <strong>{st.stt}</strong> - Hạng: <strong>{st.hang?.toUpperCase()}</strong> - TT: <strong>{center}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-[16px] leading-relaxed mb-8">
              <div>
                <p>Họ tên: <strong>{st.name?.toUpperCase()}</strong></p>
                <p>SBD: <strong>{st.sbd}</strong></p>
                <p>Ngày sinh: <strong>{st.dob}</strong></p>
              </div>
              <div>
                <p>Số CCCD: <strong>{st.cccd}</strong></p>
                <p>Nội dung thi: <strong>{st.ndsh || "LT, TH"}</strong></p>
              </div>
            </div>

            {/* Bảng 2 cột: QR Code và Đóng mộc */}
            <table className="w-full border-collapse border-2 border-black h-[400px]">
              <thead>
                <tr>
                  <th className="border-2 border-black p-4 w-[60%] text-xl bg-gray-50">MÃ QR ĐỂ QUÉT</th>
                  <th className="border-2 border-black p-4 w-[40%] text-xl bg-gray-50">XÁC NHẬN ĐÓNG TIỀN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-2 border-black p-6 text-center align-top">
                    <div className="flex flex-wrap items-center justify-center gap-8">
                       {st.qr_gplx ? (
                         <div className="flex flex-col items-center">
                            <QRCodeSVG value={st.qr_gplx} size={150} level="M" />
                            <p className="font-bold mt-3 text-lg">GPLX</p>
                         </div>
                       ) : null}
                       
                       {st.qr_hinh && (st.ndsh?.toLowerCase().includes('h') || st.ndsh?.toLowerCase().includes('hình') || st.ndsh?.toLowerCase().includes('th')) ? (
                         <div className="flex flex-col items-center">
                            <QRCodeSVG value={st.qr_hinh} size={150} level="M" />
                            <p className="font-bold mt-3 text-lg">HÌNH</p>
                         </div>
                       ) : null}

                       {st.qr_duong && (st.ndsh?.toLowerCase().includes('đ') || st.ndsh?.toLowerCase().includes('đường') || st.ndsh?.toLowerCase().includes('th')) ? (
                         <div className="flex flex-col items-center">
                            <QRCodeSVG value={st.qr_duong} size={150} level="M" />
                            <p className="font-bold mt-3 text-lg">ĐƯỜNG</p>
                         </div>
                       ) : null}

                       {!st.qr_gplx && !st.qr_hinh && !st.qr_duong && (
                         <p className="text-gray-400 italic">Chưa có dữ liệu mã QR</p>
                       )}
                    </div>
                  </td>
                  <td className="border-2 border-black p-4 text-center align-middle relative">
                     <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-gray-300 font-bold text-3xl uppercase rotate-[-15deg] opacity-60">ĐÓNG MỘC</span>
                     </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
});

PrintBienBan.displayName = 'PrintBienBan';
