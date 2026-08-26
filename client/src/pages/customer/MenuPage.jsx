import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/customer/Header.jsx';
import MenuItemModal from '../../components/customer/MenuItemModal.jsx';
import CartDrawer from '../../components/customer/CartDrawer.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { formatRupiah } from '../../utils/formatters.js';
import { Search, ShoppingBag, Clock, AlertTriangle, Plus, Check } from 'lucide-react';

export default function MenuPage() {
  const { addToCart, totalItemCount, cafeSettings } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch Menu from API
  useEffect(() => {
    fetch('/api/public/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMenuItems(data.data);
        }
      })
      .catch((err) => console.error('Failed to load menu:', err))
      .finally(() => setLoading(false));
  }, []);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set(['Semua']);
    menuItems.forEach((item) => set.add(item.category));
    return Array.from(set);
  }, [menuItems]);

  // Filter menu items by search and category
  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const isClosed = !cafeSettings?.operational_status?.isOpen;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Navigation Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Operational Closed Banner Notice (KF-07) */}
      {isClosed && (
        <div className="bg-red-500 text-white px-4 py-3 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-inner">
          <Clock className="w-4 h-4 shrink-0 animate-spin" />
          <span>{cafeSettings.operational_status.message || 'Pemesanan Sedang Ditutup (Luar Jam Operasional).'}</span>
        </div>
      )}

      {/* Search & Category Filter Section */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 w-full space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari makanan, minuman, atau dessert..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
        </div>

        {/* Category Horizontal Scroll Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-amber-500/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 py-4 w-full flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)] space-y-2">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="font-bold text-base text-[var(--text-primary)]">Menu tidak ditemukan</p>
            <p className="text-xs">Coba ubah kata kunci pencarian atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <div>
                  {/* Image container */}
                  <div 
                    onClick={() => item.is_available && !isClosed && setActiveModalItem(item)}
                    className="relative h-44 w-full bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                      alt={item.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                        !item.is_available ? 'grayscale opacity-60' : ''
                      }`}
                    />

                    {/* Sold out overlay */}
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-full shadow">
                          Habis (Sold Out)
                        </span>
                      </div>
                    )}

                    <span className="absolute top-2 left-2 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-black/60 text-white backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  {/* Body text */}
                  <div className="p-4 space-y-1">
                    <h3 
                      onClick={() => item.is_available && !isClosed && setActiveModalItem(item)}
                      className="font-bold text-base text-[var(--text-primary)] line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 cursor-pointer transition-colors"
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer price & Add button */}
                <div className="p-4 pt-0 flex items-center justify-between gap-2 mt-2">
                  <span className="font-extrabold text-base text-amber-600 dark:text-amber-400">
                    {formatRupiah(item.price)}
                  </span>

                  <button
                    onClick={() => setActiveModalItem(item)}
                    disabled={!item.is_available || isClosed}
                    className="py-2 px-3.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Mobile-first floating trigger) */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-30 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 text-white font-bold text-sm shadow-2xl flex items-center justify-between hover:bg-amber-600 transition-all ring-4 ring-amber-500/20 pulse-glow"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-amber-600 font-extrabold text-xs flex items-center justify-center shadow">
                {totalItemCount}
              </div>
              <span>Lihat Keranjang Belanja</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-extrabold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Menu Item Options Modal */}
      {activeModalItem && (
        <MenuItemModal
          item={activeModalItem}
          onClose={() => setActiveModalItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Cart Drawer Panel */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
