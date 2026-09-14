"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Car, 
  FileText, 
  Search,
  Banknote,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Zap,
  X,
  ArrowRightLeft,
  Trash2
} from "lucide-react";
import { getVehicleSchedule, payVehicleSchedule, addVehicleSchedule, getAllPendingSchedules, getAllPaidSchedules, autoGenerateSchedule, addContract, updateContract, updateVehicleContract, deleteVehicle } from "@/actions/debts";
import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Contract = {
  id: number;
  contractNo: string;
  loanDate: string | null;
  loanAmount: number | null;
  numVehicles: number | null;
  completionDate: string | null;
  interestRate: string | null;
  note: string;
};

type Vehicle = {
  id: number;
  ownerName: string;
  licensePlate: string;
  contractNo: string;
  loanAmount: number | null;
  term: string;
  startDate: string | null;
  endDate: string | null;
  interestRate: string | null;
  note: string;
};

type Schedule = {
  id: number;
  vehicleId: number;
  paymentDate: string | null;
  totalAmount: number;
  status: string;
  licensePlate: string;
  ownerName: string;
  contractNo: string;
  actualPaidDate?: string | null;
  actualPaidAmount?: number;
};

export default function DebtManagerClient({ 
  initialContracts, 
  initialVehicles, 
  stats,
  initialPendingSchedules,
  initialPaidSchedules
}: { 
  initialContracts: Contract[], 
  initialVehicles: Vehicle[],
  stats: any,
  initialPendingSchedules: Schedule[],
  initialPaidSchedules: Schedule[]
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'vehicles' | 'contracts' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pending schedules state
  const [pendingSchedules, setPendingSchedules] = useState<Schedule[]>(initialPendingSchedules || []);
  const [paidSchedules, setPaidSchedules] = useState<Schedule[]>(initialPaidSchedules || []);

  const [contractsList, setContractsList] = useState<Contract[]>(initialContracts || []);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleSchedules, setVehicleSchedules] = useState<any[]>([]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [payingScheduleId, setPayingScheduleId] = useState<number | null>(null);
  
  // Auto Generate Form State
  const [autoStartDate, setAutoStartDate] = useState("");
  const [autoDuration, setAutoDuration] = useState("60");
  const [autoLoanAmount, setAutoLoanAmount] = useState("");
  const [autoInterestRate, setAutoInterestRate] = useState("7.9");
  const [autoMethod, setAutoMethod] = useState<'DECLINING'|'FLAT'>("DECLINING");

  // Schedule Form State
  const [schDate, setSchDate] = useState("");
  const [schInterestRate, setSchInterestRate] = useState("");
  const [schPrincipal, setSchPrincipal] = useState("");
  const [schInterest, setSchInterest] = useState("");
  const [schRemaining, setSchRemaining] = useState("");

  // Pay Form State
  const [actualPayDate, setActualPayDate] = useState("");
  const [actualPayAmount, setActualPayAmount] = useState("");

  // Add/Edit Contract Form State
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractId, setEditingContractId] = useState<number | null>(null);
  const [newContractNo, setNewContractNo] = useState("");
  const [newLoanDate, setNewLoanDate] = useState("");
  const [newLoanAmount, setNewLoanAmount] = useState("");
  const [newNumVehicles, setNewNumVehicles] = useState("");
  const [newCompletionDate, setNewCompletionDate] = useState("");
  const [newInterestRate, setNewInterestRate] = useState("");

  // Transfer Vehicle Form State
  const [transferVehicleId, setTransferVehicleId] = useState<number | null>(null);
  const [transferTargetContract, setTransferTargetContract] = useState("");

  const formatCurrency = (val: any) => {
    if (val == null) return "0";
    const num = Number(val);
    if (isNaN(num)) return "0";
    return num.toLocaleString('en-US');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setter("");
      return;
    }
    const formattedValue = parseInt(rawValue, 10).toLocaleString('en-US');
    setter(formattedValue);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  const handleExpandVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsAddingSchedule(false);
    setIsAutoGenerating(false);
    setPayingScheduleId(null);
    
    // Pre-fill auto generate form
    if (vehicle.startDate) {
      setAutoStartDate(vehicle.startDate.split('T')[0]);
    }
    if (vehicle.loanAmount) {
      setAutoLoanAmount(vehicle.loanAmount.toLocaleString('en-US'));
    } else {
      setAutoLoanAmount("");
    }
    if (vehicle.interestRate) {
      const parsedRate = parseFloat(vehicle.interestRate.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedRate)) setAutoInterestRate(parsedRate.toString());
    }
    if (vehicle.term) {
      const parsedTerm = parseInt(vehicle.term.replace(/\D/g, ''));
      if (!isNaN(parsedTerm)) setAutoDuration(parsedTerm.toString());
    }

    const schedules = await getVehicleSchedule(vehicle.id);
    setVehicleSchedules(schedules);
  };

  const handleAddSchedule = async (vehicleId: number) => {
    if (!schDate || !schPrincipal) return;
    const principal = parseInt(schPrincipal.replace(/\D/g, '')) || 0;
    const interest = parseInt(schInterest.replace(/\D/g, '')) || 0;
    const remaining = parseInt(schRemaining.replace(/\D/g, '')) || 0;
    const total = principal + interest;
    if (total <= 0) return;
    
    await addVehicleSchedule({
      vehicleId,
      paymentDate: schDate,
      interestRate: schInterestRate,
      principalAmount: principal,
      interestAmount: interest,
      totalAmount: total,
      remainingBalance: remaining
    });
    
    // Refresh inner
    setSchDate("");
    setSchInterestRate("");
    setSchPrincipal("");
    setSchInterest("");
    setSchRemaining("");
    setIsAddingSchedule(false);
    const schedules = await getVehicleSchedule(vehicleId);
    setVehicleSchedules(schedules);
    
    // Refresh global
    router.refresh();
  };

  const handleAutoGenerate = async (vehicleId: number) => {
    if (!autoStartDate || !autoDuration || !autoLoanAmount || !autoInterestRate) return;
    const loanAmount = parseInt(autoLoanAmount.replace(/\D/g, ''));
    const duration = parseInt(autoDuration);
    const interestRate = parseFloat(autoInterestRate);

    if (isNaN(loanAmount) || isNaN(duration) || isNaN(interestRate)) return;

    await autoGenerateSchedule({
      vehicleId,
      startDate: autoStartDate,
      durationMonths: duration,
      loanAmount: loanAmount,
      interestRate: interestRate,
      method: autoMethod
    });

    setIsAutoGenerating(false);
    const schedules = await getVehicleSchedule(vehicleId);
    setVehicleSchedules(schedules);

    // Refresh global
    const newPending = await getAllPendingSchedules();
    setPendingSchedules(newPending);
    const newPaid = await getAllPaidSchedules();
    setPaidSchedules(newPaid);
    router.refresh();
  };

  const handlePaySchedule = async (scheduleId: number, amountStr: string, dateStr: string) => {
    const amount = parseInt(amountStr.replace(/\D/g, ''));
    if (isNaN(amount) || amount <= 0) return;

    await payVehicleSchedule(scheduleId, amount, dateStr);
    
    setPayingScheduleId(null);
    
    // Refresh local lists
    const newPending = await getAllPendingSchedules();
    setPendingSchedules(newPending);
    const newPaid = await getAllPaidSchedules();
    setPaidSchedules(newPaid);

    if (selectedVehicle) {
      const schedules = await getVehicleSchedule(selectedVehicle.id);
      setVehicleSchedules(schedules);
    }
    
    // Trigger server refresh for stats
    router.refresh();
  };

  const submitContract = async () => {
    if (!newContractNo) return;
    const amount = parseInt(newLoanAmount.replace(/\D/g, '')) || null;
    const numVehs = parseInt(newNumVehicles) || null;
    
    if (editingContractId) {
      await updateContract(editingContractId, {
        contractNo: newContractNo,
        loanDate: newLoanDate || null,
        loanAmount: amount,
        numVehicles: numVehs,
        completionDate: newCompletionDate || null,
        interestRate: newInterestRate || null,
        note: ""
      });
    } else {
      await addContract({
        contractNo: newContractNo,
        loanDate: newLoanDate || null,
        loanAmount: amount,
        numVehicles: numVehs,
        completionDate: newCompletionDate || null,
        interestRate: newInterestRate || null,
        note: ""
      });
    }
    
    setIsAddingContract(false);
    setEditingContractId(null);
    setNewContractNo("");
    setNewLoanDate("");
    setNewLoanAmount("");
    setNewNumVehicles("");
    setNewCompletionDate("");
    setNewInterestRate("");
    router.refresh();
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContractId(contract.id);
    setNewContractNo(contract.contractNo || "");
    setNewLoanDate(contract.loanDate ? contract.loanDate.split('T')[0] : "");
    setNewLoanAmount(contract.loanAmount ? contract.loanAmount.toLocaleString('en-US') : "");
    setNewNumVehicles(contract.numVehicles ? contract.numVehicles.toString() : "");
    setNewCompletionDate(contract.completionDate ? contract.completionDate.split('T')[0] : "");
    setNewInterestRate(contract.interestRate || "");
    setIsAddingContract(true);
  };

  const submitTransferVehicle = async () => {
    if (!transferVehicleId || !transferTargetContract) return;
    await updateVehicleContract(transferVehicleId, transferTargetContract);
    setTransferVehicleId(null);
    setTransferTargetContract("");
    router.refresh();
  };

  const handleDeleteVehicle = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa xe này cùng toàn bộ lịch trả nợ liên quan? Hành động này không thể hoàn tác.")) {
      await deleteVehicle(id);
      router.refresh();
    }
  };

  const linkedVehiclesForForm = initialVehicles.filter(v => v.contractNo === newContractNo);

  const filteredContracts = initialContracts.filter(c => 
    (c.contractNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = initialVehicles.filter(v => 
    (v.licensePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.contractNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayPendingSchedules = pendingSchedules.filter(s => {
    if (!s.paymentDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payDate = new Date(s.paymentDate);
    const diffTime = payDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 31; // Chỉ hiển thị số tiền tháng tiếp theo (hoặc quá hạn)
  });

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payDate = new Date(dateStr);
    return payDate < today;
  };

  const getScheduleStatusBadge = (dateStr: string | null, status: string) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Đã đóng
        </span>
      );
    }
    
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Đóng thiếu
        </span>
      );
    }

    if (!dateStr) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          Chưa đóng
        </span>
      );
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payDate = new Date(dateStr);
    
    const diffTime = payDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Quá hạn
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Sắp đến hạn
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          Chưa tới hạn
        </span>
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý Công nợ Ngân hàng</h1>
        <p className="mt-2 text-base text-slate-500 font-medium">Theo dõi các khoản vay mua xe tải, lịch thanh toán và tình trạng nợ.</p>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-red-50 text-red-600 rounded-md w-max mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Nợ quá hạn</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.overdueDebt || 0)} đ</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-md w-max mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Sắp đến hạn (15 ngày)</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.upcomingDebt || 0)} đ</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-md w-max mb-3">
                <Banknote className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Tổng dư nợ gốc</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalLoan || 0)} đ</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md w-max mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Đã đóng (Tháng này)</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.paidThisMonth || 0)} đ</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-2 pt-2 overflow-x-auto">
          <nav className="flex gap-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-3 px-5 inline-flex items-center gap-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-white shadow-sm text-indigo-700 border border-slate-200 border-b-white -mb-px relative z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Cần thanh toán
              {displayPendingSchedules.length > 0 && (
                <span className="ml-1 bg-rose-100 text-rose-700 py-0.5 px-2 rounded-full text-[10px] uppercase tracking-wider">{displayPendingSchedules.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`py-3 px-5 inline-flex items-center gap-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'vehicles'
                  ? 'bg-white shadow-sm text-indigo-700 border border-slate-200 border-b-white -mb-px relative z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent'
              }`}
            >
              <Car className="h-4 w-4" />
              Danh sách Xe
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`py-3 px-5 inline-flex items-center gap-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'contracts'
                  ? 'bg-white shadow-sm text-indigo-700 border border-slate-200 border-b-white -mb-px relative z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent'
              }`}
            >
              <FileText className="h-4 w-4" />
              Danh sách Hợp đồng
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-5 inline-flex items-center gap-2 rounded-t-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-white shadow-sm text-indigo-700 border border-slate-200 border-b-white -mb-px relative z-10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Lịch sử đã đóng
            </button>
          </nav>
        </div>

        <div className="p-6">
          {(activeTab === 'contracts' || activeTab === 'vehicles') && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'contracts' ? "Tìm theo số hợp đồng..." : "Tìm theo biển số, chủ xe..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {activeTab === 'contracts' && (
                <button
                  onClick={() => {
                    setEditingContractId(null);
                    setNewContractNo("");
                    setNewLoanDate("");
                    setNewLoanAmount("");
                    setNewNumVehicles("");
                    setNewCompletionDate("");
                    setNewInterestRate("");
                    setIsAddingContract(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Thêm Hợp Đồng
                </button>
              )}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {activeTab === 'pending' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Hạn nộp</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Biển số</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Hợp đồng</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Số tiền</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayPendingSchedules.length > 0 ? displayPendingSchedules.map((s) => {
                    const overdue = isOverdue(s.paymentDate);
                    return (
                      <React.Fragment key={`pending-${s.id}`}>
                        <tr className={`hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className={`font-semibold ${overdue ? 'text-red-600' : 'text-slate-900'}`}>
                              {formatDate(s.paymentDate)}
                              {overdue && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">Quá hạn</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900 bg-slate-100 inline-block px-2 py-1 rounded border border-slate-300 text-sm">
                              {s.licensePlate}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{s.ownerName}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-600 font-medium">
                            {s.contractNo}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="font-bold text-lg text-slate-900">{formatCurrency(s.totalAmount)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {getScheduleStatusBadge(s.paymentDate, s.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button 
                              onClick={() => {
                                setPayingScheduleId(s.id);
                                setActualPayAmount(formatCurrency(s.totalAmount));
                                setActualPayDate(new Date().toISOString().split('T')[0]);
                              }}
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Xác nhận đóng
                            </button>
                          </td>
                        </tr>
                        {payingScheduleId === s.id && (
                          <tr className="bg-indigo-50/50">
                            <td colSpan={6} className="px-4 py-4 border-t border-indigo-100">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-sm font-medium text-indigo-900">Ngày nộp thực tế:</span>
                                <input type="date" value={actualPayDate} onChange={e => setActualPayDate(e.target.value)} className="text-sm border border-slate-300 rounded px-3 py-1.5" />
                                <span className="text-sm font-medium text-indigo-900">Số tiền nộp:</span>
                                <input type="text" value={actualPayAmount} onChange={e => handleAmountChange(e, setActualPayAmount)} className="text-sm border border-slate-300 rounded px-3 py-1.5 w-32 font-bold" />
                                <button onClick={() => handlePaySchedule(s.id, actualPayAmount, actualPayDate)} className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700 font-bold">Lưu thanh toán</button>
                                <button onClick={() => setPayingScheduleId(null)} className="text-slate-500 text-sm hover:underline ml-2">Hủy</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                          <p className="text-lg font-medium text-slate-900">Tuyệt vời!</p>
                          <p className="text-slate-500">Không có khoản nợ nào cần thanh toán lúc này.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'history' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Ngày nộp</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Biển số</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Hợp đồng</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Phải trả</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Thực tế nộp</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paidSchedules.length > 0 ? paidSchedules.map((s) => (
                    <tr key={`paid-${s.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {formatDate(s.actualPaidDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{s.licensePlate}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {s.contractNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500 line-through">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="font-bold text-green-600">{formatCurrency(s.actualPaidAmount || 0)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {s.status === 'PAID' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> Đã đủ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Đóng thiếu
                          </span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Chưa có lịch sử thanh toán nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'contracts' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Hợp đồng</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Ngày vay</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Số tiền vay</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Lãi suất</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Số lượng xe</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Ngày hoàn tất</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredContracts.length > 0 ? filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{contract.contractNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(contract.loanDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {formatCurrency(contract.loanAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {contract.interestRate || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {contract.numVehicles}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        {formatDate(contract.completionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleEditContract(contract)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                          title="Sửa hợp đồng"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Không tìm thấy hợp đồng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'vehicles' && (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Biển số</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Chủ xe (Đứng tên)</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Hợp đồng</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Số tiền vay</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Lãi suất</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Thời hạn</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-left">Thời gian</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredVehicles.length > 0 ? filteredVehicles.map((vehicle) => (
                    <React.Fragment key={vehicle.id}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleExpandVehicle(vehicle)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 bg-slate-100 inline-block px-3 py-1 rounded-md border border-slate-300">
                            {vehicle.licensePlate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                          {vehicle.ownerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">
                          {vehicle.contractNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {formatCurrency(vehicle.loanAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {vehicle.interestRate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {vehicle.term}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {formatDate(vehicle.startDate)} - {formatDate(vehicle.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              setTransferVehicleId(vehicle.id);
                              setTransferTargetContract(vehicle.contractNo || "");
                            }}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-full hover:bg-orange-50"
                            title="Chuyển hợp đồng"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                            title="Xóa xe"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        Không tìm thấy xe nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết lịch trả nợ - Biển số {selectedVehicle.licensePlate}</h3>
                <p className="text-sm text-slate-500">Chủ xe: {selectedVehicle.ownerName} | Hợp đồng: {selectedVehicle.contractNo}</p>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => {
                    setIsAutoGenerating(!isAutoGenerating);
                    setIsAddingSchedule(false);
                  }}
                  className="text-sm bg-amber-50 text-amber-700 px-4 py-2 rounded hover:bg-amber-100 transition-colors flex items-center gap-1 font-bold border border-amber-200"
                >
                  <Zap className="h-4 w-4" /> Tạo lịch tự động
                </button>
                <button 
                  onClick={() => {
                    setIsAddingSchedule(!isAddingSchedule);
                    setIsAutoGenerating(false);
                  }}
                  className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1 font-medium border border-indigo-200"
                >
                  <Plus className="h-4 w-4" /> Thêm lịch tay
                </button>
              </div>

              {isAutoGenerating && (
                <div className="mb-6 bg-amber-50 p-5 rounded-xl border border-amber-200">
                  <h5 className="font-bold text-amber-900 mb-3 flex items-center gap-2"><Zap className="h-4 w-4"/> Thông số sinh lịch tự động</h5>
                  <p className="text-sm text-amber-700 mb-4">Lưu ý: Tính năng này sẽ tạo hàng loạt kỳ trả nợ và <b>xóa các kỳ chưa đóng cũ</b> của xe này.</p>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-1">Ngày bắt đầu</label>
                      <input type="date" value={autoStartDate} onChange={e => setAutoStartDate(e.target.value)} className="text-sm border border-amber-300 rounded px-3 py-2 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-1">Số tháng vay</label>
                      <input type="number" value={autoDuration} onChange={e => setAutoDuration(e.target.value)} className="text-sm border border-amber-300 rounded px-3 py-2 outline-none w-24 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-1">Số tiền vay (Gốc)</label>
                      <input type="text" value={autoLoanAmount} onChange={e => handleAmountChange(e, setAutoLoanAmount)} className="text-sm border border-amber-300 rounded px-3 py-2 outline-none w-36 bg-white font-bold text-amber-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-1">Lãi suất (%/năm)</label>
                      <input type="text" value={autoInterestRate} onChange={e => setAutoInterestRate(e.target.value)} className="text-sm border border-amber-300 rounded px-3 py-2 outline-none w-28 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-1">Cách tính lãi</label>
                      <select value={autoMethod} onChange={e => setAutoMethod(e.target.value as any)} className="text-sm border border-amber-300 rounded px-3 py-2 outline-none bg-white">
                        <option value="DECLINING">Dư nợ giảm dần</option>
                        <option value="FLAT">Dư nợ ban đầu (Phẳng)</option>
                      </select>
                    </div>
                    <button onClick={() => handleAutoGenerate(selectedVehicle.id)} className="bg-amber-600 text-white px-5 py-2 rounded text-sm font-bold hover:bg-amber-700 shadow flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Bắt đầu tạo
                    </button>
                  </div>
                </div>
              )}

              {isAddingSchedule && (
                <div className="mb-6 flex flex-wrap gap-4 items-end bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kỳ trả nợ (Ngày)</label>
                    <input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} className="text-sm border border-slate-300 rounded px-3 py-2 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lãi suất</label>
                    <input type="text" placeholder="VD: 7.9%" value={schInterestRate} onChange={e => setSchInterestRate(e.target.value)} className="text-sm border border-slate-300 rounded px-3 py-2 outline-none w-24" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nợ gốc</label>
                    <input type="text" placeholder="Số tiền gốc" value={schPrincipal} onChange={e => handleAmountChange(e, setSchPrincipal)} className="text-sm border border-slate-300 rounded px-3 py-2 outline-none w-32" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nợ lãi</label>
                    <input type="text" placeholder="Số tiền lãi" value={schInterest} onChange={e => handleAmountChange(e, setSchInterest)} className="text-sm border border-slate-300 rounded px-3 py-2 outline-none w-32" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dư nợ cuối kỳ</label>
                    <input type="text" placeholder="Gốc còn lại" value={schRemaining} onChange={e => handleAmountChange(e, setSchRemaining)} className="text-sm border border-slate-300 rounded px-3 py-2 outline-none w-36 font-bold text-slate-900" />
                  </div>
                  <button onClick={() => handleAddSchedule(selectedVehicle.id)} className="bg-indigo-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-indigo-700 shadow">
                    Lưu kỳ này
                  </button>
                </div>
              )}

              {vehicleSchedules.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left text-sm font-bold text-slate-700 px-4 py-3 border-r border-slate-200">Kỳ (Ngày)</th>
                        <th className="text-left text-sm font-bold text-slate-700 px-4 py-3 border-r border-slate-200">Lãi suất</th>
                        <th className="text-right text-sm font-bold text-slate-700 px-4 py-3 border-r border-slate-200">Nợ gốc</th>
                        <th className="text-right text-sm font-bold text-slate-700 px-4 py-3 border-r border-slate-200">Nợ lãi</th>
                        <th className="text-right text-sm font-bold text-indigo-900 px-4 py-3 border-r border-slate-200 bg-indigo-50">Phải trả</th>
                        <th className="text-right text-sm font-bold text-slate-700 px-4 py-3 border-r border-slate-200">Dư nợ</th>
                        <th className="text-center text-sm font-bold text-slate-700 px-4 py-3 border-r border-slate-200">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {vehicleSchedules.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-800 font-medium border-r border-slate-200">{formatDate(s.paymentDate)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 border-r border-slate-200">{s.interestRate || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 text-right border-r border-slate-200">{formatCurrency(s.principalAmount)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 text-right border-r border-slate-200">{formatCurrency(s.interestAmount)}</td>
                          <td className="px-4 py-3 text-sm text-indigo-700 font-bold text-right border-r border-slate-200 bg-indigo-50/20">{formatCurrency(s.totalAmount)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 text-right border-r border-slate-200">{formatCurrency(s.remainingBalance)}</td>
                          <td className="px-4 py-3 text-sm border-r border-slate-200 text-center">
                            {getScheduleStatusBadge(s.paymentDate, s.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FileText className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-base text-slate-500 font-medium">Chưa có lịch trả nợ nào được tạo cho xe này.</p>
                  <p className="text-sm text-slate-400 mt-1">Sử dụng nút "Tạo lịch tự động" hoặc "Thêm lịch tay" ở trên.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTRACT MODAL */}
      {isAddingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{editingContractId ? 'Cập Nhật Hợp Đồng' : 'Thêm Hợp Đồng Mới'}</h3>
              <button 
                onClick={() => setIsAddingContract(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã Hợp Đồng <span className="text-red-500">*</span></label>
                <input type="text" value={newContractNo} onChange={e => setNewContractNo(e.target.value)} placeholder="VD: 0181.2026" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày vay</label>
                  <input type="date" value={newLoanDate} onChange={e => setNewLoanDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hoàn tất (dự kiến)</label>
                  <input type="date" value={newCompletionDate} onChange={e => setNewCompletionDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tổng Số Tiền Vay</label>
                <input type="text" value={newLoanAmount} onChange={e => handleAmountChange(e, setNewLoanAmount)} placeholder="Nhập số tiền" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng xe</label>
                  <input type="number" value={newNumVehicles} onChange={e => setNewNumVehicles(e.target.value)} placeholder="VD: 5" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lãi suất</label>
                  <input type="text" value={newInterestRate} onChange={e => setNewInterestRate(e.target.value)} placeholder="VD: 7.9%" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              
              {editingContractId && linkedVehiclesForForm.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4 text-slate-400" /> Các xe thuộc hợp đồng này ({linkedVehiclesForForm.length})
                  </h4>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">Biển số</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">Chủ xe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {linkedVehiclesForForm.map(v => (
                          <tr key={v.id}>
                            <td className="px-4 py-2 text-sm font-semibold text-slate-900">{v.licensePlate}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{v.ownerName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingContract(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submitContract}
                disabled={!newContractNo}
                className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingContractId ? 'Lưu Thay Đổi' : 'Tạo Hợp Đồng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER VEHICLE MODAL */}
      {transferVehicleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Chuyển Hợp Đồng Cho Xe</h3>
              <button 
                onClick={() => setTransferVehicleId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm border border-orange-200 flex gap-2">
                <ArrowRightLeft className="h-5 w-5 shrink-0 text-orange-500" />
                <p>Bạn đang chuyển xe sang một hợp đồng khác. Các dữ liệu nợ cũ sẽ giữ nguyên, xe sẽ được hiển thị trong hợp đồng mới kể từ bây giờ.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn hợp đồng đích <span className="text-red-500">*</span></label>
                <select 
                  value={transferTargetContract} 
                  onChange={e => setTransferTargetContract(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="" disabled>-- Chọn hợp đồng --</option>
                  {initialContracts.map(c => (
                    <option key={c.id} value={c.contractNo}>{c.contractNo} (Vay {formatCurrency(c.loanAmount)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setTransferVehicleId(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submitTransferVehicle}
                disabled={!transferTargetContract}
                className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
