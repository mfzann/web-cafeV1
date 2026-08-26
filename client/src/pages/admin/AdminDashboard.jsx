import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ThermalReceipt from '../../components/admin/ThermalReceipt.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatRupiah, formatDate, playOrderSound } from '../../utils/formatters.js';
import {
  Bell,
  Printer,
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  MapPin,
  RefreshCw,
  AlertCircle,
  Check,
  XCircle,
  Volume2
} from 'lucide-react';
import io from 'socket.io-client';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'paid', 'processing', 'ready', 'completed'
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [cafeSettings, setCafeSettings] = useState({});
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  // Load orders & cafe settings
  const fetchOrders = () => {
    fetch(`/api/admin/orders?status=${activeTab}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.data);
        }
      })
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    // Fetch settings for print receipt
    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCafeSettings(data.data);
      });

    // Real-time Socket.IO connection
    const socket = io();
    socket.emit('join_admin');

    socket.on('new_order', (payload) => {
      console.log('New Order Received via Socket:', payload);
      playOrderSound();
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 5000);
      fetchOrders();
    });

    socket.on('order_updated', () => {
      fetchOrders();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeTab]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message || 'Gagal mengubah status.');
      }
    } catch (err) {
      alert('Gagal terhubung ke server.');
    }
  };

  const handlePrint = (order) => {
    setSelectedPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (status === 'pending') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
          Menunggu Bayar
        </span>
      );
    }
    if (status === 'paid') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse">
          Baru (Lunas)
        </span>
      );
    }
    if (status === 'processing') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
          Sedang Dimasak
        </span>
      );
    }
    if (status === 'ready') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          Siap Disajikan
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">
          Selesai
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
        Dibatalkan
      </span>
    );
  };

  return (
    <AdminLayout>
      {/* Hidden thermal receipt for print */}
      <ThermalReceipt order={selectedPrintOrder} settings={cafeSettings} />

      <div className="space-y-6">
        
        {/* Page Title & Notification chime indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Dashboard Pesanan Masuk
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Kelola pesanan real-time dari meja pelanggan dan cetak struk kasir/dapur.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {newOrderAlert && (
              <div className="px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-2 animate-bounce shadow-lg">
                <Bell className="w-4 h-4" />
                <span>Pesanan Baru Masuk!</span>
              </div>
            )}

            <button
              onClick={() => playOrderSound()}
              className="p-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Tes Suara Notifikasi"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Tes Chime</span>
            </button>

            <button
              onClick={fetchOrders}
              className="p-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'all', label: 'Semua Pesanan' },
            { id: 'paid', label: 'Pesanan Baru (Lunas)' },
            { id: 'processing', label: 'Sedang Dimasak' },
            { id: 'ready', label: 'Siap Disajikan' },
            { id: 'completed', label: 'Selesai' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Kanban Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-3xl space-y-2">
            <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <p className="font-bold text-base text-[var(--text-primary)]">Belum Ada Pesanan</p>
            <p className="text-xs text-[var(--text-muted)]">
              Pesanan pelanggan yang masuk akan tampil di halaman ini secara otomatis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-[var(--border-color)] p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <div className="space-y-3">
                  {/* Order Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <div>
                      <span className="font-black text-sm text-[var(--text-primary)] block">
                        #{order.id}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    {getStatusBadge(order.status, order.payment_status)}
                  </div>

                  {/* Customer & Location info */}
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {order.order_type === 'dine_in'
                          ? `Meja ${order.table_number}`
                          : 'Takeaway'}
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)] truncate max-w-[120px]">
                      {order.customer_name || 'Pelanggan'}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-2 text-xs">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-[var(--text-primary)]">
                            {item.quantity}x {item.item_name}
                          </span>
                          {item.note && (
                            <p className="text-[10px] text-[var(--text-muted)] italic">
                              * {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-[var(--text-primary)]">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Payment method */}
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-[var(--text-muted)] font-medium">
                      Total ({order.payment_type || 'Online'})
                    </span>
                    <span className="font-black text-base text-amber-600 dark:text-amber-400">
                      {formatRupiah(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Actions: Status Steppers & Print Receipt */}
                <div className="pt-2 border-t border-[var(--border-color)] flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(order)}
                    className="p-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center"
                    title="Cetak Struk Thermal Kasir/Dapur"
                  >
                    <Printer className="w-4 h-4 text-amber-500" />
                  </button>

                  {/* Status Progress Button */}
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'processing')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Proses ke Dapur</span>
                    </button>
                  )}

                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tandai Siap</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs hover:bg-slate-900 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Selesaikan Pesanan</span>
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'paid')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                    >
                      Konfirmasi Bayar Tunai
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
