import { NextResponse } from "next/server";
import { generateMotoXlsxBuffer } from "@/lib/exportMoto";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.excelTemplate) {
      return NextResponse.json({ error: "Missing excelTemplate" }, { status: 400 });
    }

    const buffer = await generateMotoXlsxBuffer(data);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="SoLenLop_Moto_${data.khoa?.ma_khoa || 'export'}.xlsx"`,
      },
    });

  } catch (error: any) {
    console.error("Export Excel error:", error);
    return NextResponse.json(
      { error: "Lỗi xuất file Excel." },
      { status: 500 }
    );
  }
}
