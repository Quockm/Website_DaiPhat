"use server";

import { revalidatePath } from 'next/cache';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

export async function getContracts() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT Id, ContractNo, LoanDate, LoanAmount, NumVehicles, CompletionDate, Note, InterestRate
      FROM App_Debt_Contract
      ORDER BY Id DESC
    `);
    // pool.close(); // Managed by db.ts
    
    return result.recordset.map(r => ({
      id: r.Id,
      contractNo: r.ContractNo,
      loanDate: r.LoanDate ? new Date(r.LoanDate).toISOString() : null,
      loanAmount: r.LoanAmount,
      numVehicles: r.NumVehicles,
      completionDate: r.CompletionDate ? new Date(r.CompletionDate).toISOString() : null,
      note: r.Note,
      interestRate: r.InterestRate
    }));
  } catch (err) {
    console.error("Error fetching contracts:", err);
    return [];
  }
}

export async function addContract(data: {
  contractNo: string;
  loanDate: string | null;
  loanAmount: number | null;
  numVehicles: number | null;
  completionDate: string | null;
  interestRate: string | null;
  note: string;
}) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('ContractNo', sql.NVarChar, data.contractNo)
      .input('LoanDate', sql.Date, data.loanDate ? new Date(data.loanDate) : null)
      .input('LoanAmount', sql.Decimal(18, 2), data.loanAmount)
      .input('NumVehicles', sql.Int, data.numVehicles)
      .input('CompletionDate', sql.Date, data.completionDate ? new Date(data.completionDate) : null)
      .input('InterestRate', sql.NVarChar, data.interestRate || '')
      .input('Note', sql.NVarChar, data.note || '')
      .query(`
        INSERT INTO App_Debt_Contract (ContractNo, LoanDate, LoanAmount, NumVehicles, CompletionDate, InterestRate, Note)
        OUTPUT inserted.Id
        VALUES (@ContractNo, @LoanDate, @LoanAmount, @NumVehicles, @CompletionDate, @InterestRate, @Note)
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/debts');
    return { success: true, id: result.recordset[0].Id };
  } catch (err: any) {
    console.error("Error adding contract:", err);
    return { success: false, error: err.message };
  }
}

export async function updateContract(id: number, data: {
  contractNo: string;
  loanDate: string | null;
  loanAmount: number | null;
  numVehicles: number | null;
  completionDate: string | null;
  interestRate: string | null;
  note: string;
}) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('Id', sql.Int, id)
      .input('ContractNo', sql.NVarChar, data.contractNo)
      .input('LoanDate', sql.Date, data.loanDate ? new Date(data.loanDate) : null)
      .input('LoanAmount', sql.Decimal(18, 2), data.loanAmount)
      .input('NumVehicles', sql.Int, data.numVehicles)
      .input('CompletionDate', sql.Date, data.completionDate ? new Date(data.completionDate) : null)
      .input('InterestRate', sql.NVarChar, data.interestRate || '')
      .input('Note', sql.NVarChar, data.note || '')
      .query(`
        UPDATE App_Debt_Contract 
        SET ContractNo = @ContractNo, 
            LoanDate = @LoanDate, 
            LoanAmount = @LoanAmount, 
            NumVehicles = @NumVehicles, 
            CompletionDate = @CompletionDate, 
            InterestRate = @InterestRate, 
            Note = @Note
        WHERE Id = @Id
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/debts');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating contract:", err);
    return { success: false, error: err.message };
  }
}

export async function updateVehicleContract(vehicleId: number, newContractNo: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('Id', sql.Int, vehicleId)
      .input('ContractNo', sql.NVarChar, newContractNo)
      .query(`
        UPDATE App_Debt_Vehicle 
        SET ContractNo = @ContractNo 
        WHERE Id = @Id
      `);
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/debts');
    return { success: true };
  } catch (err: any) {
    console.error("Error updating vehicle contract:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteVehicle(vehicleId: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    // Xóa lịch trả nợ của xe trước để tránh lỗi FK
    await pool.request()
      .input('VehicleId', sql.Int, vehicleId)
      .query(`DELETE FROM App_Debt_Schedule WHERE VehicleId = @VehicleId`);
      
    // Xóa xe
    await pool.request()
      .input('Id', sql.Int, vehicleId)
      .query(`DELETE FROM App_Debt_Vehicle WHERE Id = @Id`);
      
    // pool.close(); // Managed by db.ts
    revalidatePath('/accounting/debts');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting vehicle:", err);
    return { success: false, error: err.message };
  }
}

export async function getVehicles(contractNo?: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    let query = `
      SELECT Id, OwnerName, LicensePlate, ContractNo, LoanAmount, Term, StartDate, EndDate, Note, InterestRate
      FROM App_Debt_Vehicle
    `;
    const request = pool.request();
    if (contractNo) {
      query += ` WHERE ContractNo = @ContractNo`;
      request.input('ContractNo', sql.NVarChar, contractNo);
    }
    query += ` ORDER BY Id DESC`;
    
    const result = await request.query(query);
    // pool.close(); // Managed by db.ts
    
    return result.recordset.map(r => ({
      id: r.Id,
      ownerName: r.OwnerName,
      licensePlate: r.LicensePlate,
      contractNo: r.ContractNo,
      loanAmount: r.LoanAmount,
      term: r.Term,
      startDate: r.StartDate ? new Date(r.StartDate).toISOString() : null,
      endDate: r.EndDate ? new Date(r.EndDate).toISOString() : null,
      note: r.Note,
      interestRate: r.InterestRate
    }));
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    return [];
  }
}

export async function getDebtDashboardStats() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        (SELECT ISNULL(SUM(LoanAmount), 0) FROM App_Debt_Contract) as TotalLoan,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM App_Debt_Schedule WHERE Status != 'PAID' AND PaymentDate < CAST(GETDATE() AS DATE)) as OverdueDebt,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM App_Debt_Schedule WHERE Status != 'PAID' AND PaymentDate >= CAST(GETDATE() AS DATE) AND PaymentDate <= DATEADD(day, 15, GETDATE())) as UpcomingDebt,
        (SELECT ISNULL(SUM(ActualPaidAmount), 0) FROM App_Debt_Schedule WHERE Status = 'PAID' AND MONTH(ActualPaidDate) = MONTH(GETDATE()) AND YEAR(ActualPaidDate) = YEAR(GETDATE())) as PaidThisMonth,
        (SELECT COUNT(*) FROM App_Debt_Vehicle) as TotalVehicles,
        (SELECT COUNT(*) FROM App_Debt_Contract) as TotalContracts
    `);
    // pool.close(); // Managed by db.ts
    
    const r = result.recordset[0];
    return {
      totalLoan: r.TotalLoan,
      overdueDebt: r.OverdueDebt,
      upcomingDebt: r.UpcomingDebt,
      paidThisMonth: r.PaidThisMonth,
      totalVehicles: r.TotalVehicles,
      totalContracts: r.TotalContracts
    };
  } catch (err) {
    console.error("Error fetching debt stats:", err);
    return { totalLoan: 0, overdueDebt: 0, upcomingDebt: 0, paidThisMonth: 0, totalVehicles: 0, totalContracts: 0 };
  }
}

export async function getVehiclePayments(vehicleId: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('VehicleId', sql.Int, vehicleId)
      .query(`
        SELECT Id, VehicleId, PaymentDate, Amount, IsPaid, Note
        FROM App_Debt_Payment
        WHERE VehicleId = @VehicleId
        ORDER BY PaymentDate DESC
      `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      id: r.Id,
      vehicleId: r.VehicleId,
      paymentDate: r.PaymentDate ? new Date(r.PaymentDate).toISOString() : null,
      amount: r.Amount,
      isPaid: r.IsPaid,
      note: r.Note
    }));
  } catch (err) {
    console.error("Error fetching payments:", err);
    return [];
  }
}

export async function addVehiclePayment(data: { vehicleId: number, paymentDate: string, amount: number, note: string }) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('VehicleId', sql.Int, data.vehicleId)
      .input('PaymentDate', sql.DateTime, new Date(data.paymentDate))
      .input('Amount', sql.BigInt, data.amount)
      .input('IsPaid', sql.Bit, 1)
      .input('Note', sql.NVarChar, data.note)
      .query(`
        INSERT INTO App_Debt_Payment (VehicleId, PaymentDate, Amount, IsPaid, Note)
        VALUES (@VehicleId, @PaymentDate, @Amount, @IsPaid, @Note)
      `);
    // pool.close(); // Managed by db.ts
    return { success: true };
  } catch (err: any) {
    console.error("Error adding payment:", err);
    return { success: false, error: err.message };
  }
}

export async function getVehicleSchedule(vehicleId: number) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request()
      .input('VehicleId', sql.Int, vehicleId)
      .query(`
        SELECT Id, PaymentDate, InterestRate, PrincipalAmount, InterestAmount, TotalAmount, RemainingBalance, ActualPaidAmount, ActualPaidDate, Status, Note
        FROM App_Debt_Schedule
        WHERE VehicleId = @VehicleId
        ORDER BY PaymentDate ASC
      `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      id: r.Id,
      paymentDate: r.PaymentDate ? new Date(r.PaymentDate).toISOString() : null,
      interestRate: r.InterestRate,
      principalAmount: r.PrincipalAmount,
      interestAmount: r.InterestAmount,
      totalAmount: r.TotalAmount,
      remainingBalance: r.RemainingBalance,
      actualPaidAmount: r.ActualPaidAmount,
      actualPaidDate: r.ActualPaidDate ? new Date(r.ActualPaidDate).toISOString() : null,
      status: r.Status,
      note: r.Note
    }));
  } catch (err) {
    console.error("Error fetching schedule:", err);
    return [];
  }
}

export async function payVehicleSchedule(scheduleId: number, actualPaidAmount: number, payDate: string) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('Id', sql.Int, scheduleId)
      .input('ActualPaidAmount', sql.BigInt, actualPaidAmount)
      .input('ActualPaidDate', sql.DateTime, new Date(payDate))
      .query(`
        UPDATE App_Debt_Schedule
        SET ActualPaidAmount = @ActualPaidAmount,
            ActualPaidDate = @ActualPaidDate,
            Status = CASE WHEN @ActualPaidAmount >= TotalAmount THEN 'PAID' ELSE 'PARTIAL' END
        WHERE Id = @Id
      `);
    // pool.close(); // Managed by db.ts
    return { success: true };
  } catch (err: any) {
    console.error("Error paying schedule:", err);
    return { success: false, error: err.message };
  }
}

export async function addVehicleSchedule(data: {
  vehicleId: number,
  paymentDate: string,
  interestRate: string,
  principalAmount: number,
  interestAmount: number,
  totalAmount: number,
  remainingBalance: number
}) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    await pool.request()
      .input('VehicleId', sql.Int, data.vehicleId)
      .input('PaymentDate', sql.DateTime, new Date(data.paymentDate))
      .input('InterestRate', sql.NVarChar, data.interestRate)
      .input('PrincipalAmount', sql.BigInt, data.principalAmount)
      .input('InterestAmount', sql.BigInt, data.interestAmount)
      .input('TotalAmount', sql.BigInt, data.totalAmount)
      .input('RemainingBalance', sql.BigInt, data.remainingBalance)
      .query(`
        INSERT INTO App_Debt_Schedule (VehicleId, PaymentDate, InterestRate, PrincipalAmount, InterestAmount, TotalAmount, RemainingBalance, Status)
        VALUES (@VehicleId, @PaymentDate, @InterestRate, @PrincipalAmount, @InterestAmount, @TotalAmount, @RemainingBalance, 'UNPAID')
      `);
    // pool.close(); // Managed by db.ts
    return { success: true };
  } catch (err: any) {
    console.error("Error adding schedule:", err);
    return { success: false, error: err.message };
  }
}

export async function getAllPendingSchedules() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        s.Id, s.VehicleId, s.PaymentDate, s.TotalAmount, s.Status,
        v.LicensePlate, v.OwnerName, v.ContractNo
      FROM App_Debt_Schedule s
      JOIN App_Debt_Vehicle v ON s.VehicleId = v.Id
      WHERE s.Status != 'PAID'
      ORDER BY s.PaymentDate ASC
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      id: r.Id,
      vehicleId: r.VehicleId,
      paymentDate: r.PaymentDate ? new Date(r.PaymentDate).toISOString() : null,
      totalAmount: r.TotalAmount,
      status: r.Status,
      licensePlate: r.LicensePlate,
      ownerName: r.OwnerName,
      contractNo: r.ContractNo
    }));
  } catch (err) {
    console.error("Error fetching pending schedules:", err);
    return [];
  }
}

export async function getAllPaidSchedules() {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const result = await pool.request().query(`
      SELECT 
        s.Id, s.VehicleId, s.PaymentDate, s.ActualPaidDate, s.ActualPaidAmount, s.TotalAmount, s.Status,
        v.LicensePlate, v.OwnerName, v.ContractNo
      FROM App_Debt_Schedule s
      JOIN App_Debt_Vehicle v ON s.VehicleId = v.Id
      WHERE s.Status = 'PAID' OR s.Status = 'PARTIAL'
      ORDER BY s.ActualPaidDate DESC
    `);
    // pool.close(); // Managed by db.ts
    return result.recordset.map(r => ({
      id: r.Id,
      vehicleId: r.VehicleId,
      paymentDate: r.PaymentDate ? new Date(r.PaymentDate).toISOString() : null,
      actualPaidDate: r.ActualPaidDate ? new Date(r.ActualPaidDate).toISOString() : null,
      actualPaidAmount: r.ActualPaidAmount,
      totalAmount: r.TotalAmount,
      status: r.Status,
      licensePlate: r.LicensePlate,
      ownerName: r.OwnerName,
      contractNo: r.ContractNo
    }));
  } catch (err) {
    console.error("Error fetching paid schedules:", err);
    return [];
  }
}

export async function autoGenerateSchedule(options: {
  vehicleId: number;
  startDate: string;
  durationMonths: number;
  loanAmount: number;
  interestRate: number; // e.g. 7.9
  method: 'DECLINING' | 'FLAT';
}) {
  try {
    const pool = await getDbConnection(process.env.SQL_DATABASE || 'dp_system');
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      
      // Delete existing UNPAID schedules
      await request
        .input('VehicleId', sql.Int, options.vehicleId)
        .query(`DELETE FROM App_Debt_Schedule WHERE VehicleId = @VehicleId AND Status = 'UNPAID'`);

      const principalPerMonth = Math.round(options.loanAmount / options.durationMonths);
      let currentBalance = options.loanAmount;

      const startDateObj = new Date(options.startDate);

      for (let i = 0; i < options.durationMonths; i++) {
        const paymentDate = new Date(startDateObj);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        let interestAmount = 0;
        if (options.method === 'DECLINING') {
          interestAmount = Math.round(currentBalance * (options.interestRate / 100) / 12);
        } else {
          interestAmount = Math.round(options.loanAmount * (options.interestRate / 100) / 12);
        }

        // Last period settles the remaining balance so principal totals exactly match loanAmount
        const isLastPeriod = i === options.durationMonths - 1;
        const principalAmount = isLastPeriod ? currentBalance : principalPerMonth;

        const totalAmount = principalAmount + interestAmount;
        const remainingAfter = currentBalance - principalAmount;

        const insertReq = new sql.Request(transaction);
        await insertReq
          .input('VehicleId', sql.Int, options.vehicleId)
          .input('PaymentDate', sql.DateTime, paymentDate)
          .input('InterestRate', sql.NVarChar, options.interestRate + '%')
          .input('PrincipalAmount', sql.BigInt, principalAmount)
          .input('InterestAmount', sql.BigInt, interestAmount)
          .input('TotalAmount', sql.BigInt, totalAmount)
          .input('RemainingBalance', sql.BigInt, Math.max(0, remainingAfter))
          .query(`
            INSERT INTO App_Debt_Schedule (VehicleId, PaymentDate, InterestRate, PrincipalAmount, InterestAmount, TotalAmount, RemainingBalance, Status)
            VALUES (@VehicleId, @PaymentDate, @InterestRate, @PrincipalAmount, @InterestAmount, @TotalAmount, @RemainingBalance, 'UNPAID')
          `);

        currentBalance = remainingAfter;
      }

      await transaction.commit();
      // pool.close(); // Managed by db.ts
      return { success: true };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err: any) {
    console.error("Error auto generating schedule:", err);
    return { success: false, error: err.message };
  }
}
