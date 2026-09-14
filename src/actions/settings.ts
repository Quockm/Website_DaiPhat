"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getFeeNorms() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT Hang, ISNULL(HocPhi, 0) as HocPhi
      FROM App_CauHinh_Khoa
      ORDER BY Hang
    `);
    // pool.close(); // Managed by db.ts
    
    const norms: Record<string, number> = {};
    for (const r of result.recordset) {
      norms[r.Hang] = parseInt(r.HocPhi) || 0;
    }
    return norms;
  } catch (err) {
    console.error("Error getFeeNorms:", err);
    return {};
  }
}

export async function updateFeeNorms(norms: Record<string, number>) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    for (const [hang, fee] of Object.entries(norms)) {
      await pool.request()
        .input('Hang', sql.NVarChar, hang)
        .input('HocPhi', sql.BigInt, fee)
        .query(`UPDATE App_CauHinh_Khoa SET HocPhi = @HocPhi WHERE Hang = @Hang`);
    }
    // pool.close(); // Managed by db.ts
    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error("Error updateFeeNorms:", err);
    return { success: false, error: err.message };
  }
}
