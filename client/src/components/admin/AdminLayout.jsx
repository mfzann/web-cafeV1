import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Settings,
  BarChart3,
  LogOut,
  Coffee,
  Sun,
  Moon,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard Pesanan', icon: LayoutDashboard },
    { to: '/admin/menu', label: 'Manajemen Menu', icon: UtensilsCrossed, roles: ['admin'] },
    { to: '/admin/tables', label: 'Data Meja & QR', icon: QrCode },
    { to: '/admin/reports', label: 'Laporan Penjualan', icon: BarChart3, roles: ['admin'] },
    { to: '/admin/settings', label: 'Pengaturan Jam & Cafe', icon: Settings, roles: ['admin'] }
  ].filter(item => !item.roles || item.roles.includes(admin?.role));

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)]">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">Admin CafeOrder</h2>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                Dashboard Kasir v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Staff Profile & Logout */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="font-bold text-[var(--text-primary)] truncate">{admin?.name || 'Kasir Staf'}</p>
                <p className="text-[10px] text-[var(--text-muted)] capitalize">{admin?.role || 'admin'}</p>
              </div>
            </div>

            <button
              onClick={() => toggleTheme()}
              title="Ganti Tema Tampilan"
              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {theme === 'warm' && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header Bar */}
        <header className="md:hidden p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-500" />
            <h1 className="font-bold text-base">CafeOrder Admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold"
          >
            Logout
          </button>
        </header>

        {/* Mobile Sub Navigation Tabs */}
        <nav className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border-color)] flex overflow-x-auto no-scrollbar p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                    isActive ? 'text-amber-500 border-b-2 border-amber-500' : 'text-[var(--text-muted)]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
