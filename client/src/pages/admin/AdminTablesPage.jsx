import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { QrCode, Plus, Download, Trash2, ExternalLink, Users } from 'lucide-react';

export default function AdminTablesPage() {
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const fetchTables = () => {
    fetch('/api/admin/tables', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTables(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
  }, [token]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableNumber) return;

    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ table_number: parseInt(tableNumber, 10), capacity: parseInt(capacity, 10) })
      });
      const data = await res.json();
      if (data.success) {
        setTableNumber('');
        fetchTables();
      } else {
        alert(data.message || 'Gagal menambahkan meja.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Hapus meja ini?')) return;
    try {
      const res = await fetch(`/api/admin/tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchTables();
    } catch (err) {
      alert('Gagal menghapus meja.');
    }
  };

  const handleDownloadQR = (qrDataUrl, tableNum) => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Meja_${tableNum}_CafeOrder.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Manajemen Meja & Kode QR
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Atur data meja cafe dan unduh stiker Kode QR unik untuk ditempel di setiap meja.
          </p>
        </div>

        {/* Add Table Form Card */}
        <div 
          className="p-5 rounded-3xl border border-[var(--border-color)] shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" />
            <span>Tambah Meja Baru</span>
          </h3>

          <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-[var(--text-muted)]">Nomor Meja</label>
              <input
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Contoh: 11"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="w-full sm:w-40 space-y-1">
              <label className="text-xs font-bold text-[var(--text-muted)]">Kapasitas Kursi</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="4"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Meja</span>
            </button>
          </form>
        </div>

        {/* Tables Grid with QR Codes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((tbl) => (
            <div
              key={tbl.id}
              className="p-5 rounded-3xl border border-[var(--border-color)] shadow-sm space-y-3 text-center flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-[var(--text-primary)]">
                    Meja #{tbl.table_number}
                  </span>
                  <button
                    onClick={() => handleDeleteTable(tbl.id)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg text-xs"
                    title="Hapus Meja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Kapasitas: {tbl.capacity} Orang</span>
                </div>

                {/* QR Code Container */}
                <div className="p-3 my-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner">
                  {tbl.qr_code_data_url ? (
                    <img
                      src={tbl.qr_code_data_url}
                      alt={`QR Meja ${tbl.table_number}`}
                      className="w-32 h-32 mx-auto object-contain"
                    />
                  ) : (
                    <QrCode className="w-32 h-32 text-slate-400 mx-auto" />
                  )}
                </div>

                <a
                  href={tbl.order_url || `/order?table=${tbl.table_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 truncate"
                >
                  <span>{tbl.order_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <button
                onClick={() => handleDownloadQR(tbl.qr_code_data_url, tbl.table_number)}
                className="w-full py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:bg-black/10 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>Unduh Gambar QR</span>
              </button>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}
