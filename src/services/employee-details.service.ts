import axiosInstance from './axios';
import { IEmployeeDetailsResponse, ICalendarDay } from '../types/employee-details.types';

/**
 * Service to manage employee details query.
 */
export const employeeDetailsService = {
  /**
   * Fetch employee details with optional date filters.
   * GET /api/employees/{employeeId}/details
   */
  getEmployeeDetails: async (
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<IEmployeeDetailsResponse> => {
    const response = await axiosInstance.get(`/employees/${employeeId}/details`, {
      params: { fromDate, toDate },
    });
    
    // Normalize the real API response to shield the UI from key mismatches
    return normalizeDetailsResponse(response.data, employeeId, fromDate, toDate);
  },

  /**
   * Fetch employee calendar data with date filters.
   * GET /api/employees/{employeeId}/calendar
   */
  getEmployeeCalendar: async (
    employeeId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<ICalendarDay[]> => {
    const response = await axiosInstance.get(`/employees/${employeeId}/calendar`, {
      params: { fromDate, toDate },
    });
    return response.data.data;
  },
};

/**
 * Normalizes the API response structure to align with UI component prop contracts.
 * - Maps `productionDate` -> `date` and adds fallback `id` to history items.
 * - Maps `quantity` -> `quantityProduced` and `earnings` -> `totalEarnings` in product summaries.
 * - Calculates `contributionPercentage` if not provided.
 * - Generates `monthlyEarnings` trend dynamically from the history logs.
 */
function normalizeDetailsResponse(
  apiResponse: any,
  employeeId: string,
  fromDate?: string,
  toDate?: string
): IEmployeeDetailsResponse {
  const success = apiResponse.success ?? true;
  const rawData = apiResponse.data || {};

  // 1. Normalize employee info
  const rawEmp = rawData.employee || {};
  const employee = {
    id: rawEmp.id || employeeId,
    employeeCode: rawEmp.employeeCode || 'EMP0001',
    fullName: rawEmp.fullName || 'Employee Name',
    email: rawEmp.email,
    mobileNumber: rawEmp.mobileNumber,
    address: rawEmp.address,
    joiningDate: rawEmp.joiningDate || '',
    active: rawEmp.active ?? true,
  };

  // 2. Normalize production history items
  const rawHistory = Array.isArray(rawData.productionHistory) ? rawData.productionHistory : [];
  const productionHistory = rawHistory.map((item: any, idx: number) => ({
    id: item.id || `history-item-${idx}`,
    date: item.productionDate || item.date || '',
    productName: item.productName || '',
    quantity: Number(item.quantity ?? 0),
    rate: Number(item.rate ?? 0),
    earnings: Number(item.earnings ?? 0),
  }));

  // 3. Normalize summary totals
  const rawSummary = rawData.summary || {};
  const totalProductionQty = Number(
    rawSummary.totalProductionQty ?? productionHistory.reduce((sum, item) => sum + item.quantity, 0)
  );
  const totalEarnings = Number(
    rawSummary.totalEarnings ?? productionHistory.reduce((sum, item) => sum + item.earnings, 0)
  );
  
  // Current month is June 2026 (based on actual current time 2026-06-24)
  const currentMonthEarnings = Number(
    rawSummary.currentMonthEarnings ??
      productionHistory
        .filter((item) => item.date && item.date.startsWith('2026-06'))
        .reduce((sum, item) => sum + item.earnings, 0)
  );

  const uniqueProducts = new Set(productionHistory.map((item) => item.productName));
  const productsWorkedOn = Number(rawSummary.productsWorkedOn ?? uniqueProducts.size);

  const summary = {
    totalProductionQty,
    totalEarnings,
    currentMonthEarnings,
    productsWorkedOn,
  };

  // 4. Normalize product summary breakdown
  const rawProdSummary = Array.isArray(rawData.productSummary) ? rawData.productSummary : [];
  let productSummary = rawProdSummary.map((item: any) => {
    const qty = Number(item.quantity ?? item.quantityProduced ?? 0);
    const earn = Number(item.earnings ?? item.totalEarnings ?? 0);
    return {
      productName: item.productName || '',
      quantityProduced: qty,
      totalEarnings: earn,
      contributionPercentage: Number(item.contributionPercentage ?? 0),
    };
  });

  // Calculate contribution percentage if missing or all 0
  const hasContribution = productSummary.some((item) => item.contributionPercentage > 0);
  if (!hasContribution && totalEarnings > 0) {
    productSummary = productSummary.map((item) => ({
      ...item,
      contributionPercentage: Math.round((item.totalEarnings / totalEarnings) * 100),
    }));
  }

  // 5. Generate monthly earnings trend dynamically from history logs
  const numToMonth: { [key: string]: string } = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'May',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Aug',
    '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec',
  };

  const monthlySums: { [key: string]: number } = {};
  const baseMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  baseMonths.forEach((m) => {
    monthlySums[m] = 0;
  });

  productionHistory.forEach((item) => {
    if (item.date && item.date.length >= 7) {
      const monthNum = item.date.substring(5, 7);
      const mName = numToMonth[monthNum];
      if (mName) {
        monthlySums[mName] = (monthlySums[mName] || 0) + item.earnings;
      }
    }
  });

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyEarnings = allMonths
    .filter((m) => baseMonths.includes(m) || (monthlySums[m] && monthlySums[m] > 0))
    .map((m) => ({
      month: m,
      earnings: monthlySums[m] || 0,
    }));

  // 6. Normalize current month product summary
  const rawCurrentMonthProd = Array.isArray(rawData.currentMonthProductSummary) ? rawData.currentMonthProductSummary : [];
  const currentMonthProductSummary = rawCurrentMonthProd.map((item: any) => ({
    productName: item.productName || '',
    quantity: Number(item.quantity ?? 0),
    earnings: Number(item.earnings ?? 0),
  }));

  return {
    success,
    data: {
      employee,
      summary,
      productSummary,
      productionHistory,
      monthlyEarnings,
      currentMonthProductSummary,
    },
  };
}
