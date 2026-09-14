import PayrollClient from "./PayrollClient";
import { getStaffs } from "@/actions/hr";
import { getDbConnection } from '@/lib/db';

export const metadata = {
  title: "Bảng Công & Bảng Lương - Đại Phát",
};

export default async function PayrollPage(props: {
  searchParams?: Promise<{ month?: string, year?: string, search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const currentDate = new Date();
  const month = searchParams?.month ? parseInt(searchParams.month) : (currentDate.getMonth() + 1);
  const year = searchParams?.year ? parseInt(searchParams.year) : currentDate.getFullYear();
  const search = searchParams?.search || "";
  
  const kyChamCong = `${month.toString().padStart(2, '0')}/${year}`;

  const staffsData = await getStaffs(1, 1000, search, "all");
  
  // Also get attendance data for the month
  const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
  const attRes = await pool.request().query(`SELECT * FROM dp_system.dbo.App_ChamCong WHERE KyChamCong = '${kyChamCong}'`);
  const payrollRes = await pool.request().query(`SELECT * FROM dp_system.dbo.App_BangLuong WHERE KyLuong = '${kyChamCong}'`);
  
  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">BẢNG CHẤM CÔNG & LƯƠNG</h1>
          <p className="text-slate-500 font-medium mt-1">
            Quản lý ngày công, phụ cấp, bảo hiểm và tính lương tự động cho nhân sự.
          </p>
        </div>
      </div>

      <PayrollClient 
        staffs={staffsData.data} 
        initialMonth={month} 
        initialYear={year} 
        initialAttendance={attRes.recordset}
        initialPayroll={payrollRes.recordset}
      />
    </div>
  );
}
