import React from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, MapPin } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters.js';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose }) {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    taxAmount,
    serviceAmount,
    grandTotal,
    orderType,
    tableNumber,
    cafeSettings
  } = useCart();

  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleProceedCheckout = () => {
    onClose();
    navigate('/order/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className="fixed inset-y-0 right-0 max-w-full flex pl-10 w-full md:max-w-md animate-slide-left"
      >
        <div 
          className="w-full flex flex-col shadow-2xl border-l border-[var(--border-color)]"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-lg text-[var(--text-primary)]">Keranjang Pesanan</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table / Order Type Summary */}
          <div className="bg-amber-500/10 px-5 py-2.5 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>Tipe Pesanan: <strong>{orderType === 'dine_in' ? 'Makan di Tempat (Dine In)' : 'Bawa Pulang (Takeaway)'}</strong></span>
            </div>
            {orderType === 'dine_in' && (
              <span className="font-bold px-2 py-0.5 rounded bg-amber-500 text-white">
                Meja {tableNumber || '-'}
              </span>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] space-y-3 py-12">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-base text-[var(--text-primary)]">Keranjang Masih Kosong</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Pilih menu favoritmu dari daftar menu cafe.</p>
                </div>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div
                  key={`${item.menuItem.id}-${idx}`}
                  className="p-3 rounded-xl border border-[var(--border-color)] flex gap-3 items-center bg-black/5 dark:bg-white/5"
                >
                  <img
                    src={item.menuItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                      {item.menuItem.name}
                    </h4>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatRupiah(item.menuItem.price)}
                    </p>
                    {item.note && (
                      <p className="text-xs text-[var(--text-muted)] italic truncate mt-0.5">
                        "{item.note}"
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-[var(--border-color)] rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-[var(--text-primary)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-primary)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-red-500 hover:text-red-600 p-1 text-xs transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Calculations & Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-black/5 dark:bg-white/5 space-y-3">
              <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
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
                <div className="pt-2 border-t border-[var(--border-color)] flex justify-between text-base font-extrabold text-[var(--text-primary)]">
                  <span>Total Pembayaran</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedCheckout}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
