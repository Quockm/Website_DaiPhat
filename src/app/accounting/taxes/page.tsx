import { getTaxRecords } from "@/actions/taxes";
import TaxesClient from "./TaxesClient";

export default async function TaxesPage() {
  const initialRecords = await getTaxRecords();
  
  return (
    <div className="w-full">
      <TaxesClient initialRecords={initialRecords} />
    </div>
  );
}
