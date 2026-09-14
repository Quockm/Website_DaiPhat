"use server";

import { getDbConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { login, SessionPayload } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' };
  }

  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('Username', username)
      .query(`SELECT * FROM App_Users WHERE Username = @Username AND IsActive = 1`);

    const user = result.recordset[0];
    if (!user) {
      return { success: false, error: 'Tên đăng nhập không tồn tại hoặc tài khoản bị khóa!' };
    }

    const isValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isValid) {
      return { success: false, error: 'Mật khẩu không chính xác!' };
    }

    const sessionPayload: SessionPayload = {
      id: user.ID,
      username: user.Username,
      fullName: user.FullName,
      role: user.Role,
    };

    await login(sessionPayload);
    return { success: true };
  } catch (err: any) {
    console.error("Login error:", err);
    return { success: false, error: 'Lỗi hệ thống: ' + err.message };
  }
}
