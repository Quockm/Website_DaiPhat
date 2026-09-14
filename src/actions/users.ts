"use server";

import { getDbConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT ID, Username, FullName, Role, IsActive, CreatedAt
      FROM App_Users
      ORDER BY CreatedAt DESC
    `);
    return result.recordset;
  } catch (err) {
    console.error("Error getUsers:", err);
    return [];
  }
}

export async function createUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as string;

  if (!username || !password || !fullName || !role) {
    return { success: false, error: "Vui lòng nhập đầy đủ thông tin!" };
  }

  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    // Kiểm tra username tồn tại
    const check = await pool.request().input('Username', username).query(`SELECT ID FROM App_Users WHERE Username = @Username`);
    if (check.recordset.length > 0) {
      return { success: false, error: "Tên đăng nhập đã tồn tại!" };
    }

    const hash = await bcrypt.hash(password, 10);
    
    await pool.request()
      .input('Username', username)
      .input('PasswordHash', hash)
      .input('FullName', fullName)
      .input('Role', role)
      .query(`
        INSERT INTO App_Users (Username, PasswordHash, FullName, Role, IsActive)
        VALUES (@Username, @PasswordHash, @FullName, @Role, 1)
      `);
      
    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error("Error createUser:", err);
    return { success: false, error: err.message };
  }
}

export async function toggleUserActive(id: number, isActive: boolean) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('ID', id)
      .input('IsActive', isActive ? 1 : 0)
      .query(`UPDATE App_Users SET IsActive = @IsActive WHERE ID = @ID`);
      
    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error("Error toggleUserActive:", err);
    return { success: false, error: err.message };
  }
}
