import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/customer/Header.jsx';
import SimulatedPaymentModal from '../../components/customer/SimulatedPaymentModal.jsx';
import { formatRupiah, formatDate } from '../../utils/formatters.js';
import { CheckCircle2, Clock, Utensils, Sparkles, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import io from 'socket.io-client';

export default function ConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);

  // Fetch Order details
  const fetchOrderDetails = () => {
    fetch(`/api/public/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.data);
          if (data.data.status === 'ready' || data.data.status === 'completed') {
            fireConfetti();
          }
        }
      })
      .catch((err) => console.error('Failed to load order:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrderDetails();

    // Socket.IO real-time status updates
    const socket = io();
    socket.emit('join_order', orderId);

    socket.on('status_changed', (data) => {
      if (data && data.order) {
        setOrder((prev) => ({
          ...prev,
          status: data.order.status,
          payment_status: data.order.payment_status,
          updated_at: data.order.updated_at
        }));

        if (data.order.status === 'ready' || data.order.status === 'completed') {
          fireConfetti();
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <h2 className="font-bold text-lg text-[var(--text-primary)]">Pesanan Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/order/menu')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs"
        >
          Kembali ke Menu
        </button>
      </div>
    );
  }

  // Helper status steppers
  const steps = [
    { key: 'paid', label: 'Pesanan Diterima', desc: 'Pembayaran telah dikonfirmasi' },
    { key: 'processing', label: 'Sedang Dimasak', desc: 'Dapur sedang menyiapkan pesanan' },
    { key: 'ready', label: 'Siap Disajikan', desc: 'Pesanan anda siap diambil/diantar!' },
    { key: 'completed', label: 'Selesai', desc: 'Terima kasih telah berkunjung!' }
  ];

  const getStepIndex = (st) => {
    if (st === 'pending') return -1;
    if (st === 'paid') return 0;
    if (st === 'processing') return 1;
    if (st === 'ready') return 2;
    if (st === 'completed') return 3;
    return -1;
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <Header onOpenCart={() => navigate('/order/menu')} />

      <main className="max-w-xl mx-auto px-4 py-8 w-full space-y-6">
        
        {/* Success Header Card */}
        <div 
          className="p-6 rounded-3xl border border-[var(--border-color)] shadow-xl text-center space-y-3 relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Order ID: #{order.id}</span>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mt-0.5">
              {order.payment_status === 'settlement' || order.status !== 'pending'
                ? 'Pesanan Berhasil Dibuat!'
                : 'Menunggu Pembayaran'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {order.order_type === 'dine_in'
                ? `Makan di Tempat - Meja ${order.table_number}`
                : 'Bawa Pulang (Takeaway)'}
            </p>
          </div>

          {/* Pay Button if still pending */}
          {order.payment_status === 'pending' && (
            <div className="pt-2">
              <button
                onClick={() => setShowSimulatedModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulasi / Bayar Sekarang ({formatRupiah(order.total_amount)})</span>
              </button>
            </div>
          )}
        </div>

        {/* Real-time Order Progress Tracker */}
        <div 
          className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Status Pesanan Real-time</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-pulse">
              Live Tracker
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border-color)]">
            {steps.map((step, idx) => {
              const isPassed = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed
                        ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-500/20'
                        : isCurrent
                        ? 'bg-amber-500 text-white shadow-md animate-pulse ring-4 ring-amber-500/20'
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-amber-600 dark:text-amber-400'
                          : isPassed
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items Detail Card */}
        <div 
          className="p-6 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-4"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
            Rincian Makanan & Minuman
          </h3>

          <div className="space-y-3 divide-y divide-[var(--border-color)]">
            {order.items?.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex justify-between items-start text-xs">
                <div>
                  <span className="font-bold text-[var(--text-primary)]">
                    {item.quantity}x {item.item_name}
                  </span>
                  {item.note && (
                    <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                      Catatan: "{item.note}"
                    </p>
                  )}
                </div>
                <span className="font-bold text-[var(--text-primary)]">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-color)] flex justify-between text-sm font-black text-[var(--text-primary)]">
            <span>Total Pembayaran</span>
            <span className="text-amber-600 dark:text-amber-400">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/order/menu')}
          className="w-full py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] font-bold text-xs text-[var(--text-primary)] hover:bg-black/10 transition-colors"
        >
          Pesan Tambahan / Kembali ke Menu
        </button>

      </main>

      {/* Simulated Payment Modal if triggered */}
      {showSimulatedModal && (
        <SimulatedPaymentModal
          orderId={order.id}
          grandTotal={order.total_amount}
          onClose={() => setShowSimulatedModal(false)}
          onSuccess={(updated) => {
            setShowSimulatedModal(false);
            fetchOrderDetails();
          }}
        />
      )}
    </div>
  );
}
