import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Customer Pages
import EntryPage from './pages/customer/EntryPage.jsx';
import MenuPage from './pages/customer/MenuPage.jsx';
import CheckoutPage from './pages/customer/CheckoutPage.jsx';
import ConfirmationPage from './pages/customer/ConfirmationPage.jsx';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMenuPage from './pages/admin/AdminMenuPage.jsx';
import AdminTablesPage from './pages/admin/AdminTablesPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';

// Protected Route Wrapper for Admin Panel
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Navigate to="/order" replace />} />
            <Route path="/order" element={<EntryPage />} />
            <Route path="/order/menu" element={<MenuPage />} />
            <Route path="/order/checkout" element={<CheckoutPage />} />
            <Route path="/order/confirmation/:orderId" element={<ConfirmationPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedAdminRoute>
                  <AdminMenuPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <ProtectedAdminRoute>
                  <AdminTablesPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedAdminRoute>
                  <AdminSettingsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedAdminRoute>
                  <AdminReportsPage />
                </ProtectedAdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/order" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
