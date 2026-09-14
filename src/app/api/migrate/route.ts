import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Check and add columns one by one
    const columnsToAdd = [
      { name: 'DT_LT_PhapLuat', type: 'NVARCHAR(MAX)' },
      { name: 'DT_LT_KyThuat', type: 'NVARCHAR(MAX)' },
      { name: 'DT_LT_DaoDuc', type: 'NVARCHAR(MAX)' },
      { name: 'DT_LT_CauTao', type: 'NVARCHAR(MAX)' },
      { name: 'DT_LT_MoPhong', type: 'NVARCHAR(MAX)' },
      { name: 'NgayThiDat_TN', type: 'NVARCHAR(50)' },
      { name: 'NgayThiDat_SH', type: 'NVARCHAR(50)' },
      { name: 'SoHieu_GPLX', type: 'NVARCHAR(50)' },
      { name: 'SoVaoSo_GPLX', type: 'NVARCHAR(50)' },
      { name: 'SoQDCap_GPLX', type: 'NVARCHAR(50)' },
      { name: 'SoHopDong_Oto', type: 'NVARCHAR(50)' },
      { name: 'NgayKyHD_Oto', type: 'NVARCHAR(50)' },
      { name: 'SoTLHD_Oto', type: 'NVARCHAR(50)' },
      { name: 'NgayKyTLHD_Oto', type: 'NVARCHAR(50)' }
    ];

    let results: string[] = [];
    for (const col of columnsToAdd) {
      try {
        await pool.request().query(`ALTER TABLE App_HocVien_V2 ADD ${col.name} ${col.type}`);
        results.push(`Added column ${col.name}`);
      } catch (err: any) {
        if (err.message.includes('already exists') || err.message.includes('Column names in each table must be unique')) {
          results.push(`Column ${col.name} already exists. Skipping.`);
        } else {
          results.push(`Error adding ${col.name}: ${err.message}`);
        }
      }
    }
    
    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
