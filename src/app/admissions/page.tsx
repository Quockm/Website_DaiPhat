import { getAdmissionsData } from "@/actions/admissions";
import AdmissionsClient from "./AdmissionsClient";

export const metadata = {
  title: "Tuyển sinh - EduManage",
  description: "Quản lý tuyển sinh và nhập thông tin học viên",
};

export default async function AdmissionsPage() {
  const data = await getAdmissionsData();
  
  return (
    <div className="p-6">
      <AdmissionsClient initialData={data} />
    </div>
  );
}
