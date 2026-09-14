"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AccountingAuthPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Đăng nhập thành công, chuyển hướng vào trang Kế Toán
        router.push("/accounting/fees");
        router.refresh();
      } else {
        setError(data.message || "Mã xác thực không hợp lệ.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Bảo mật Kế Toán</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Vui lòng nhập mã gồm 6 chữ số từ ứng dụng Google Authenticator để tiếp tục.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-1">
              Mã xác thực
            </label>
            <input
              id="token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="000000"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || token.length !== 6}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận truy cập"}
          </button>
        </form>
      </div>
    </div>
  );
}
