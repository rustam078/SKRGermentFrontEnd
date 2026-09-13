import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

// Import Pages
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductionPage from '../pages/production/ProductionPage';
import ProductionHistoryPage from '../pages/production/ProductionHistoryPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import InventoryDetailsPage from '../pages/inventory/InventoryDetailsPage';
import ProductsPage from '../pages/products/ProductsPage';
import ProductDetailsPage from '../pages/products/ProductDetailsPage';
import InvestmentPage from '../pages/investment/InvestmentPage';
import EmployeePage from '../pages/employees/EmployeePage';
import EmployeeDetailsPage from '../pages/employees/EmployeeDetailsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import VendorDetailsPage from '../pages/vendors/VendorDetailsPage';
import SalesDashboard from '../modules/sales/pages/SalesDashboard';
import CreateSale from '../modules/sales/pages/CreateSale';
import SalesList from '../modules/sales/pages/SalesList';
import SaleDetails from '../modules/sales/pages/SaleDetails';
import InvoicePreview from '../modules/sales/pages/InvoicePreview';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Publicly Accessible Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Enterprise Pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Index Route redirecting to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Main Modules */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/production-history" element={<ProductionHistoryPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/:productId" element={<InventoryDetailsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route path="/investment" element={<InvestmentPage />} />
          <Route path="/vendors/:id" element={<VendorDetailsPage />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/sales/dashboard" element={<SalesDashboard />} />
          <Route path="/sales/new" element={<CreateSale />} />
          <Route path="/sales/list" element={<SalesList />} />
          <Route path="/sales/:saleId" element={<SaleDetails />} />
          <Route path="/print/invoice/:saleId" element={<InvoicePreview />} />
          <Route path="/employees" element={<EmployeePage />} />
          <Route path="/employees/:employeeId" element={<EmployeeDetailsPage />} />
          {/* Reports module removed — its important reports now live on the Dashboard */}
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
