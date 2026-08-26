import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Clock, Store, ShieldCheck, Sparkles, Save, Check } from 'lucide-react';

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { setTheme } = useTheme();

  const [settings, setSettings] = useState({
    cafe_name: 'CafeOrder Bistro & Brew',
    cafe_address: 'Jl. Riau No. 45, Bandung',
    tax_rate: '10',
    service_fee: '5',
    default_theme: 'warm',
    midtrans_client_key: 'SB-Mid-client-DEMOKEY123',
    midtrans_server_key: 'SB-Mid-server-DEMOKEY123'
  });

  const [opHours, setOpHours] = useState([
    { day: 0, day_name: 'Minggu', open: '08:00', close: '22:00', is_active: true },
    { day: 1, day_name: 'Senin', open: '08:00', close: '22:00', is_active: true },
    { day: 2, day_name: 'Selasa', open: '08:00', close: '22:00', is_active: true },
    { day: 3, day_name: 'Rabu', open: '08:00', close: '22:00', is_active: true },
    { day: 4, day_name: 'Kamis', open: '08:00', close: '22:00', is_active: true },
    { day: 5, day_name: 'Jumat', open: '08:00', close: '23:00', is_active: true },
    { day: 6, day_name: 'Sabtu', open: '08:00', close: '23:00', is_active: true }
  ]);

  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings((prev) => ({ ...prev, ...data.data }));
          if (data.data.operational_hours) {
            try {
              setOpHours(JSON.parse(data.data.operational_hours));
            } catch (e) {}
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleOpHourChange = (idx, field, val) => {
    setOpHours((prev) => {
      const updated = [...prev];
      updated[idx][field] = val;
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...settings,
        operational_hours: opHours
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setTheme(settings.default_theme);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Pengaturan Jam & Cafe
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Kelola informasi resto, jam buka operasional harian, dan tema default pelanggan.
            </p>
          </div>

          {savedSuccess && (
            <div className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 animate-bounce shadow">
              <Check className="w-4 h-4" />
              <span>Pengaturan Berhasil Disimpan!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Cafe General Info */}
          <div 
            className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              <span>Informasi Utama Cafe & Pajak</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Nama Cafe</label>
                <input
                  type="text"
                  value={settings.cafe_name}
                  onChange={(e) => setSettings({ ...settings, cafe_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Alamat Cafe</label>
                <input
                  type="text"
                  value={settings.cafe_address}
                  onChange={(e) => setSettings({ ...settings, cafe_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Pajak Resto (%)</label>
                <input
                  type="number"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Biaya Layanan / Service Fee (%)</label>
                <input
                  type="number"
                  value={settings.service_fee}
                  onChange={(e) => setSettings({ ...settings, service_fee: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Theme & Aesthetics Setting (KF-30) */}
          <div 
            className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Tema Tampilan Pelanggan (Default Theme)</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { id: 'warm', label: 'Warm Coffee (Khas Cafe)', color: 'bg-amber-500' },
                { id: 'light', label: 'Fresh Light Mode', color: 'bg-sky-500' },
                { id: 'dark', label: 'Sleek Dark Mode', color: 'bg-slate-800' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, default_theme: t.id })}
                  className={`p-4 rounded-2xl border font-bold text-center space-y-2 transition-all ${
                    settings.default_theme === t.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
                      : 'border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${t.color} mx-auto shadow`} />
                  <p>{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Operational Hours Setting (KF-28) */}
          <div 
            className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Jam Operasional Pemesanan (Operational Hours)</span>
            </h3>

            <div className="space-y-3">
              {opHours.map((oh, idx) => (
                <div key={oh.day} className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-xs">
                  <input
                    type="checkbox"
                    checked={oh.is_active}
                    onChange={(e) => handleOpHourChange(idx, 'is_active', e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-[var(--border-color)]"
                  />
                  <span className="w-20 font-bold text-[var(--text-primary)]">{oh.day_name}</span>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="time"
                      value={oh.open}
                      disabled={!oh.is_active}
                      onChange={(e) => handleOpHourChange(idx, 'open', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                    />
                    <span>s/d</span>
                    <input
                      type="time"
                      value={oh.close}
                      disabled={!oh.is_active}
                      onChange={(e) => handleOpHourChange(idx, 'close', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                    />
                  </div>

                  <span className={`font-bold ${oh.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                    {oh.is_active ? 'Buka' : 'Tutup'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors shadow-xl flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>

        </form>

      </div>
    </AdminLayout>
  );
}
