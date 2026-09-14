import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const pool = await getDbConnection("DP_SH_System");
    
    // We fetch logs, optionally joining with App_HocVien_V2 to get student names if entity_type='STUDENT'
    const result = await pool.request().query(`
      SELECT 
        l.id, l.entity_type, l.entity_id, l.document_type, l.document_name, 
        l.printed_by, l.printed_at,
        ISNULL(s.HoTen, l.entity_id) as entity_name
      FROM DP_SH_System.dbo.print_logs l
      LEFT JOIN dp_system.dbo.App_HocVien_V2 s ON l.entity_type = 'STUDENT' AND l.entity_id = s.CCCD
      ORDER BY l.printed_at DESC
    `);

    return NextResponse.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Fetch print logs error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
