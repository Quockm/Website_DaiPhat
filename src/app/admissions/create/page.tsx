import CreateCourseForm from '@/components/courses/CreateCourseForm';

export default function CreateCoursePage() {
  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      <div className="w-full mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tạo Khóa Đào Tạo Mới</h1>
        <p className="text-slate-500 mt-2">Thiết lập thông tin khóa học và phân bổ Phương tiện, Giáo viên.</p>
      </div>
      
      <CreateCourseForm />
    </div>
  );
}
