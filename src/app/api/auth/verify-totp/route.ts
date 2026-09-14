import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'otplib';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã.' }, { status: 400 });
    }

    const secret = process.env.ACCOUNTING_TOTP_SECRET;
    
    if (!secret) {
      console.error('ACCOUNTING_TOTP_SECRET is not configured in .env');
      return NextResponse.json({ success: false, message: 'Hệ thống chưa được cấu hình khóa bí mật.' }, { status: 500 });
    }

    // Xác minh mã TOTP (lưu ý hàm verify trả về một Promise trong bản otplib mới)
    const isValid = await verify({ token, secret });

    if (isValid) {
      const response = NextResponse.json({ success: true, message: 'Xác thực thành công.' });
      
      // Đặt HTTP-only cookie, có thời hạn 12 tiếng
      response.cookies.set({
        name: 'accounting_session',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 12, // 12 giờ
      });
      
      return response;
    } else {
      return NextResponse.json({ success: false, message: 'Mã xác thực không chính xác.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Lỗi khi xác thực TOTP:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi hệ thống.' }, { status: 500 });
  }
}
