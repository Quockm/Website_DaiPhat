import { getCarPayments } from "@/actions/car-payments";
import CarPaymentsClient from "./CarPaymentsClient";

export default async function CarPaymentsPage(props: {
  searchParams?: Promise<{ month?: string, year?: string }>;
}) {
  const searchParams = await props.searchParams;
  const date = new Date();
  const currentMonth = searchParams?.month ? parseInt(searchParams.month) : date.getMonth() + 1;
  const currentYear = searchParams?.year ? parseInt(searchParams.year) : date.getFullYear();
  
  const kyThanhToan = `${currentMonth.toString().padStart(2, '0')}/${currentYear}`;
  const initialPayments = await getCarPayments(kyThanhToan);
  
  return (
    <div className="w-full">
      <CarPaymentsClient 
        initialPayments={initialPayments} 
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
