import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatRupiah } from '../../utils/formatters.js';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Image as ImageIcon, X } from 'lucide-react';

export default function AdminMenuPage() {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Makanan Berat',
    image_url: '',
    is_available: true
  });

  const categoriesList = ['Makanan Berat', 'Minuman', 'Snack', 'Dessert'];

  const fetchMenu = () => {
    fetch('/api/admin/menu', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMenuItems(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenu();
  }, [token]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Makanan Berat',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      is_available: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      image_url: item.image_url || '',
      is_available: item.is_available
    });
    setShowModal(true);
  };

  const handleToggleAvailability = async (item) => {
    try {
      const res = await fetch(`/api/admin/menu/${item.id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_available: !item.is_available })
      });
      const data = await res.json();
      if (data.success) {
        fetchMenu();
      }
    } catch (err) {
      alert('Gagal mengubah ketersediaan.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah anda yakin ingin menghapus menu ini?')) return;
    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchMenu();
      }
    } catch (err) {
      alert('Gagal menghapus menu.');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/admin/menu/${editingItem.id}` : '/api/admin/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchMenu();
      } else {
        alert(data.message || 'Gagal menyimpan menu.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const filteredMenu = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Manajemen Menu Cafe
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Tambah, edit, hapus, dan atur ketersediaan menu makanan & minuman.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama menu..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['Semua', ...categoriesList].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-white'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Table / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-3 flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex gap-3">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-muted)]">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {item.description}
                  </p>
                  <p className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                    {formatRupiah(item.price)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                {/* Availability Toggle */}
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    item.is_available
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {item.is_available ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tersedia</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Habis</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-color)]"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Nama Menu</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Gula Aren"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-primary)]">Harga (Rp)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="25000"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-primary)]">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">Deskripsi Menu</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi bahan dan rasa..."
                  rows="2"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-primary)]">URL Gambar Makanan</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-[var(--border-color)]"
                />
                <label htmlFor="is_available" className="font-bold text-[var(--text-primary)] cursor-pointer">
                  Status Menu Tersedia (Ready Stock)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-md mt-2"
              >
                Simpan Menu
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
