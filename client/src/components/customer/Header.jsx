import React from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Coffee, ShoppingBag, Sun, Moon, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onOpenCart }) {
  const { totalItemCount, orderType, tableNumber, cafeSettings } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-90 border-b border-[var(--border-color)] transition-colors duration-200" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Cafe Logo & Title */}
        <div 
          onClick={() => navigate('/order/menu')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-[var(--text-primary)]">
              {cafeSettings.cafe_name || 'CafeOrder'}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Self Service Order</span>
            </div>
          </div>
        </div>

        {/* Right Section: Table Badge, Theme Toggle & Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Table / Order Type Badge */}
          <button 
            onClick={() => navigate('/order')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {orderType === 'dine_in'
                ? (tableNumber ? `Meja ${tableNumber}` : 'Pilih Meja')
                : 'Takeaway'}
            </span>
          </button>

          {/* Theme Switcher Toggle Button */}
          <button
            onClick={() => toggleTheme()}
            title={`Tema saat ini: ${theme.toUpperCase()} (Klik untuk ganti)`}
            className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            {theme === 'warm' && <Sparkles className="w-4 h-4 text-amber-500" />}
            {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* Cart Icon Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-bounce">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
