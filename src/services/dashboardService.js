import axiosInstance from './axios';

/**
 * Dashboard service — fetches the aggregated overview (sales, production,
 * investment, inventory, workforce) for an optional date range.
 */
export const dashboardService = {
  /**
   * @param {string} [fromDate] ISO date (YYYY-MM-DD)
   * @param {string} [toDate]   ISO date (YYYY-MM-DD)
   */
  getOverview: async (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const res = await axiosInstance.get('/dashboard/overview', { params });
    return res.data?.data ?? res.data;
  },
};

export default dashboardService;
