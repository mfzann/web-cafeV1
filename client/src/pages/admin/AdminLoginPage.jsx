import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        login(data.token, data.admin);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-500/10 via-[var(--bg-main)] to-amber-500/5">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl mx-auto ring-4 ring-amber-500/20">
            <Coffee className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Login Staf Admin / Kasir
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Sistem Kelola Pesanan Cafe & Cetak Struk Real-time
          </p>
        </div>

        {/* Login Form Container */}
        <div 
          className="p-6 sm:p-8 rounded-3xl shadow-xl border border-[var(--border-color)] space-y-5"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-transparent text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-transparent text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Seed Demo Hint */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
              <span className="font-bold">Akun Default Demo:</span><br />
              <div className="mt-1">
                Admin: <code className="font-bold">admin</code> | Pass: <code className="font-bold">admin123</code><br/>
                Kasir/User: <code className="font-bold">user</code> | Pass: <code className="font-bold">user123</code>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses Login...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
