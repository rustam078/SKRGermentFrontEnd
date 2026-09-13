import axiosInstance from './axios';
import { IProductionEntry, IProductionFilter } from '../types/production';

/**
 * Service to handle Production API endpoints.
 */
export const productionService = {
  /**
   * Fetch production entries.
   * GET /api/production?employeeId=xxx&fromDate=xxx&toDate=xxx&productId=xxx&pieceCodeId=xxx
   */
  getProduction: async (filters: IProductionFilter = {}) => {
    const params: any = {};
    if (filters.employeeId) params.employeeId = filters.employeeId;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.productId) params.productId = filters.productId;
    if (filters.pieceCodeId) params.pieceCodeId = filters.pieceCodeId;

    const response = await axiosInstance.get('/production', { params });
    return response.data;
  },

  /**
   * Create a new production entry (Piece Code based pricing).
   * POST /api/production
   */
  createProduction: async (entry: {
    employeeId: string;
    productionDate: string;
    remarks?: string;
    items: {
      productId: string;
      pieceCodeId: string;
      quantity: number;
      rate: number;
      amount: number;
    }[];
  }) => {
    const response = await axiosInstance.post('/production', entry);
    return response.data;
  },

  /**
   * Delete a production entry.
   * DELETE /api/production/{id}
   */
  deleteProduction: async (id: string) => {
    const response = await axiosInstance.delete(`/production/${id}`);
    return response.data;
  },

  /**
   * Download production report as a backend-generated PDF (HTML template based).
   * GET /api/production/{id}/pdf
   */
  downloadProductionPdf: async (id: string) => {
    const response = await axiosInstance.get(`/production/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `production-report-${id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Download production report as a backend-generated Excel file.
   * GET /api/production/{id}/excel
   */
  downloadProductionExcel: async (id: string) => {
    const response = await axiosInstance.get(`/production/${id}/excel`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `production-report-${id}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
