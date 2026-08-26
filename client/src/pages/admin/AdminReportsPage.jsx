import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatRupiah } from '../../utils/formatters.js';
import { BarChart3, TrendingUp, ShoppingBag, UtensilsCrossed, Award, DollarSign } from 'lucide-react';

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReportData(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-[var(--text-muted)]">Memuat data laporan...</div>
      </AdminLayout>
    );
  }

  const {
    total_revenue = 0,
    total_orders = 0,
    completed_orders = 0,
    dine_in_count = 0,
    takeaway_count = 0,
    top_items = [],
    daily_stats = []
  } = reportData || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Laporan Penjualan & Analitik
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Ringkasan omset cafe, jumlah transaksi, dan menu terlaris.
          </p>
        </div>

        {/* Top Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            className="p-5 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-2"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-semibold">
              <span>Total Omset Pembayaran</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatRupiah(total_revenue)}
            </div>
          </div>

          <div 
            className="p-5 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-2"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-semibold">
              <span>Total Pesanan Masuk</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]">
              {total_orders} Pesanan
            </div>
          </div>

          <div 
            className="p-5 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-2"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-semibold">
              <span>Dine In (Makan di Tempat)</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]">
              {dine_in_count} ({total_orders > 0 ? Math.round((dine_in_count / total_orders) * 100) : 0}%)
            </div>
          </div>

          <div 
            className="p-5 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-2"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-semibold">
              <span>Takeaway (Bawa Pulang)</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]">
              {takeaway_count} ({total_orders > 0 ? Math.round((takeaway_count / total_orders) * 100) : 0}%)
            </div>
          </div>

        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top 5 Best Sellers */}
          <div 
            className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>5 Menu Terlaris (Top Selling Items)</span>
            </h3>

            <div className="space-y-3">
              {top_items.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Belum ada data transaksi menu.</p>
              ) : (
                top_items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{item.item_name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{item.total_qty} Porsi Terjual</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      {formatRupiah(item.total_revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Revenue Breakdown */}
          <div 
            className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Penjualan Harian 7 Hari Terakhir</span>
            </h3>

            <div className="space-y-3">
              {daily_stats.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Belum ada transaksi dalam 7 hari terakhir.</p>
              ) : (
                daily_stats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border-color)] text-xs">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{stat.date}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{stat.orders} Transaksi Lunas</p>
                    </div>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(stat.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
