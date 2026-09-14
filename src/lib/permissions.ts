export const ROLES = ['Admin', 'Kế toán', 'Đào tạo', 'Tuyển Sinh', 'Lưu trữ', 'Tư vấn'];

export const ROLE_MATRIX = [
  { id: 'nguon_luc', name: 'Nguồn lực', roles: ['Admin', 'Đào tạo'] },
  { id: 'tuyen_sinh', name: 'Tuyển sinh', roles: ['Admin', 'Kế toán', 'Đào tạo', 'Tuyển Sinh', 'Lưu trữ', 'Tư vấn'] },
  { id: 'ke_toan', name: 'Kế toán', roles: ['Admin', 'Kế toán'] },
  { id: 'dao_tao', name: 'Đào tạo', roles: ['Admin', 'Đào tạo'] },
  { id: 'zalo_oa', name: 'Zalo OA', roles: ['Admin', 'Kế toán', 'Đào tạo', 'Tuyển Sinh', 'Tư vấn'] },
  { id: 'so_sach', name: 'Sổ sách', roles: ['Admin', 'Kế toán', 'Đào tạo', 'Lưu trữ'] },
  { id: 'vang_rot', name: 'Vắng Rớt', roles: ['Admin', 'Đào tạo', 'Lưu trữ'] },
  { id: 'tot_nghiep', name: 'Tốt nghiệp', roles: ['Admin', 'Đào tạo'] },
  { id: 'sat_hach', name: 'Sát hạch', roles: ['Admin', 'Đào tạo'] },
  { id: 'quan_ly_ky_thi', name: 'Quản lý kỳ thi', roles: ['Admin', 'Đào tạo'] },
  { id: 'nhan_su', name: 'Nhân sự', roles: ['Admin'] },
  { id: 'cau_hinh', name: 'Cấu hình', roles: ['Admin'] },
];

export function hasPermission(role: string, functionId: string) {
  if (role === 'Admin') return true;
  const func = ROLE_MATRIX.find(f => f.name === functionId || f.id === functionId);
  if (!func) return true; // Default allow (e.g. Tổng quan, Lịch biểu)
  return func.roles.includes(role);
}
