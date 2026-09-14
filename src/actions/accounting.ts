"use server";

import { revalidatePath } from 'next/cache';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

export async function getTransactions(dateStr: string, ketFilter?: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    const startStr = `${dateStr}T00:00:00`;
    const endStr = `${dateStr}T23:59:59.999`;
    
    let ketCondition = "";
    let feeKetCondition = "";
    if (ketFilter && ketFilter !== 'ALL') {
      ketCondition = " AND ISNULL(Ket, N'Trang') = @KetFilter";
      feeKetCondition = " AND (CASE WHEN NguoiDuyet = N'Trang' THEN N'Trang' WHEN NguoiDuyet = N'Mẹ' THEN N'Mẹ' ELSE N'Chưa phân bổ' END) = @KetFilter";
    }

    const result = await pool.request()
      .input('StartDate', sql.NVarChar, startStr)
      .input('EndDate', sql.NVarChar, endStr)
      .input('KetFilter', sql.NVarChar, ketFilter || '')
      .query(`
        SELECT 
          Id, MaGD, NgayGD, LoaiGD, DanhMuc, SoTien, NguoiNhanNop, HinhThuc,
          ChungTu, TrangThai, GhiChu, MaKhoa, TrungTam, NgayTao, ISNULL(Ket, N'Trang') as Ket
        FROM App_ThuChi
        WHERE NgayGD >= CAST(@StartDate AS DATETIME) AND NgayGD <= CAST(@EndDate AS DATETIME) ${ketCondition}
        
        UNION ALL
        
        SELECT 
          -1 as Id, 
          'HPG_' + ISNULL(NguoiNop, N'Khách lẻ') + '_' + ISNULL(MaKhoa, 'ALL') + '_' + CONVERT(NVARCHAR, CAST(NgayDuyet AS DATE), 112) as MaGD, 
          CAST(NgayDuyet AS DATE) as NgayGD, 
          'THU' as LoaiGD, 
          N'Học phí' as DanhMuc, 
          SUM(DaNop) as SoTien, 
          ISNULL(NguoiNop, N'Khách lẻ') as NguoiNhanNop, 
          MAX(ISNULL(HinhThucThu, N'Tiền mặt')) as HinhThuc,
          '' as ChungTu, 
          N'Hoàn thành' as TrangThai, 
          N'Thu học phí (Khoá ' + ISNULL(MaKhoa, '') + ')' as GhiChu, 
          MaKhoa, 
          '' as TrungTam, 
          MAX(NgayDuyet) as NgayTao, 
          CASE WHEN NguoiDuyet = N'Trang' THEN N'Trang' 
               WHEN NguoiDuyet = N'Mẹ' THEN N'Mẹ' 
               ELSE N'Chưa phân bổ' END as Ket
        FROM App_HocVien_V2
        WHERE TrangThaiDuyet = 1 AND DaNop > 0
          AND NgayDuyet >= CAST(@StartDate AS DATETIME) AND NgayDuyet <= CAST(@EndDate AS DATETIME) ${feeKetCondition}
        GROUP BY 
          ISNULL(NguoiNop, N'Khách lẻ'), MaKhoa, CAST(NgayDuyet AS DATE), NguoiDuyet
          
        ORDER BY NgayGD DESC, Id DESC
      `);
      
    // pool.close(); // Managed by db.ts
    
    return result.recordset.map(r => ({
      id: r.Id,
      maGD: r.MaGD,
      ngayGD: r.NgayGD,
      loaiGD: r.LoaiGD,
      danhMuc: r.DanhMuc,
      soTien: r.SoTien,
      nguoiNhanNop: r.NguoiNhanNop,
      hinhThuc: r.HinhThuc,
      chungTu: r.ChungTu,
      trangThai: r.TrangThai,
      ghiChu: r.GhiChu,
      maKhoa: r.MaKhoa,
      trungTam: r.TrungTam,
      ngayTao: r.NgayTao,
      ket: r.Ket
    }));
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
}

export async function getAccountingDashboardStats(dateStr: string, ketFilter?: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    const startStr = `${dateStr}T00:00:00`;
    const endStr = `${dateStr}T23:59:59.999`;
    
    const [txDayRes, feesRes, pendingRes, transfersRes] = await Promise.all([
      pool.request()
        .input('StartDate', sql.NVarChar, startStr)
        .input('EndDate', sql.NVarChar, endStr)
        .input('KetFilter', sql.NVarChar, ketFilter || '')
        .query(`
        SELECT LoaiGD, ISNULL(Ket, N'Trang') as Ket, SUM(SoTien) as TotalAmount
        FROM App_ThuChi
        WHERE NgayGD >= CAST(@StartDate AS DATETIME) AND NgayGD <= CAST(@EndDate AS DATETIME) AND TrangThai = N'Hoàn thành'
        GROUP BY LoaiGD, ISNULL(Ket, N'Trang')
      `),
      pool.request()
        .input('StartDate', sql.NVarChar, startStr)
        .input('EndDate', sql.NVarChar, endStr)
        .query(`
        SELECT
          ISNULL(NguoiDuyet, '') as NguoiDuyet,
          SUM(DaNop) as TotalFee
        FROM App_HocVien_V2
        WHERE TrangThaiDuyet = 1 AND DaNop > 0
          AND NgayDuyet >= CAST(@StartDate AS DATETIME) AND NgayDuyet <= CAST(@EndDate AS DATETIME)
        GROUP BY ISNULL(NguoiDuyet, '')
      `),
      pool.request().query(`
        SELECT SUM(DaNop) as TotalPending
        FROM App_HocVien_V2
        WHERE (TrangThaiDuyet = 0 OR TrangThaiDuyet IS NULL) AND DaNop > 0
      `),
      pool.request().query(`
        SELECT TuKet, DenKet, SoTien, TrangThai
        FROM App_KetTransfer
      `),
    ]);

    // pool.close(); // Managed by db.ts
    
    let dayIncome = 0;
    let dayExpense = 0;
    txDayRes.recordset.forEach(r => {
      const isMatch = !ketFilter || ketFilter === 'ALL' || r.Ket === ketFilter;
      if (isMatch) {
        if (r.LoaiGD === 'THU') dayIncome += r.TotalAmount;
        if (r.LoaiGD === 'CHI') dayExpense += r.TotalAmount;
      }
    });

    let todayApprovedTrang = 0;
    let todayApprovedMe = 0;

    feesRes.recordset.forEach(r => {
      if (r.NguoiDuyet === 'Trang') todayApprovedTrang += r.TotalFee;
      if (r.NguoiDuyet === 'Mẹ') todayApprovedMe += r.TotalFee;
    });

    let totalFeesForSelectedKet = 0;
    if (ketFilter === 'Trang') totalFeesForSelectedKet = todayApprovedTrang;
    else if (ketFilter === 'Mẹ') totalFeesForSelectedKet = todayApprovedMe;
    else totalFeesForSelectedKet = todayApprovedTrang + todayApprovedMe;

    const totalPending = pendingRes.recordset[0]?.TotalPending || 0;
    
    let chuyenDi = 0;
    let nhanVe = 0;
    transfersRes.recordset.forEach(r => {
      if (ketFilter === 'ALL' || !ketFilter) {
        chuyenDi += Number(r.SoTien || 0);
        if (r.TrangThai === 'Đã xác nhận') nhanVe += Number(r.SoTien || 0);
      } else {
        if (r.TuKet === ketFilter) chuyenDi += Number(r.SoTien || 0);
        if (r.DenKet === ketFilter && r.TrangThai === 'Đã xác nhận') nhanVe += Number(r.SoTien || 0);
      }
    });
    
    // Tồn quỹ (Tiền trong két) = Tiền học phí duyệt trong ngày + Thu khác - Tiền chi trong ngày - Chuyển đi + Nhận về
    const balance = totalFeesForSelectedKet + dayIncome - dayExpense - chuyenDi + nhanVe;

    return {
      totalIncome: dayIncome,
      totalExpense: dayExpense,
      balance,
      todayApprovedTrang,
      todayApprovedMe,
      todayTotal: totalFeesForSelectedKet,
      totalPending
    };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    return { 
      totalIncome: 0, totalExpense: 0, balance: 0, 
      todayApprovedTrang: 0, todayApprovedMe: 0, 
      monthApprovedTrang: 0, monthApprovedMe: 0, 
      todayTotal: 0, totalPending: 0 
    };
  }
}

export async function createTransaction(data: any) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    
    const now = new Date();
    const pad = (n: number, w: number) => n.toString().padStart(w, '0');
    // Generate MaGD: TC-YYYYMMDD-HHMMSS
    const maGD = `TC-${now.getFullYear()}${pad(now.getMonth()+1, 2)}${pad(now.getDate(), 2)}-${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}`;
    
    const request = pool.request();
    request.input('MaGD', sql.NVarChar, maGD);
    request.input('NgayGD', sql.DateTime, data.ngayGD ? new Date(data.ngayGD) : new Date());
    request.input('LoaiGD', sql.NVarChar, data.loaiGD);
    request.input('DanhMuc', sql.NVarChar, data.danhMuc);
    request.input('SoTien', sql.Decimal(18,0), data.soTien);
    request.input('NguoiNhanNop', sql.NVarChar, data.nguoiNhanNop || '');
    request.input('HinhThuc', sql.NVarChar, data.hinhThuc || '');
    request.input('ChungTu', sql.NVarChar, data.chungTu || '');
    request.input('TrangThai', sql.NVarChar, data.trangThai || 'Hoàn thành');
    request.input('GhiChu', sql.NVarChar, data.ghiChu || '');
    request.input('MaKhoa', sql.NVarChar, data.maKhoa || null);
    request.input('TrungTam', sql.NVarChar, data.trungTam || 'Đại Phát');
    request.input('Ket', sql.NVarChar, data.ket || 'Trang');
    
    await request.query(`
      INSERT INTO App_ThuChi (
        MaGD, NgayGD, LoaiGD, DanhMuc, SoTien, NguoiNhanNop, HinhThuc, ChungTu, TrangThai, GhiChu, MaKhoa, TrungTam, Ket
      ) VALUES (
        @MaGD, DATEADD(hour, 7, GETUTCDATE()), @LoaiGD, @DanhMuc, @SoTien, @NguoiNhanNop, @HinhThuc, @ChungTu, @TrangThai, @GhiChu, @MaKhoa, @TrungTam, @Ket
      )
    `);
    
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/transactions');
    return { success: true };
  } catch (err: any) {
    console.error("Error creating transaction:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteTransaction(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('Id', sql.Int, id)
      .query(`DELETE FROM App_ThuChi WHERE Id = @Id`);
    
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/transactions');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting transaction:", err);
    return { success: false, error: err.message };
  }
}

export async function getTransactionById(id: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          Id, MaGD, NgayGD, LoaiGD, DanhMuc, SoTien, NguoiNhanNop, HinhThuc,
          ChungTu, TrangThai, GhiChu, MaKhoa, TrungTam, NgayTao
        FROM App_ThuChi
        WHERE Id = @Id
      `);
      
    // pool.close(); // Managed by db.ts
    
    if (result.recordset.length === 0) return null;
    
    const r = result.recordset[0];
    return {
      id: r.Id,
      maGD: r.MaGD,
      ngayGD: r.NgayGD,
      loaiGD: r.LoaiGD,
      danhMuc: r.DanhMuc,
      soTien: r.SoTien,
      nguoiNhanNop: r.NguoiNhanNop,
      hinhThuc: r.HinhThuc,
      chungTu: r.ChungTu,
      trangThai: r.TrangThai,
      ghiChu: r.GhiChu,
      maKhoa: r.MaKhoa,
      trungTam: r.TrungTam,
      ngayTao: r.NgayTao,
    };
  } catch (err) {
    console.error("Error fetching transaction by id:", err);
    return null;
  }
}

export async function getGroupedFeeStudents(nguoiNop: string, maKhoa: string, ngayDuyetDateStr: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('NguoiNop', sql.NVarChar, nguoiNop)
      .input('MaKhoa', sql.NVarChar, maKhoa)
      .input('NgayDuyetStr', sql.NVarChar, ngayDuyetDateStr)
      .query(`
        SELECT MaDK, HoTen, DaNop, HinhThucThu
        FROM App_HocVien_V2
        WHERE TrangThaiDuyet = 1 AND DaNop > 0
          AND MaKhoa = @MaKhoa
          AND CAST(NgayDuyet AS DATE) = CAST(@NgayDuyetStr AS DATE)
          AND ISNULL(NguoiNop, N'Khách lẻ') = @NguoiNop
      `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      maDK: r.MaDK,
      hoTen: r.HoTen,
      daNop: r.DaNop,
      hinhThucThu: r.HinhThucThu
    }));
  } catch (err) {
    console.error("Error getGroupedFeeStudents:", err);
    return [];
  }
}

export async function getKetTransfers(ketRole: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Ket', sql.NVarChar, ketRole);
    
    const result = await request.query(`
      SELECT * FROM App_KetTransfer
      WHERE (TuKet = @Ket OR DenKet = @Ket)
      ORDER BY NgayNop DESC
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      id: r.Id,
      tuKet: r.TuKet,
      denKet: r.DenKet,
      soTien: r.SoTien,
      trangThai: r.TrangThai,
      ngayNop: r.NgayNop ? new Date(r.NgayNop).toISOString() : null,
      ngayXacNhan: r.NgayXacNhan ? new Date(r.NgayXacNhan).toISOString() : null,
      ghiChu: r.GhiChu
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createKetTransfer(data: { tuKet: string, denKet: string, soTien: number }) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('TuKet', sql.NVarChar, data.tuKet);
    request.input('DenKet', sql.NVarChar, data.denKet);
    request.input('SoTien', sql.BigInt, data.soTien);
    request.input('TrangThai', sql.NVarChar, 'Chờ xác nhận');
    
    await request.query(`
      INSERT INTO App_KetTransfer (TuKet, DenKet, SoTien, TrangThai, NgayNop)
      VALUES (@TuKet, @DenKet, @SoTien, @TrangThai, DATEADD(hour, 7, GETUTCDATE()))
    `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/transactions');
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function confirmKetTransfer(id: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const request = pool.request();
    request.input('Id', sql.Int, id);
    
    await request.query(`
      UPDATE App_KetTransfer
      SET TrangThai = N'Đã xác nhận', NgayXacNhan = DATEADD(hour, 7, GETUTCDATE())
      WHERE Id = @Id
    `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/transactions');
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}
