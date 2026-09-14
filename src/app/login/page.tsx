"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Shield, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import logoImage from "../../../public/logodp.png";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);

    if (res.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error || "Đã xảy ra lỗi không xác định.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden">
            <Image src={logoImage} alt="Logo Đại Phát" className="w-full h-full object-contain p-1" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Đăng nhập hệ thống
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Đại Phát - Quản trị Đào tạo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700">
                Tên đăng nhập
              </label>
              <div className="mt-2">
                <input
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">
                Mật khẩu
              </label>
              <div className="mt-2">
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Đăng nhập <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
