import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, MessageSquare } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters.js';

export default function MenuItemModal({ item, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all border border-[var(--border-color)]"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Item Image & Banner */}
        <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
          <img
            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="absolute bottom-3 left-3 px-3 py-1 text-xs font-medium rounded-full bg-black/60 text-white backdrop-blur-md">
            {item.category}
          </span>
        </div>

        {/* Modal Details */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-xl text-[var(--text-primary)]">{item.name}</h3>
              <span className="font-extrabold text-lg text-amber-600 dark:text-amber-400">
                {formatRupiah(item.price)}
              </span>
            </div>
            {item.description && (
              <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Catatan Khusus (Opsional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Level pedas 2, Es sedikit, Dll."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Quantity Selector & Action Button */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 p-1.5 rounded-xl border border-[var(--border-color)]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-[var(--text-primary)] disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-base text-[var(--text-primary)]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-[var(--text-primary)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!item.is_available}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tambah ({formatRupiah(item.price * quantity)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
