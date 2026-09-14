import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import sql from "mssql";

export async function POST(req: NextRequest) {
  try {
    const { id, password } = await req.json();

    if (!id || !password) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin" }, { status: 400 });
    }

    if (password !== "88889999") {
      return NextResponse.json({ success: false, error: "Mật khẩu không chính xác!" }, { status: 401 });
    }

    const pool = await getDbConnection("DP_SH_System");
    
    // Delete the log entry
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM DP_SH_System.dbo.print_logs WHERE id = @id`);

    return NextResponse.json({ success: true, message: "Đã reset trạng thái in thành công" });
  } catch (error: any) {
    console.error("Reset print log error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
