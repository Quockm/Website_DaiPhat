import { getInternalPayments } from "@/actions/internal-payments";
import InternalPaymentsClient from "./InternalPaymentsClient";

export default async function InternalPaymentsPage() {
  const initialPayments = await getInternalPayments();
  
  return (
    <div className="w-full">
      <InternalPaymentsClient initialPayments={initialPayments} />
    </div>
  );
}
