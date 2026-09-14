import { getCars } from "@/actions/cars";
import HandoverClient from "./HandoverClient";

export default async function HandoverPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const initialCars = await getCars(1, 50, resolvedParams?.q || "", "all", "all", "all", "Đại Phát", "docs");
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <HandoverClient 
        initialCars={initialCars.data}
        initialTotal={initialCars.totalRecords}
        initialPages={initialCars.totalPages}
      />
    </div>
  );
}
