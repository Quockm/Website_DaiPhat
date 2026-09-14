"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getConfigRates, getAvailableResources, createCourse, getCurrentCapacity } from '@/actions/courses';
import { Check, Info, Loader2, Truck, UserCircle2, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateCourseForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [rates, setRates] = useState<Record<string, number>>({});
  const [resources, setResources] = useState<{ cars: any[], teachers: any[] }>({ cars: [], teachers: [] });
  
  const [courseType, setCourseType] = useState<'OTO' | 'MOTO'>('OTO');
  
  // Step 1 data
  const [formData, setFormData] = useState({
    TenKhoa: '',
    MaKhoa: '',
    Hang: 'B SS',
    LuuLuong: 0,
    TrungTam: 'Đại Phát',
    NgayKhaiGiang: '',
    NgayBeGiang: '',
    NgayTotNghiep: '',
    NgaySatHach: '',
    TongNgay: '',
    LtBD: '', LtKT: '',
    ShBD: '', ShKT: '',
    CbBD: '', CbKT: '',
    DatBD: '', DatKT: '',
    GhiChu: ''
  });
  
  // Step 2 & 3 data
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  
  const [currentCapacity, setCurrentCapacity] = useState(0);
  
  // Max capacity logic based on user formula
  const maxCapacity = useMemo(() => {
    if (formData.Hang === 'A1') return 200;
    if (formData.Hang === 'A') return 300;
    return 1000; // Default for Oto
  }, [formData.Hang]);
  
  useEffect(() => {
    getConfigRates().then(setRates);
  }, []);

  useEffect(() => {
    getCurrentCapacity(formData.TrungTam, formData.Hang).then(setCurrentCapacity);
  }, [formData.TrungTam, formData.Hang]);

  const requiredCount = useMemo(() => {
    if (formData.LuuLuong <= 0) return 0;
    // Map HangKhoa to rates
    let rate = rates[formData.Hang] || 5; 
    return Math.ceil(formData.LuuLuong / rate);
  }, [formData.LuuLuong, formData.Hang, rates]);

  const isMoto = formData.Hang === 'A1' || formData.Hang === 'A';

  const loadResources = async () => {
    setLoading(true);
    const res = await getAvailableResources(formData.Hang, formData.NgayKhaiGiang, formData.NgayBeGiang, formData.TrungTam);
    setResources(res);
    setLoading(false);
  };

  const handleNextStep1 = async () => {
    if (!formData.TenKhoa || !formData.MaKhoa || formData.LuuLuong <= 0) {
      alert("Vui lòng điền đủ Tên Khóa, Mã Khóa và Lưu lượng > 0.");
      return;
    }
    await loadResources();
    setStep(isMoto ? 3 : 2);
  };

  const handleNextStep2 = () => {
    if (selectedCars.length < requiredCount) {
      alert(`Bạn cần chọn ít nhất ${requiredCount} xe (đã chọn ${selectedCars.length}).`);
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (selectedTeachers.length < requiredCount) {
      alert(`Bạn cần chọn ít nhất ${requiredCount} giáo viên (đã chọn ${selectedTeachers.length}).`);
      return;
    }
    setLoading(true);
    const res = await createCourse({
      ...formData,
      cars: selectedCars,
      teachers: selectedTeachers
    });
    setLoading(false);
    if (res.success) {
      alert("Khởi tạo khóa học thành công! Chuyển sang bộ phận Tuyển sinh để nhập hồ sơ.");
      if (res.hang === 'A1' || res.hang === 'A') {
        router.push('/admissions/moto');
      } else {
        router.push('/admissions/oto');
      }
    } else {
      alert("Lỗi: " + res.error);
    }
  };

  const toggleCar = (bienSo: string) => {
    setSelectedCars(prev => 
      prev.includes(bienSo) ? prev.filter(c => c !== bienSo) : [...prev, bienSo]
    );
  };

  const toggleTeacher = (id: number) => {
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Group cars by ChuXe to show quota
  const chuXeQuota = useMemo(() => {
    const quota: Record<string, number> = {};
    const rate = rates[formData.Hang] || 5;
    selectedCars.forEach(bienSo => {
      const car = resources.cars.find(c => c.BienSo === bienSo);
      if (car && car.ChuXe) {
        quota[car.ChuXe] = (quota[car.ChuXe] || 0) + rate;
      }
    });
    return quota;
  }, [selectedCars, resources.cars, formData.Hang, rates]);

  return (
    <Card className="w-full shadow-xl border-slate-200">
      <CardHeader className="bg-indigo-600 text-white rounded-t-xl">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            {step === 1 && "Bước 1: Thông tin Khóa Đào tạo"}
            {step === 2 && "Bước 2: Phân bổ Phương tiện (Xe)"}
            {step === 3 && "Bước 3: Phân bổ Giáo viên"}
          </CardTitle>
          
          {step === 1 && (
            <div className="flex items-center gap-2 bg-indigo-700/50 p-2 rounded-lg">
              <span className="text-sm font-medium">Trung tâm:</span>
              <select
                value={formData.TrungTam}
                onChange={e => setFormData({...formData, TrungTam: e.target.value})}
                className="w-[180px] h-8 px-2 bg-white text-slate-900 font-semibold text-center border-none rounded outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="Đại Phát" className="text-slate-900">Đại Phát</option>
                <option value="Tiến Thành" className="text-slate-900">Tiến Thành</option>
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            {/* Toggle Chế độ */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-md mx-auto mb-2 border border-slate-200">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${courseType === 'OTO' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => {
                  setCourseType('OTO');
                  if (formData.Hang === 'A' || formData.Hang === 'A1') {
                    setFormData(prev => ({...prev, Hang: 'B-SS'}));
                  }
                }}
              >
                Khóa Ô tô
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${courseType === 'MOTO' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => {
                  setCourseType('MOTO');
                  if (formData.Hang !== 'A' && formData.Hang !== 'A1') {
                    setFormData(prev => ({...prev, Hang: 'A1'}));
                  }
                }}
              >
                Khóa Mô tô (A1, A)
              </button>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    Lưu lượng tối đa ({courseType === 'OTO' ? 'Ô tô' : `Mô tô Hạng ${formData.Hang}`})
                  </div>
                  <div className="text-xl font-bold text-indigo-900">
                    {currentCapacity} <span className="text-sm font-normal text-slate-500">/ {maxCapacity} học viên / khóa</span>
                  </div>
                  {courseType === 'MOTO' && (
                    <div className="text-xs text-indigo-600 font-medium mt-1">
                      {formData.Hang === 'A1' 
                        ? "Sân Chi: 1 sân, 20 xe (Tối đa 400hv, khai giảng thực tế 200hv)" 
                        : "Sân Đành (2 sân) + Sân Chi (1 sân), 49 xe (Tối đa 326hv, khai giảng thực tế 300hv)"}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-1/3">
                <div className="flex justify-between text-xs mb-1 font-medium text-indigo-700">
                  <span>Tiến độ</span>
                  <span>{Math.round((currentCapacity / maxCapacity) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, (currentCapacity / maxCapacity) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Mã Khóa <span className="text-red-500">*</span></Label>
                <Input value={formData.MaKhoa} onChange={e => setFormData({...formData, MaKhoa: e.target.value})} placeholder="VD: 79106K26B0106" />
              </div>
              <div className="space-y-2">
                <Label>Tên Khóa <span className="text-red-500">*</span></Label>
                <Input value={formData.TenKhoa} onChange={e => setFormData({...formData, TenKhoa: e.target.value})} placeholder="VD: B01_K06" />
              </div>
              <div className="space-y-2">
                <Label>Hạng</Label>
                <Select value={formData.Hang} onValueChange={v => setFormData({...formData, Hang: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {courseType === 'OTO' ? (
                      <>
                        <SelectItem value="B-SS">B-SS</SelectItem>
                        <SelectItem value="B-TD">B-TD</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D2">D2</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Lưu lượng (Số HV) <span className="text-red-500">*</span></Label>
                <Input type="number" value={formData.LuuLuong || ''} onChange={e => setFormData({...formData, LuuLuong: parseInt(e.target.value) || 0})} />
                <p className="text-sm text-slate-500 font-medium mt-1">Yêu cầu chọn: <strong className="text-indigo-600">{isMoto ? `${requiredCount} GV` : `${requiredCount} Xe & ${requiredCount} GV`}</strong></p>
              </div>
              <div className="space-y-2">
                <Label>Ngày Khai giảng</Label>
                <Input type="date" value={formData.NgayKhaiGiang} onChange={e => setFormData({...formData, NgayKhaiGiang: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Ngày Bế giảng</Label>
                <Input type="date" value={formData.NgayBeGiang} onChange={e => setFormData({...formData, NgayBeGiang: e.target.value})} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-700 mb-4">Lịch trình chi tiết (Tuỳ chọn)</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Lý thuyết Bắt đầu</Label><Input type="date" value={formData.LtBD} onChange={e=>setFormData({...formData, LtBD:e.target.value})} /></div>
                <div className="space-y-2"><Label>Lý thuyết Kết thúc</Label><Input type="date" value={formData.LtKT} onChange={e=>setFormData({...formData, LtKT:e.target.value})} /></div>
                <div className="space-y-2"><Label>Sa hình Bắt đầu</Label><Input type="date" value={formData.ShBD} onChange={e=>setFormData({...formData, ShBD:e.target.value})} /></div>
                <div className="space-y-2"><Label>Sa hình Kết thúc</Label><Input type="date" value={formData.ShKT} onChange={e=>setFormData({...formData, ShKT:e.target.value})} /></div>
                {!isMoto && (
                  <>
                    <div className="space-y-2"><Label>Cabin Bắt đầu</Label><Input type="date" value={formData.CbBD} onChange={e=>setFormData({...formData, CbBD:e.target.value})} /></div>
                    <div className="space-y-2"><Label>Cabin Kết thúc</Label><Input type="date" value={formData.CbKT} onChange={e=>setFormData({...formData, CbKT:e.target.value})} /></div>
                    <div className="space-y-2"><Label>DAT Bắt đầu</Label><Input type="date" value={formData.DatBD} onChange={e=>setFormData({...formData, DatBD:e.target.value})} /></div>
                    <div className="space-y-2"><Label>DAT Kết thúc</Label><Input type="date" value={formData.DatKT} onChange={e=>setFormData({...formData, DatKT:e.target.value})} /></div>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label>Ngày Tốt nghiệp dự kiến</Label>
                <Input type="date" value={formData.NgayTotNghiep} onChange={e => setFormData({...formData, NgayTotNghiep: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Ngày Sát hạch dự kiến</Label>
                <Input type="date" value={formData.NgaySatHach} onChange={e => setFormData({...formData, NgaySatHach: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Alert className="bg-indigo-50 border-indigo-200">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-800">
                Lưu lượng khóa: <strong>{formData.LuuLuong}</strong>. Cần chọn ít nhất <strong>{requiredCount}</strong> xe.
                Bạn đã chọn: <strong>{selectedCars.length}</strong>/{requiredCount}.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-6">
              <div className="flex-1 max-h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  {resources.cars
                    // B-SS and C1 must match. B-TD is flexible.
                    .sort((a, b) => {
                      if (!a.ActiveCourseName && b.ActiveCourseName) return -1;
                      if (a.ActiveCourseName && !b.ActiveCourseName) return 1;
                      return 0;
                    })
                    .map(car => {
                    const isSelected = selectedCars.includes(car.BienSo);
                    const isBusy = !!car.ActiveCourseName;
                    const canSelect = car.isCompatible;
                    
                    return (
                      <div 
                        key={car.BienSo}
                        onClick={() => canSelect && toggleCar(car.BienSo)}
                        className={`p-4 border rounded-xl flex items-start gap-3 transition-all ${
                          !canSelect ? 'bg-slate-50 opacity-50 cursor-not-allowed' :
                          isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 
                          'hover:border-slate-400 cursor-pointer'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            {car.BienSo} 
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full font-medium text-slate-700">{car.HangXe}</span>
                          </div>
                          <div className="text-sm text-slate-600 mt-1">Chủ xe: {car.ChuXe || 'Không rõ'}</div>
                          <div className="text-xs text-slate-500 mt-1">Hạn phí DAT: <strong className="text-slate-700">{car.HanPhiDAT || '-'}</strong> | Hạn GPXTL: <strong className="text-slate-700">{car.HanGPTL || '-'}</strong></div>
                          {isBusy && <div className="text-xs font-semibold text-rose-500 mt-1">Đang bận: {car.ActiveCourseName}</div>}
                          {!canSelect && <div className="text-xs text-slate-500 italic mt-1">Không phù hợp với hạng {formData.Hang}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Sidebar Quota */}
              <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 self-start">
                <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-3">Chỉ tiêu Tuyển sinh</h4>
                {Object.keys(chuXeQuota).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Chưa chọn xe nào.</p>
                ) : (
                  <ul className="space-y-3">
                    {Object.entries(chuXeQuota).map(([chu, maxHv]) => (
                      <li key={chu} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700">{chu}</span>
                        <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                          {maxHv} HS
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Alert className="bg-indigo-50 border-indigo-200">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-800">
                Lưu lượng khóa: <strong>{formData.LuuLuong}</strong>. Cần chọn ít nhất <strong>{requiredCount}</strong> giáo viên.
                Bạn đã chọn: <strong>{selectedTeachers.length}</strong>/{requiredCount}.
              </AlertDescription>
            </Alert>
            
            <div className="max-h-[500px] overflow-y-auto pr-2">
              <div className="grid grid-cols-3 gap-3">
                {resources.teachers
                  .filter(gv => !isMoto || gv.HangGPLX === 'A' || gv.HangGPLX === 'A1')
                  .sort((a, b) => {
                    if (!a.ActiveCourseName && b.ActiveCourseName) return -1;
                    if (a.ActiveCourseName && !b.ActiveCourseName) return 1;
                    return 0;
                  })
                  .map(gv => {
                  const isSelected = selectedTeachers.includes(gv.Id);
                  const isBusy = !!gv.ActiveCourseName;
                  
                  return (
                    <div 
                      key={gv.Id}
                      onClick={() => toggleTeacher(gv.Id)}
                      className={`p-4 border rounded-xl flex items-start gap-3 transition-all hover:border-slate-400 cursor-pointer ${
                        isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : ''
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold flex items-center gap-2">
                          <UserCircle2 className="w-4 h-4 text-slate-500" />
                          {gv.HoTen} 
                        </div>
                        <div className="text-xs mt-1 text-slate-600">GPLX: <span className="font-semibold text-slate-800">{gv.HangGPLX || '?'}</span> | Hạn GPLX: <span className="font-semibold text-slate-800">{gv.HanGPLX || '-'}</span></div>
                        {isBusy && <div className="text-xs font-semibold text-rose-500 mt-1">Đang bận: {gv.ActiveCourseName}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 rounded-b-xl flex justify-between">
        <Button variant="outline" onClick={() => {
          if (step === 3 && isMoto) setStep(1);
          else if (step > 1) setStep(step - 1);
          else router.back();
        }}>
          {step === 1 ? "Hủy" : "Quay lại"}
        </Button>
        
        {step === 1 && (
          <Button onClick={handleNextStep1} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isMoto ? "Tiếp tục (Chọn GV)" : "Tiếp tục (Chọn Xe)"}
          </Button>
        )}
        
        {step === 2 && (
          <Button onClick={handleNextStep2} className="bg-indigo-600 hover:bg-indigo-700">
            Tiếp tục (Chọn GV)
          </Button>
        )}

        {step === 3 && (
          <Button onClick={handleSubmit} disabled={loading || selectedTeachers.length < requiredCount} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Mở Khóa
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
