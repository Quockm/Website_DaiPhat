const WORKER_SECRET = process.env.WORKER_SECRET || '';
const API_URL = 'http://localhost:3000/api/zalo/process-queue';

console.log('=============================================');
console.log('🚀 Zalo ZNS Worker started!');
console.log('⏳ Polling Zalo message queue every 1 minute...');
console.log('=============================================');

// Hàm chạy kiểm tra và gửi tin nhắn
async function processZaloQueue() {
  try {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'x-worker-secret': WORKER_SECRET
      }
    });
    
    const data = await res.json();
    
    if (data.processed > 0) {
      console.log(`[${new Date().toLocaleString()}] ✅ Zalo Worker: Đã xử lý ${data.processed} tin nhắn (Thành công: ${data.sent || 0}, Thất bại: ${data.failed || 0}).`);
      
      if (data.errors && data.errors.length > 0) {
        console.error('Chi tiết lỗi:', data.errors);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] ❌ Zalo Worker Error: Không thể kết nối tới Next.js API. Vui lòng đảm bảo web đang chạy ở port 3000. Chi tiết: ${error.message}`);
  }
}

// Chạy ngay lần đầu tiên
processZaloQueue();

// Sau đó lặp lại mỗi 60 giây (60000ms)
setInterval(processZaloQueue, 60000);
