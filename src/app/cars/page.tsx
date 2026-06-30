import { getCars, getCarStats } from "@/actions/cars";
import CarsClient from "./CarsClient";

export default async function CarsPage() {
  const initialData = await getCars(1, 50, "");
  const initialStats = await getCarStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý Phương tiện</h1>
        <p className="text-slate-600 mt-2 text-base font-medium">Theo dõi danh sách xe tập lái và thời hạn giấy phép.</p>
      </div>

      <CarsClient 
        initialCars={initialData.data} 
        initialTotal={initialData.totalRecords}
        initialPages={initialData.totalPages}
        initialStats={initialStats}
      />
    </div>
  );
}
