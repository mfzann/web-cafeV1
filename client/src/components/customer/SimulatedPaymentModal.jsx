import React, { useState } from 'react';
import { X, QrCode, CreditCard, Landmark, Wallet, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters.js';

export default function SimulatedPaymentModal({ orderId, grandTotal, onClose, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState('qris');
  const [loading, setLoading] = useState(false);

  const handleSimulatePay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/orders/${orderId}/simulate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_type: selectedMethod === 'qris' ? 'QRIS (Gopay/OVO/ShopeePay)' : selectedMethod === 'bca_va' ? 'BCA Virtual Account' : 'Credit Card',
          payment_status: 'settlement'
        })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      } else {
        alert(data.message || 'Gagal memproses pembayaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-color)]"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-base leading-none">Midtrans Payment Simulator</h3>
              <p className="text-[10px] opacity-90 mt-0.5">Sandbox Mode - Pengujian Pembayaran Online</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs text-[var(--text-muted)] font-medium">Total Tagihan Pesanan #{orderId}</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {formatRupiah(grandTotal)}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-2">
              Pilih Metode Pembayaran Simulasi:
            </label>
            <div className="space-y-2">
              
              {/* QRIS */}
              <div 
                onClick={() => setSelectedMethod('qris')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  selectedMethod === 'qris'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">QRIS (Gopay / ShopeePay / OVO / Dana)</p>
                  <p className="text-xs text-[var(--text-muted)]">Scan QR langsung bayar</p>
                </div>
                {selectedMethod === 'qris' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </div>

              {/* Virtual Account */}
              <div 
                onClick={() => setSelectedMethod('bca_va')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  selectedMethod === 'bca_va'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Virtual Account (BCA / Mandiri / BNI)</p>
                  <p className="text-xs text-[var(--text-muted)]">Bayar via m-Banking</p>
                </div>
                {selectedMethod === 'bca_va' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </div>

              {/* Credit Card */}
              <div 
                onClick={() => setSelectedMethod('cc')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  selectedMethod === 'cc'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-primary)]'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Kartu Kredit / Debit Online</p>
                  <p className="text-xs text-[var(--text-muted)]">Visa / Mastercard 3D Secure</p>
                </div>
                {selectedMethod === 'cc' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </div>

            </div>
          </div>

          <button
            onClick={handleSimulatePay}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memproses Pembayaran...' : `Konfirmasi Pembayaran ${formatRupiah(grandTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
