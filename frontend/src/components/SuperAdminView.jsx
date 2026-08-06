import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  RefreshCw, 
  PlusCircle, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  LogOut, 
  Globe, 
  Smartphone,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { showAlertSuccess, showAlertWarning, showAlertError, showConfirmModal } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

export default function SuperAdminView({ onLogoutSuperAdmin, onSwitchToWebsite, onSimulateTenantPos }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal State for Manual Extend / Status Change
  const [editingTenant, setEditingTenant] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [newStatus, setNewStatus] = useState('active');

  const fetchTenants = () => {
    setLoading(true);
    fetch(`${API_BASE}/saas/tenants`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.data)) {
          setTenants(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetch tenants:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleExtendTrialOrStatus = (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    fetch(`${API_BASE}/saas/tenants/${editingTenant.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        extend_days: extendDays
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showAlertSuccess('Berhasil!', `Masa aktif toko ${editingTenant.store_name} diperbarui!`);
          setEditingTenant(null);
          fetchTenants();
        } else {
          showAlertWarning('Gagal', data.message || 'Gagal update status');
        }
      })
      .catch(err => {
        showAlertError('Error Server', err.message);
      });
  };

  const handleDeleteTenant = (tenant) => {
    showConfirmModal(
      'Hapus Tenant?',
      `Apakah Anda yakin ingin menghapus data toko "${tenant.store_name}" (${tenant.email}) dari database master?`
    ).then(isConfirmed => {
      if (isConfirmed) {
        fetch(`${API_BASE}/saas/tenants/${tenant.id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showAlertSuccess('Terhapus', `Toko "${tenant.store_name}" telah dihapus.`);
              fetchTenants();
            }
          });
      }
    });
  };

  // Calculations & Filtering
  const filteredTenants = tenants.filter(t => {
    const matchKeyword = !searchKeyword.trim() || 
      t.store_name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.email.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      t.phone.includes(searchKeyword);
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchKeyword && matchStatus;
  });

  const totalTenants = tenants.length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const expiredTenants = tenants.filter(t => t.status === 'expired' || t.status === 'suspended').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      
      {/* Top SuperAdmin Navigation Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-300 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-950">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl text-white tracking-tight">SuperAdmin Master SaaS</h1>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border border-amber-400/40 uppercase">
                  Penyedia Layanan
                </span>
              </div>
              <p className="text-xs text-slate-400">Pusat kontrol pendaftar, trial 7-hari, & perpanjangan lisensi toko</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={fetchTenants}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button 
              onClick={onSwitchToWebsite}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-extrabold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Website</span>
            </button>

            <button 
              onClick={onLogoutSuperAdmin}
              className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold transition border border-red-800/60 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Metric Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700/80 shadow-lg space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-black uppercase tracking-wider">Total Pendaftar SaaS</span>
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-3xl font-black text-white">{totalTenants} <span className="text-xs font-semibold text-slate-400">Toko</span></p>
            <p className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Terdaftar di database master
            </p>
          </div>

          <div className="bg-amber-950/30 p-5 rounded-3xl border border-amber-500/30 shadow-lg space-y-2">
            <div className="flex justify-between items-center text-amber-300">
              <span className="text-xs font-black uppercase tracking-wider">Masa Coba (Trial 7 Hari)</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-300">{trialTenants} <span className="text-xs font-semibold text-amber-200">Tenant</span></p>
            <p className="text-[11px] text-amber-400/90 font-medium">Sedang mencoba gratis aplikasi</p>
          </div>

          <div className="bg-emerald-950/30 p-5 rounded-3xl border border-emerald-500/30 shadow-lg space-y-2">
            <div className="flex justify-between items-center text-emerald-300">
              <span className="text-xs font-black uppercase tracking-wider">Berlangganan Aktif</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-300">{activeTenants} <span className="text-xs font-semibold text-emerald-200">Toko</span></p>
            <p className="text-[11px] text-emerald-400/90 font-medium">Lisensi aktif / sudah bayar</p>
          </div>

          <div className="bg-rose-950/30 p-5 rounded-3xl border border-rose-500/30 shadow-lg space-y-2">
            <div className="flex justify-between items-center text-rose-300">
              <span className="text-xs font-black uppercase tracking-wider">Expired / Suspended</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-3xl font-black text-rose-300">{expiredTenants} <span className="text-xs font-semibold text-rose-200">Toko</span></p>
            <p className="text-[11px] text-rose-400/90 font-medium">Masa coba habis / butuh perpanjangan</p>
          </div>

        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-slate-800/90 p-4 rounded-3xl border border-slate-700/80 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input 
              type="text" 
              placeholder="Cari toko, nama pemilik, email, no WA..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 shrink-0">Filter Status:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'trial', label: 'Trial 7 Hari' },
              { id: 'active', label: 'Aktif' },
              { id: 'expired', label: 'Expired' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  filterStatus === st.id
                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-slate-800/90 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/80 flex justify-between items-center">
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Daftar Pemilik Toko & Demo User
              </h3>
              <p className="text-xs text-slate-400">Total {filteredTenants.length} pendaftar ditemukan</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3.5">ID / Nama Toko</th>
                  <th className="p-3.5">Pemilik & Kontak</th>
                  <th className="p-3.5">Tgl Daftar & Expired</th>
                  <th className="p-3.5">Status & Trial</th>
                  <th className="p-3.5 text-center">Aksi Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">
                      Tidak ada data pendaftar toko yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(t => {
                    const waNum = (t.phone || '').replace(/[^0-9]/g, '');
                    const formattedWa = waNum.startsWith('0') ? '62' + waNum.slice(1) : waNum;

                    return (
                      <tr key={t.id} className="hover:bg-slate-700/40 transition">
                        
                        {/* ID & Toko */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="bg-slate-900 text-amber-400 font-mono font-black text-xs px-2.5 py-1 rounded-xl border border-slate-700">
                              #{t.id}
                            </span>
                            <div>
                              <p className="font-extrabold text-white text-sm">{t.store_name}</p>
                              <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded-md font-mono border border-teal-800/60">
                                Plan: {t.plan || 'Starter'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Pemilik & Kontak */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <p className="font-extrabold text-slate-200 flex items-center gap-1.5">
                              <span>👤 {t.name}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" /> {t.email}
                            </p>
                            <a 
                              href={`https://wa.me/${formattedWa}?text=${encodeURIComponent(`Halo ${t.name}, CS Laundry App SaaS menyapa Anda untuk usaha ${t.store_name}...`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" /> {t.phone} (WhatsApp) &rarr;
                            </a>
                          </div>
                        </td>

                        {/* Tgl Daftar & Expired */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="space-y-1 text-[11px]">
                            <p className="text-slate-400">Daftar: <b className="text-slate-200">{new Date(t.created_at || t.trial_start).toLocaleDateString('id-ID')}</b></p>
                            <p className="text-slate-400">Berakhir: <b className="text-amber-300">{new Date(t.trial_ends_at).toLocaleDateString('id-ID')}</b></p>
                          </div>
                        </td>

                        {/* Status & Trial Countdown */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            {t.status === 'active' ? (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Berlangganan Aktif
                              </span>
                            ) : t.status === 'trial' ? (
                              <span className="bg-amber-950 text-amber-300 border border-amber-700/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Trial {t.remaining_days} Hari Tersisa
                              </span>
                            ) : (
                              <span className="bg-rose-950 text-rose-300 border border-rose-700/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Masa Aktif Habis
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Aksi Master */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Extend Subscription */}
                            <button
                              onClick={() => {
                                setEditingTenant(t);
                                setExtendDays(30);
                                setNewStatus('active');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Aktifkan / Perpanjang Masa Lisensi"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> +30 Hari
                            </button>

                            {/* Demo POS Simulation */}
                            <button
                              onClick={() => onSimulateTenantPos(t)}
                              className="bg-teal-700 hover:bg-teal-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Masuk Sebagai Demo POS Toko Ini"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Demo POS
                            </button>

                            {/* Delete Tenant */}
                            <button
                              onClick={() => handleDeleteTenant(t)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-900 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
                              title="Hapus Tenant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* MODAL PERPANJANG TRIAL / LISENSI */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-lg text-white">Kelola Masa Aktif Toko</h3>
                <p className="text-xs text-amber-400 font-bold">{editingTenant.store_name} ({editingTenant.name})</p>
              </div>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleExtendTrialOrStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Pilih Status Lisensi:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="active">Berlangganan Aktif (Active)</option>
                  <option value="trial">Masa Coba (Trial 7 Hari)</option>
                  <option value="expired">Masa Aktif Habis (Expired)</option>
                  <option value="suspended">Ditangguhkan (Suspended)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Tambah Masa Aktif (Hari):</label>
                <input 
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Misal: 7 atau 30 hari"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-lg transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
