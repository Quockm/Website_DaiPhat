import { getDats } from "@/actions/cars";
import DatClient from "./DatClient";

export default async function DatPage({ searchParams }: { searchParams: Promise<any> }) {
  const resolvedParams = await searchParams;
  const initialDats = await getDats(1, 50, resolvedParams?.q || "");
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <DatClient 
        initialDats={initialDats.data}
        initialTotal={initialDats.totalRecords}
        initialPages={initialDats.totalPages}
      />
    </div>
  );
}
