import axiosInstance from '../../../services/axios';

const salesService = {
  getDashboard: async () => {
    const response = await axiosInstance.get('/sales/dashboard');
    return response.data;
  },

  getRecentSales: async () => {
    const response = await axiosInstance.get('/sales/recent');
    return response.data;
  },

  getTopProducts: async () => {
    const response = await axiosInstance.get('/sales/top-products');
    return response.data;
  },

  getLowStockAlerts: async () => {
    const response = await axiosInstance.get('/inventory/alerts');
    return response.data;
  },

  createSale: async (salePayload) => {
    const response = await axiosInstance.post('/sales', salePayload);
    return response.data;
  },

  getSales: async (params) => {
    const response = await axiosInstance.get('/sales', { params });
    return response.data;
  },

  getSaleById: async (saleId) => {
    const response = await axiosInstance.get(`/sales/${saleId}`);
    return response.data;
  },

  getInvoicePreview: async (saleId) => {
    const response = await axiosInstance.get(`/sales/${saleId}/invoice`);
    return response.data;
  },

  /**
   * Download the backend-generated invoice PDF (HTML template based).
   * GET /api/sales/{saleId}/invoice/pdf
   */
  downloadInvoicePdf: async (saleId) => {
    const response = await axiosInstance.get(`/sales/${saleId}/invoice/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${saleId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

export default salesService;
