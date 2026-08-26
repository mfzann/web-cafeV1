import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { Coffee, UtensilsCrossed, ShoppingBag, ArrowRight, AlertCircle, Check } from 'lucide-react';

export default function EntryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTableNumber, setOrderType, orderType, tableNumber: contextTable } = useCart();

  const [inputTable, setInputTable] = useState(contextTable || '');
  const [selectedType, setSelectedType] = useState(orderType || 'dine_in');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // KF-01: Auto-detect table query param from QR Code scan (e.g. /order?table=12)
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      const num = parseInt(tableParam, 10);
      if (!isNaN(num)) {
        validateAndProceed(num, 'dine_in');
      }
    }
  }, [searchParams]);

  const validateAndProceed = async (num, type) => {
    setErrorMsg('');
    if (type === 'dine_in') {
      if (!num || isNaN(num) || num <= 0) {
        setErrorMsg('Silakan masukkan nomor meja yang valid.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/public/tables/validate/${num}`);
        const data = await res.json();
        if (data.success) {
          setTableNumber(num);
          setOrderType('dine_in');
          navigate('/order/menu');
        } else {
          setErrorMsg(data.message || `Meja Nomor ${num} tidak ditemukan.`);
        }
      } catch (err) {
        setErrorMsg('Gagal terhubung ke server.');
      } finally {
        setLoading(false);
      }
    } else {
      // Takeaway option
      setOrderType('takeaway');
      setTableNumber('');
      navigate('/order/menu');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validateAndProceed(parseInt(inputTable, 10), selectedType);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-500/10 via-[var(--bg-main)] to-amber-500/5">
      <div className="w-full max-w-md space-y-6">
        
        {/* Cafe Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl mx-auto ring-4 ring-amber-500/20">
            <Coffee className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Selamat Datang di CafeOrder
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
            Sistem pemesanan makanan & minuman berbasis web cepat, mudah, dan tanpa antre.
          </p>
        </div>

        {/* Card Entry Form */}
        <div 
          className="p-6 rounded-2xl shadow-xl border border-[var(--border-color)] space-y-5"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Order Type Selector */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-2">
                Pilihan Tipe Pesanan:
              </label>
              <div className="grid grid-cols-2 gap-3">
                
                <button
                  type="button"
                  onClick={() => setSelectedType('dine_in')}
                  className={`p-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedType === 'dine_in'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  <span>Dine In (Makan di Tempat)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType('takeaway')}
                  className={`p-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedType === 'takeaway'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30'
                      : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Takeaway (Bawa Pulang)</span>
                </button>

              </div>
            </div>

            {/* Table Number Input if Dine In */}
            {selectedType === 'dine_in' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-[var(--text-primary)] block">
                  Nomor Meja Anda:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={inputTable}
                  onChange={(e) => setInputTable(e.target.value)}
                  placeholder="Masukkan Nomor Meja (Contoh: 12)"
                  required
                  className="w-full px-4 py-3 text-center text-lg font-black tracking-wider rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-[var(--text-muted)] text-center">
                  *Nomor meja tercantum pada stiker QR meja anda.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Memvalidasi Meja...</span>
              ) : (
                <>
                  <span>Lihat Menu Cafe</span>
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
