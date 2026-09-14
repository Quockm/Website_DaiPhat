import { NextResponse } from "next/server";
import { generateMotoDocxBuffer } from "@/lib/exportMoto";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.template) {
      return NextResponse.json({ error: "Missing template" }, { status: 400 });
    }

    const buffer = await generateMotoDocxBuffer(data);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${data.template.replace('.docx', '')}_${data.khoa?.ma_khoa || 'export'}.docx"`,
      },
    });

  } catch (error: any) {
    console.error("Export Word error:", error);
    return NextResponse.json(
      { error: "Lỗi xuất file Word." },
      { status: 500 }
    );
  }
}
