import React, { useState } from 'react';
import Header from '../../components/customer/Header.jsx';
import SimulatedPaymentModal from '../../components/customer/SimulatedPaymentModal.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatRupiah } from '../../utils/formatters.js';
import { ShoppingBag, MapPin, User, ArrowLeft, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const {
    cartItems,
    orderType,
    tableNumber,
    customerName,
    setCustomerName,
    subtotal,
    taxAmount,
    serviceAmount,
    grandTotal,
    cafeSettings,
    clearCart
  } = useCart();

  const navigate = useNavigate();

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);

  if (cartItems.length === 0 && !createdOrderData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="font-bold text-lg text-[var(--text-primary)]">Keranjang Anda Kosong</h2>
          <button
            onClick={() => navigate('/order/menu')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (orderType === 'dine_in' && !tableNumber) {
      alert('Nomor meja belum diisi! Silakan kembali ke halaman awal.');
      navigate('/order');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_name: customerName || (orderType === 'dine_in' ? `Pelanggan Meja ${tableNumber}` : 'Pelanggan Takeaway'),
        table_number: orderType === 'dine_in' ? tableNumber : null,
        order_type: orderType,
        notes,
        items: cartItems.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          note: item.note
        }))
      };

      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setCreatedOrderData(data.data);
        clearCart();

        // If Midtrans Snap is loaded globally in window, try snap.pay()
        if (window.snap && data.data.snap_token && !data.data.is_simulated) {
          window.snap.pay(data.data.snap_token, {
            onSuccess: function (result) {
              navigate(`/order/confirmation/${data.data.order_id}`);
            },
            onPending: function (result) {
              navigate(`/order/confirmation/${data.data.order_id}`);
            },
            onError: function (result) {
              alert('Pembayaran gagal atau dibatalkan.');
            },
            onClose: function () {
              setShowSimulatedModal(true);
            }
          });
        } else {
          // Open simulated modal popup
          setShowSimulatedModal(true);
        }
      } else {
        alert(data.message || 'Gagal membuat pesanan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedSuccess = (updatedOrder) => {
    setShowSimulatedModal(false);
    navigate(`/order/confirmation/${updatedOrder.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <Header onOpenCart={() => navigate('/order/menu')} />

      <main className="max-w-2xl mx-auto px-4 py-6 w-full space-y-6">
        
        {/* Navigation back */}
        <button
          onClick={() => navigate('/order/menu')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali Pilih Menu</span>
        </button>

        <h2 className="text-xl font-black text-[var(--text-primary)]">Ringkasan & Pembayaran</h2>

        <form onSubmit={handleCheckout} className="space-y-5">
          
          {/* Order Details Card */}
          <div 
            className="p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
              Informasi Pemesan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                <span className="font-medium text-[var(--text-muted)] block text-[10px]">Tipe Pesanan</span>
                <span className="font-bold text-sm flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  {orderType === 'dine_in' ? `Dine In (Meja ${tableNumber})` : 'Takeaway (Bawa Pulang)'}
                </span>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Nama Pemesan (Opsional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama anda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Items Summary Card */}
          <div 
            className="p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">
              Rincian Item Pesanan
            </h3>

            <div className="space-y-3 divide-y divide-[var(--border-color)]">
              {cartItems.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    {item.note && (
                      <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                        Catatan: "{item.note}"
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatRupiah(item.menuItem.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-[var(--border-color)] space-y-2 text-xs text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Subtotal Menu</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatRupiah(subtotal)}</span>
              </div>
              {cafeSettings.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span>Pajak Resto ({cafeSettings.tax_rate}%)</span>
                  <span className="font-semibold text-[var(--text-primary)]">{formatRupiah(taxAmount)}</span>
                </div>
              )}
              {cafeSettings.service_fee > 0 && (
                <div className="flex justify-between">
                  <span>Biaya Layanan ({cafeSettings.service_fee}%)</span>
                  <span className="font-semibold text-[var(--text-primary)]">{formatRupiah(serviceAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[var(--border-color)] flex justify-between text-base font-black text-[var(--text-primary)]">
                <span>Total Bayar</span>
                <span className="text-amber-600 dark:text-amber-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Info Badge */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
            <ShieldCheck className="w-6 h-6 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Pembayaran Aman via Midtrans Payment Gateway</p>
              <p className="text-[11px] opacity-90 mt-0.5">Mendukung QRIS (GoPay/ShopeePay), Virtual Account (BCA/Mandiri/BNI), & Kartu Debit/Kredit.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-amber-500 text-white font-black text-base hover:bg-amber-600 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Membuat Pesanan...</span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Bayar Sekarang ({formatRupiah(grandTotal)})</span>
              </>
            )}
          </button>

        </form>

      </main>

      {/* Simulated Payment Modal fallback */}
      {showSimulatedModal && createdOrderData && (
        <SimulatedPaymentModal
          orderId={createdOrderData.order_id}
          grandTotal={createdOrderData.total_amount}
          onClose={() => setShowSimulatedModal(false)}
          onSuccess={handleSimulatedSuccess}
        />
      )}
    </div>
  );
}
