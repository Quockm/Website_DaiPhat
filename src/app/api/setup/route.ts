import { NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDbConnection("DP_SH_System");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='print_logs' AND xtype='U')
      CREATE TABLE print_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL, 
        entity_id VARCHAR(100) NOT NULL,  
        document_type VARCHAR(50) NOT NULL, 
        document_name NVARCHAR(255) NOT NULL,
        printed_by NVARCHAR(100),
        printed_at DATETIME DEFAULT GETDATE()
      )
    `);
    return NextResponse.json({ success: true, message: "Table created" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
