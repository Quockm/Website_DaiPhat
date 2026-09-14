"use server";

import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getAvailableResources, getCourseDetails } from './courses';

export async function updateCourseAllocations(courseId: string, carIds: string[], teacherIds: string[]) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Xóa phân công cũ
      const delReq = new sql.Request(transaction);
      delReq.input('MaKhoa', sql.NVarChar, courseId);
      await delReq.query(`
        DELETE FROM App_PhanCong_Xe WHERE MaKhoa = @MaKhoa;
        DELETE FROM App_PhanCong_GV WHERE MaKhoa = @MaKhoa;
      `);

      // 2. Insert lại App_PhanCong_Xe
      for (const car of carIds) {
        const carReq = new sql.Request(transaction);
        carReq.input('MaKhoa', sql.NVarChar, courseId);
        carReq.input('BienSoXe', sql.NVarChar, car);
        await carReq.query(`INSERT INTO App_PhanCong_Xe (MaKhoa, BienSoXe) VALUES (@MaKhoa, @BienSoXe)`);
      }

      // 3. Insert lại App_PhanCong_GV
      for (const gv of teacherIds) {
        const gvReq = new sql.Request(transaction);
        gvReq.input('MaKhoa', sql.NVarChar, courseId);
        gvReq.input('MaGV', sql.NVarChar, gv);
        await gvReq.query(`INSERT INTO App_PhanCong_GV (MaKhoa, MaGV) VALUES (@MaKhoa, @MaGV)`);
      }

      await transaction.commit();
      // pool.close(); // Managed by db.ts
      
      // Revalidate
      revalidatePath('/allocations');
      revalidatePath('/courses');
      revalidatePath(`/courses/${encodeURIComponent(courseId)}`);
      
      return { success: true };
    } catch (err) {
      await transaction.rollback();
      // pool.close(); // Managed by db.ts
      throw err;
    }
  } catch (err: any) {
    console.error("Error updating allocations:", err);
    return { success: false, error: err.message };
  }
}

export async function getAllocationsData(courseId: string, hangKhoa: string, trungTam: string) {
  try {
    const details = await getCourseDetails(courseId);
    const available = await getAvailableResources(hangKhoa, undefined, undefined, trungTam);
    
    return {
      success: true,
      assignedTeachers: details?.teachers || [],
      assignedCars: details?.cars || [],
      availableTeachers: available.teachers || [],
      availableCars: available.cars || []
    };
  } catch (err: any) {
    console.error("Error fetching allocations data:", err);
    return { success: false, error: err.message };
  }
}

