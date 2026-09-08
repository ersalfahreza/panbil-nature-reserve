import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  CalendarCheck,
  Activity,
  CalendarDays,
  DollarSign,
  Users,
  CreditCard,
  BadgePercent,
  BarChart3,
  Shield,
  Settings,
} from 'lucide-react';

import './index.css';

import { AuthProvider } from '@/features/auth/context/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';

import RootLayout from '@/layouts/RootLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import StaffLayout from '@/layouts/StaffLayout';
import AdminLayout from '@/layouts/AdminLayout';
import BookingCheckoutPage from '@/pages/public/BookingCheckoutPage';
import BookingSuccessPage from '@/pages/public/BookingSuccessPage';

// Public pages
import HomePage from '@/pages/public/HomePage';
import ActivitiesPage from '@/pages/public/ActivitiesPage';
import ActivityDetailPage from '@/pages/public/ActivityDetailPage';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Customer pages
import CustomerDashboardPage from '@/pages/customer/CustomerDashboardPage';
import CustomerBookingsPage from '@/pages/customer/CustomerBookingsPage';
import BookingDetailPage from '@/pages/customer/BookingDetailPage';
import CustomerTicketsPage from '@/pages/customer/CustomerTicketsPage';
import CustomerProfilePage from '@/pages/customer/CustomerProfilePage';

// Staff pages
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage';
import StaffCheckinPage from '@/pages/staff/StaffCheckinPage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminPlaceholderPage from '@/pages/admin/AdminPlaceholderPage';

function App() {
  return (
    <Routes>
      {/* =========================================================
          PUBLIC / ROOT
          ========================================================= */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route
          path="/activities/:slug"
          element={<ActivityDetailPage />}
        />
        <Route
          path="/booking/checkout"
          element={<BookingCheckoutPage />}
        />
        <Route
          path="/booking/success/:bookingId"
          element={<BookingSuccessPage />}
        />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
      </Route>

      {/* =========================================================
          CUSTOMER
          ========================================================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<CustomerDashboardPage />}
        />
        <Route
          path="/dashboard/bookings"
          element={<CustomerBookingsPage />}
        />
        <Route
          path="/dashboard/bookings/:bookingId"
          element={<BookingDetailPage />}
        />
        <Route
          path="/dashboard/tickets"
          element={<CustomerTicketsPage />}
        />
        <Route
          path="/dashboard/profile"
          element={<CustomerProfilePage />}
        />
      </Route>

      {/* =========================================================
          STAFF
          ========================================================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/staff"
          element={<StaffDashboardPage />}
        />
        <Route
          path="/staff/check-in"
          element={<StaffCheckinPage />}
        />
      </Route>

      {/* =========================================================
    ADMIN / SUPER ADMIN
    ========================================================= */}
<Route
  element={
    <ProtectedRoute
      allowedRoles={['ADMIN', 'SUPER_ADMIN']}
    >
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route
    path="/admin"
    element={<AdminDashboardPage />}
  />

  {/* Booking */}
  <Route
    path="/admin/bookings"
    element={
      <AdminPlaceholderPage
        title="Reservasi"
        description="Kelola dan pantau seluruh reservasi pelanggan."
        icon={CalendarCheck}
      />
    }
  />

  {/* Catalog */}
  <Route
    path="/admin/activities"
    element={
      <AdminPlaceholderPage
        title="Aktivitas"
        description="Kelola aktivitas yang tersedia di Panbil Nature Reserve."
        icon={Activity}
      />
    }
  />

  <Route
    path="/admin/schedules"
    element={
      <AdminPlaceholderPage
        title="Jadwal"
        description="Kelola jadwal dan kapasitas aktivitas."
        icon={CalendarDays}
      />
    }
  />

  <Route
    path="/admin/pricing"
    element={
      <AdminPlaceholderPage
        title="Harga"
        description="Kelola harga tiket dan tarif aktivitas."
        icon={DollarSign}
      />
    }
  />

  {/* Management */}
  <Route
    path="/admin/customers"
    element={
      <AdminPlaceholderPage
        title="Pelanggan"
        description="Kelola data pelanggan Panbil Nature Reserve."
        icon={Users}
      />
    }
  />

  <Route
    path="/admin/payments"
    element={
      <AdminPlaceholderPage
        title="Pembayaran"
        description="Kelola dan pantau transaksi pembayaran."
        icon={CreditCard}
      />
    }
  />

  <Route
    path="/admin/promos"
    element={
      <AdminPlaceholderPage
        title="Promo"
        description="Kelola kode promo dan diskon."
        icon={BadgePercent}
      />
    }
  />

  <Route
    path="/admin/reports"
    element={
      <AdminPlaceholderPage
        title="Laporan"
        description="Lihat laporan reservasi, pembayaran, dan aktivitas."
        icon={BarChart3}
      />
    }
  />

  {/* Super Admin */}
  <Route
    path="/admin/users"
    element={
      <AdminPlaceholderPage
        title="User Management"
        description="Kelola akun pengguna dan hak akses sistem."
        icon={Shield}
      />
    }
  />

  <Route
    path="/admin/settings"
    element={
      <AdminPlaceholderPage
        title="Pengaturan"
        description="Kelola konfigurasi sistem Panbil Nature Reserve."
        icon={Settings}
      />
    }
  />
</Route>
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);