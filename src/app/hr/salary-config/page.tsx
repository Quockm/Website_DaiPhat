import { getSalaryConfigs } from "@/actions/payroll";
import SalaryConfigClient from "./SalaryConfigClient";

export default async function SalaryConfigPage() {
  const initialConfigs = await getSalaryConfigs();
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <SalaryConfigClient initialConfigs={initialConfigs} />
    </div>
  );
}
