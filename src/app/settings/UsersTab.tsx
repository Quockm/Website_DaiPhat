"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, UserCircle, CheckCircle2, XCircle } from "lucide-react";
import { getUsers, createUser, toggleUserActive } from "@/actions/users";

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const res = await createUser(formData);
    
    if (res.success) {
      setShowModal(false);
      fetchUsers();
    } else {
      setError(res.error || "Đã xảy ra lỗi");
    }
    setSaving(false);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    await toggleUserActive(id, !currentStatus);
    fetchUsers();
  };

  return (
    <>
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-800">Quản lý Tài khoản</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-1">
              Thêm mới và phân quyền cho các tài khoản con trên hệ thống.
            </CardDescription>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo Tài khoản
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Họ và Tên</th>
                    <th className="px-6 py-4 font-bold">Tên đăng nhập</th>
                    <th className="px-6 py-4 font-bold">Quyền</th>
                    <th className="px-6 py-4 font-bold">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.ID} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-3">
                        <UserCircle className="w-8 h-8 text-slate-300" />
                        {u.FullName}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.Username}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                          {u.Role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.IsActive ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="w-4 h-4" /> Đang hoạt động
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-600 font-semibold text-xs">
                            <XCircle className="w-4 h-4" /> Bị khóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleToggle(u.ID, u.IsActive)}
                          className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                            u.IsActive 
                              ? "bg-rose-50 text-rose-600 hover:bg-rose-100" 
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {u.IsActive ? "Khóa" : "Mở khóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Tạo Tài khoản mới</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-sm font-semibold border border-rose-100 text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Họ và Tên</label>
                <input name="fullName" required className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên đăng nhập</label>
                <input name="username" required className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="ketoan_01" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input name="password" type="password" required className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phân quyền</label>
                <select name="role" className="w-full px-4 py-2 border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="Admin">Admin</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Đào tạo">Đào tạo</option>
                  <option value="Tuyển Sinh">Tuyển Sinh</option>
                  <option value="Lưu trữ">Lưu trữ</option>
                  <option value="Tư vấn">Tư vấn</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors flex justify-center items-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Lưu Tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
