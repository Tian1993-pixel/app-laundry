import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Printer, 
  Key, 
  Download, 
  Trash2, 
  Plus, 
  Check, 
  Smartphone, 
  Shirt, 
  Settings, 
  HelpCircle,
  Database,
  RefreshCw,
  Edit,
  Image,
  Sparkles,
  Upload,
  FolderOpen
} from 'lucide-react';
import Swal from 'sweetalert2';
import InteractiveMapPicker from './InteractiveMapPicker';
import { showAlertSuccess, showAlertWarning, showConfirmModal } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

export default function OutletSettingsView({
  storeSettings,
  setStoreSettings,
  outlets,
  setOutlets,
  activeOutletId,
  setActiveOutletId,
  bankAccounts,
  setBankAccounts,
  receiptFontSize,
  setReceiptFontSize,
  onResetData,
  onExportData
}) {
  const [settingTab, setSettingTab] = useState('profile');

  // Modal State
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ store_name: '', address: '', phone: '' });

  const [editingOutlet, setEditingOutlet] = useState(null);

  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', account_number: '', account_holder: '', qr_code_url: '' });
  const [editingBank, setEditingBank] = useState(null);

  // Handle Image File Upload From Device Memory & Auto Save to Database
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return showAlertWarning('File Terlalu Besar', 'Pilih file gambar logo dengan ukuran maksimal 5MB!');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...storeSettings, logo_url: reader.result };
        setStoreSettings(updated);

        fetch(`${API_BASE}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
          .then(res => res.json())
          .then(() => showAlertSuccess('Logo Disimpan', 'Gambar logo baru berhasil tersimpan di database!'))
          .catch(err => console.log('DB logo save error:', err));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        return showAlertWarning('File Terlalu Besar', 'Pilih file gambar banner dengan ukuran maksimal 8MB!');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...storeSettings, banner_url: reader.result };
        setStoreSettings(updated);

        fetch(`${API_BASE}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
          .then(res => res.json())
          .then(() => showAlertSuccess('Banner Disimpan', 'Gambar banner hero baru berhasil tersimpan di database!'))
          .catch(err => console.log('DB banner save error:', err));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOutletSubmit = (e) => {
    e.preventDefault();
    if (!newOutlet.store_name || !newOutlet.phone) return showAlertWarning('Form Incomplete', 'Lengkapi nama dan telepon outlet!');
    const tempId = Date.now();
    const created = {
      id: tempId,
      store_name: newOutlet.store_name,
      address: newOutlet.address || '-',
      phone: newOutlet.phone,
      maps_embed_url: newOutlet.maps_embed_url || null
    };

    setOutlets(prev => [...prev, created]);

    fetch(`${API_BASE}/outlets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.id) {
        setOutlets(prev => prev.map(o => o.id === tempId ? { ...o, id: data.id } : o));
      }
    })
    .catch(err => console.log('DB outlet error:', err));

    setNewOutlet({ store_name: '', address: '', phone: '', maps_embed_url: '' });
    setShowAddOutlet(false);
    showAlertSuccess('Outlet Dibuat', `Outlet cabang baru "${created.store_name}" berhasil disimpan!`);
  };

  const handleEditOutletSubmit = (e) => {
    e.preventDefault();
    if (!editingOutlet.store_name || !editingOutlet.phone) return showAlertWarning('Form Incomplete', 'Lengkapi nama dan telepon outlet!');

    const updatedOutlets = outlets.map(o => o.id === editingOutlet.id ? editingOutlet : o);
    setOutlets(updatedOutlets);

    fetch(`${API_BASE}/outlets/${editingOutlet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingOutlet)
    }).catch(err => console.log('DB outlet update error:', err));

    if (activeOutletId === editingOutlet.id) {
      const updatedSettings = {
        ...storeSettings,
        store_name: editingOutlet.store_name,
        address: editingOutlet.address,
        phone: editingOutlet.phone,
        maps_embed_url: editingOutlet.maps_embed_url
      };
      setStoreSettings(updatedSettings);

      fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).catch(err => console.log('DB settings error:', err));
    }

    setEditingOutlet(null);
    showAlertSuccess('Outlet Diperbarui', `Data outlet "${editingOutlet.store_name}" berhasil disimpan ke database!`);
  };

  const handleAddBankSubmit = (e) => {
    e.preventDefault();
    if (!newBank.bank_name || !newBank.account_number) return showAlertWarning('Form Incomplete', 'Lengkapi data rekening bank!');
    const created = {
      id: Date.now(),
      bank_name: newBank.bank_name,
      account_number: newBank.account_number,
      account_holder: newBank.account_holder || '-',
      qr_code_url: newBank.qr_code_url || null
    };

    setBankAccounts([...bankAccounts, created]);

    fetch(`${API_BASE}/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB bank error:', err));

    setNewBank({ bank_name: '', account_number: '', account_holder: '', qr_code_url: '' });
    setShowAddBank(false);
    showAlertSuccess('Rekening / QRIS Ditambahkan', `Metode pembayaran ${created.bank_name} berhasil disimpan!`);
  };

  const handleEditBankSubmit = (e) => {
    e.preventDefault();
    if (!editingBank.bank_name || !editingBank.account_number) return showAlertWarning('Form Incomplete', 'Lengkapi data rekening / QRIS!');

    const updated = bankAccounts.map(b => b.id === editingBank.id ? editingBank : b);
    setBankAccounts(updated);

    fetch(`${API_BASE}/bank-accounts/${editingBank.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingBank)
    }).catch(err => console.log('DB bank update error:', err));

    setEditingBank(null);
    showAlertSuccess('Rekening / QRIS Diperbarui', `Metode pembayaran "${editingBank.bank_name}" berhasil diperbarui!`);
  };

  const handleDeleteBank = (bankId, bankName) => {
    const doDelete = () => {
      setBankAccounts(prev => prev.filter(b => b.id !== bankId));

      fetch(`${API_BASE}/bank-accounts/${bankId}`, {
        method: 'DELETE'
      }).catch(err => console.log('DB bank delete error:', err));

      showAlertSuccess('Berhasil Dihapus', `Metode pembayaran "${bankName}" berhasil dihapus!`);
    };

    try {
      Swal.fire({
        title: '<span class="font-extrabold text-slate-800 text-base">Hapus Metode Pembayaran?</span>',
        html: `<p class="text-xs text-slate-600 mt-1">Yakin ingin menghapus rekening / QRIS <b>"${bankName}"</b>?</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus Sekarang',
        cancelButtonText: 'Batal',
        customClass: {
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs mx-1 shadow transition',
          cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs mx-1 transition',
          popup: 'rounded-3xl p-6 font-sans shadow-2xl border border-slate-200 z-[99999]'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result && result.isConfirmed) {
          doDelete();
        }
      });
    } catch (e) {
      if (window.confirm(`Yakin ingin menghapus rekening / QRIS "${bankName}"?`)) {
        doDelete();
      }
    }
  };

  const handleSaveSettings = () => {
    // Sync current store_name, address, phone with active outlet
    if (outlets && outlets.length > 0) {
      const activeOutlet = outlets.find(o => o.id === Number(activeOutletId));
      if (activeOutlet) {
        const updatedOutlet = {
          ...activeOutlet,
          store_name: storeSettings.store_name,
          address: storeSettings.address,
          phone: storeSettings.phone
        };
        setOutlets(outlets.map(o => o.id === activeOutlet.id ? updatedOutlet : o));
        fetch(`${API_BASE}/outlets/${activeOutlet.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOutlet)
        }).catch(err => console.log('DB outlet sync error:', err));
      }
    }

    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeSettings)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          showAlertSuccess('Pengaturan Disimpan', 'Pengaturan profil toko, logo, banner, & nota berhasil tersimpan permanen di database!');
        } else {
          showAlertWarning('Info Server', data.message || 'Gagal menyimpan pengaturan ke database');
        }
      })
      .catch(err => {
        console.log('DB settings error:', err);
        showAlertSuccess('Pengaturan Disimpan (Lokal)', 'Pengaturan tersimpan di memori browser!');
      });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" /> Pengaturan Profil Toko, Outlet & System
          </h2>
          <p className="text-xs text-slate-500">Edit nama toko, slogan, nomor WA, promo diskon member, upload logo, serta cabang outlet</p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border">
          <button 
            onClick={() => setSettingTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'profile' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Profil Toko & Promo
          </button>
          <button 
            onClick={() => setSettingTab('outlets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'outlets' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Edit Cabang ({outlets.length})
          </button>
          <button 
            onClick={() => setSettingTab('theme')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'theme' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Upload Logo & Banner
          </button>
          <button 
            onClick={() => setSettingTab('bank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'bank' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rekening & QRIS
          </button>
          <button 
            onClick={() => setSettingTab('receipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'receipt' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Font Struk
          </button>
          <button 
            onClick={() => setSettingTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'backup' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Backup Data
          </button>
        </div>
      </div>

      {/* 0. PROFIL TOKO & PROMO MEMBER */}
      {settingTab === 'profile' && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border space-y-6">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" /> Informasi Utama Toko & Promo Member
              </h3>
              <p className="text-xs text-slate-500">Ubah nama toko, slogan website, nomor WhatsApp, dan nominal diskon member</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Laundry</label>
                <input 
                  type="text" 
                  value={storeSettings.store_name || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                  placeholder="Contoh: Laundry Fresh & Clean"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">No. WhatsApp / Telepon Toko</label>
                <input 
                  type="text" 
                  value={storeSettings.phone || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-teal-500"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Slogan / Tagline Website</label>
              <input 
                type="text" 
                value={storeSettings.tagline || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                className="w-full p-2.5 border rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500"
                placeholder="Contoh: Solusi Pakaian Bersih, Rapi & Harum Premium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Toko</label>
              <textarea 
                rows="2"
                value={storeSettings.address || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                className="w-full p-2.5 border rounded-xl text-slate-800 focus:ring-2 focus:ring-teal-500"
                placeholder="Contoh: Jl. Raya Utama No. 12, Bandung"
              />
            </div>

            {/* Interactive Draggable Pin Map Picker */}
            <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-3">
              <div>
                <h4 className="font-extrabold text-teal-900 text-xs flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-teal-600" /> Peta Interaktif & Pin Titik Merah Lokasi Toko
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Geser/Tarik titik <b>pin merah 📍</b> di bawah ini persis ke lokasi toko laundry Anda. Koordinat akan tersimpan otomatis ke website!
                </p>
              </div>

              <InteractiveMapPicker 
                onLocationSelect={({ lat, lng, address }) => {
                  const generatedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
                  setStoreSettings(prev => ({ 
                    ...prev, 
                    maps_embed_url: generatedUrl,
                    ...(address ? { address: address } : {})
                  }));
                }}
                height="220px"
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-4">
              <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Pengaturan Promo Member & Point Reward
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Diskon Member Baru (Rp)</label>
                  <input 
                    type="number" 
                    value={storeSettings.first_member_discount || 10000}
                    onChange={(e) => setStoreSettings({ ...storeSettings, first_member_discount: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl bg-white text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-1">Batas Syarat Poin</label>
                  <input 
                    type="number" 
                    value={storeSettings.point_redeem_threshold || 10}
                    onChange={(e) => setStoreSettings({ ...storeSettings, point_redeem_threshold: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl bg-white text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-900 block mb-1">Potongan Poin (Rp)</label>
                  <input 
                    type="number" 
                    value={storeSettings.point_redeem_discount || 10000}
                    onChange={(e) => setStoreSettings({ ...storeSettings, point_redeem_discount: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl bg-white text-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Simpan Perubahan Profil Toko Ke Database
            </button>
          </div>
        </div>
      )}

      {/* 1. PENGATURAN OUTLET & EDIT OUTLET */}
      {settingTab === 'outlets' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Kelola & Edit Outlet Cabang</h3>
              <p className="text-xs text-slate-500">Edit nama/alamat/telepon outlet atau buat cabang baru</p>
            </div>
            <button 
              onClick={() => setShowAddOutlet(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-4 h-4" /> Buat Outlet Baru
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlets.map(out => (
              <div 
                key={out.id} 
                className={`p-5 rounded-2xl border transition shadow-sm space-y-3 ${
                  activeOutletId === out.id ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">{out.store_name}</h4>
                    <p className="text-xs text-slate-500">📞 {out.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-1">📍 {out.address}</p>
                  </div>
                  {activeOutletId === out.id && (
                    <span className="bg-teal-700 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" /> Outlet Aktif
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingOutlet({ ...out })}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Outlet
                  </button>

                  {activeOutletId !== out.id && (
                    <button 
                      onClick={() => {
                        setActiveOutletId(out.id);
                        const updated = { ...storeSettings, store_name: out.store_name, address: out.address, phone: out.phone };
                        setStoreSettings(updated);

                        fetch(`${API_BASE}/settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updated)
                        }).catch(err => console.log('DB outlet switch error:', err));

                        showAlertSuccess('Beralih Outlet', `Sekarang aktif di outlet: ${out.store_name}`);
                      }}
                      className="flex-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2 rounded-xl transition"
                    >
                      Beralih Aktif
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PENGATURAN LOGO & BANNER DEPAN DEVICEMEMORY / FILE UPLOAD (USER REQUEST) */}
      {settingTab === 'theme' && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border space-y-6">
          <h3 className="font-extrabold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
            <Image className="w-5 h-5 text-teal-600" /> Upload Gambar Logo & Banner Dari Memori Perangkat
          </h3>

          <div className="space-y-6 text-xs">
            
            {/* Logo Customizer */}
            <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <div>
                <label className="font-extrabold text-slate-800 block text-sm">Gambar Logo Toko Laundry</label>
                <p className="text-slate-500 text-[11px]">Tampil di navbar header atas & nota struk.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img 
                  src={storeSettings.logo_url && storeSettings.logo_url.startsWith('/images/') ? storeSettings.logo_url.slice(1) : (storeSettings.logo_url || 'images/laundry_logo.png')} 
                  alt="Logo Store" 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 bg-teal-950 p-1 shadow shrink-0"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
                />
                
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl cursor-pointer shadow transition flex items-center gap-2 text-xs">
                      <FolderOpen className="w-4 h-4" /> Ambil Gambar Dari Perangkat (HP / Laptop)
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoFileChange}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  
                  <input 
                    type="text" 
                    value={storeSettings.logo_url || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, logo_url: e.target.value })}
                    className="w-full p-2 border rounded-xl font-mono text-[11px]"
                    placeholder="Atau tempel URL Gambar Online di sini..."
                  />
                </div>
              </div>
            </div>

            {/* Banner Customizer */}
            <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
              <div>
                <label className="font-extrabold text-slate-800 block text-sm">Gambar Banner Depan Website (Hero Banner)</label>
                <p className="text-slate-500 text-[11px]">Tampil penuh sebagai spanduk latar depan website utama.</p>
              </div>

              <div className="space-y-3">
                <div className="h-44 w-full rounded-2xl overflow-hidden border-2 border-amber-400 relative bg-teal-900 shadow-md">
                  <img 
                    src={storeSettings.banner_url && storeSettings.banner_url.startsWith('/images/') ? storeSettings.banner_url.slice(1) : (storeSettings.banner_url || 'images/laundry_hero_banner.png')} 
                    alt="Banner Depan Website" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_hero_banner.png'; }}
                  />
                  <div className="absolute bottom-3 left-3 bg-teal-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-amber-300 font-bold text-xs border border-teal-700">
                    Preview Banner Aktif
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl cursor-pointer shadow transition flex items-center gap-2 text-xs">
                    <Upload className="w-4 h-4" /> Pilih File Banner Dari Memori Perangkat
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBannerFileChange}
                      className="hidden" 
                    />
                  </label>

                  <button
                    onClick={() => setStoreSettings({ ...storeSettings, banner_url: 'images/laundry_hero_banner.png' })}
                    className="bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs"
                  >
                    Gunakan Default
                  </button>
                </div>

                <input 
                  type="text" 
                  value={storeSettings.banner_url || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, banner_url: e.target.value })}
                  className="w-full p-2 border rounded-xl font-mono text-[11px]"
                  placeholder="Atau tempel URL Gambar Online di sini..."
                />
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Simpan Perubahan Gambar Logo & Banner Kebatabase
            </button>
          </div>
        </div>
      )}

      {/* 3. REKENING BANK & QRIS */}
      {settingTab === 'bank' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Akun Keuangan & Rekening Bank / QRIS</h3>
              <p className="text-xs text-slate-500">Kelola nomor rekening, foto QR Code QRIS, edit & hapus metode pembayaran</p>
            </div>
            <button 
              onClick={() => setShowAddBank(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-4 h-4" /> Tambah Rekening / QRIS
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(b => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-teal-800 text-sm">{b.bank_name}</span>
                    <CreditCard className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-lg font-black font-mono text-slate-900">{b.account_number}</p>
                  <p className="text-xs text-slate-500">a.n. {b.account_holder}</p>

                  {/* QR Code Image Preview */}
                  {b.qr_code_url ? (
                    <div className="pt-2 border-t border-slate-100 flex flex-col items-center">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Gambar QR Code / QRIS:</p>
                      <img 
                        src={b.qr_code_url} 
                        alt={`QR Code ${b.bank_name}`} 
                        className="w-32 h-32 object-contain rounded-xl border bg-slate-50 p-1"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 italic">Belum ada foto QR Code</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingBank({ ...b })}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteBank(b.id, b.bank_name)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center justify-center gap-1 border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PENGATURAN NOTA & UKURAN FONT THERMAL */}
      {settingTab === 'receipt' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
            <h3 className="font-extrabold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
              <Printer className="w-5 h-5 text-teal-600" /> Pengaturan Nota Struk Thermal & Font Size
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Ukuran Font Kertas Thermal Struk</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '58mm', name: '58mm (Kecil)' },
                    { id: '80mm', name: '80mm (Standar)' },
                    { id: 'large', name: 'Besar (Jelas)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setReceiptFontSize(f.id)}
                      className={`p-3 rounded-xl border font-bold text-center transition ${
                        receiptFontSize === f.id ? 'bg-teal-700 text-white border-teal-700 shadow' : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Header Nota (Atas)</label>
                <input 
                  type="text" 
                  value={storeSettings.header_receipt_note || 'Nota Resmi Pembayaran Laundry'}
                  onChange={(e) => setStoreSettings({ ...storeSettings, header_receipt_note: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Footer Nota (Bawah)</label>
                <textarea 
                  rows="2"
                  value={storeSettings.footer_receipt_note || 'Terima kasih telah mempercayakan pakaian Anda kepada kami!'}
                  onChange={(e) => setStoreSettings({ ...storeSettings, footer_receipt_note: e.target.value })}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow transition"
              >
                Simpan Pengaturan Nota
              </button>
            </div>
          </div>

          {/* LIVE RECEIPT PREVIEW */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-extrabold text-slate-800 text-base border-b pb-3 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Preview Struk Nota (Live)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Perubahan header, footer, logo, dan ukuran font langsung terlihat di preview ini.</p>

            <div className="flex justify-center">
              <div 
                className="bg-white border-2 border-dashed border-slate-300 rounded-lg shadow-inner"
                style={{
                  width: receiptFontSize === '58mm' ? '220px' : receiptFontSize === 'large' ? '340px' : '300px',
                  padding: '16px 12px',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: receiptFontSize === '58mm' ? '9px' : receiptFontSize === 'large' ? '12px' : '10px',
                  lineHeight: receiptFontSize === '58mm' ? '1.3' : receiptFontSize === 'large' ? '1.5' : '1.4',
                  color: '#1e293b'
                }}
              >
                {/* Header Block: Logo Left (Prominent & Large) + Store Info Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: receiptFontSize === '58mm' ? '10px' : receiptFontSize === 'large' ? '14px' : '12px', marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
                  {/* Logo on Left (Larger & Prominent) */}
                  <div style={{ flexShrink: 0 }}>
                    {storeSettings.logo_url ? (
                      <img 
                        src={storeSettings.logo_url} 
                        alt="Logo" 
                        style={{ 
                          width: receiptFontSize === '58mm' ? '60px' : receiptFontSize === 'large' ? '90px' : '75px', 
                          height: receiptFontSize === '58mm' ? '60px' : receiptFontSize === 'large' ? '90px' : '75px', 
                          objectFit: 'contain', 
                          borderRadius: '8px',
                          display: 'block'
                        }} 
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ 
                        width: receiptFontSize === '58mm' ? '60px' : receiptFontSize === 'large' ? '90px' : '75px', 
                        height: receiptFontSize === '58mm' ? '60px' : receiptFontSize === 'large' ? '90px' : '75px', 
                        backgroundColor: '#f1f5f9', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: receiptFontSize === '58mm' ? '24px' : receiptFontSize === 'large' ? '36px' : '30px'
                      }}>🧺</div>
                    )}
                  </div>

                  {/* Store Info on Right (Balanced & Clear Rata Kiri) */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: receiptFontSize === '58mm' ? '11px' : receiptFontSize === 'large' ? '16px' : '14px', lineHeight: '1.25', marginBottom: '3px', wordBreak: 'break-word', color: '#0f172a' }}>
                      {storeSettings.store_name || 'Nama Toko'}
                    </div>
                    <div style={{ fontSize: receiptFontSize === '58mm' ? '8px' : receiptFontSize === 'large' ? '11px' : '9.5px', color: '#475569', lineHeight: '1.3', marginBottom: '2px', wordBreak: 'break-word' }}>
                      {storeSettings.address || 'Alamat Toko'}
                    </div>
                    <div style={{ fontSize: receiptFontSize === '58mm' ? '8px' : receiptFontSize === 'large' ? '11px' : '9.5px', color: '#475569', lineHeight: '1.3' }}>
                      Telp: {storeSettings.phone || '08xxxxxxxxxx'}
                    </div>
                  </div>
                </div>

                {/* Header Note */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '4px 0', margin: '4px 0', fontSize: receiptFontSize === '58mm' ? '8px' : receiptFontSize === 'large' ? '11px' : '9px' }}>
                  {storeSettings.header_receipt_note || 'Nota Resmi Pembayaran Laundry'}
                </div>

                {/* Invoice Info */}
                <div style={{ margin: '6px 0', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>No. Invoice</span>
                    <span style={{ fontWeight: 'bold' }}>LD-20260804-001</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tanggal</span>
                    <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pelanggan</span>
                    <span>Budi Santoso</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Parfum</span>
                    <span>Lily Fresh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Rak</span>
                    <span>RAK A-02</span>
                  </div>
                </div>

                {/* Separator */}
                <div style={{ borderTop: '1px dashed #94a3b8', margin: '4px 0' }}></div>

                {/* Items */}
                <div style={{ margin: '4px 0' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Detail Pesanan:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cuci Komplit Reguler</span>
                    <span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>&nbsp;&nbsp;3 kg x Rp 7.000</span>
                    <span>Rp 21.000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bed Cover Jumbo</span>
                    <span></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>&nbsp;&nbsp;1 pcs x Rp 35.000</span>
                    <span>Rp 35.000</span>
                  </div>
                </div>

                {/* Separator */}
                <div style={{ borderTop: '1px dashed #94a3b8', margin: '4px 0' }}></div>

                {/* Totals */}
                <div style={{ margin: '4px 0', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>Rp 56.000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Diskon Member</span>
                    <span>- Rp {(storeSettings.first_member_discount || 10000).toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: receiptFontSize === '58mm' ? '10px' : receiptFontSize === 'large' ? '14px' : '12px', borderTop: '1px solid #334155', paddingTop: '3px', marginTop: '3px' }}>
                    <span>TOTAL</span>
                    <span>Rp {(56000 - (storeSettings.first_member_discount || 10000)).toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bayar (Tunai)</span>
                    <span>Rp 50.000</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kembali</span>
                    <span>Rp {(50000 - (56000 - (storeSettings.first_member_discount || 10000))).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Status */}
                <div style={{ textAlign: 'center', margin: '6px 0', fontWeight: 'bold', padding: '3px', border: '1px solid #0f766e', borderRadius: '4px', color: '#0f766e' }}>
                  ✅ LUNAS
                </div>

                {/* Poin */}
                <div style={{ textAlign: 'center', fontSize: receiptFontSize === '58mm' ? '7px' : receiptFontSize === 'large' ? '10px' : '8px', color: '#64748b', margin: '4px 0' }}>
                  +3 Poin Reward ({storeSettings.point_redeem_threshold || 10} poin = Diskon Rp {(storeSettings.point_redeem_discount || 10000).toLocaleString('id-ID')})
                </div>

                {/* Footer Note */}
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', marginTop: '6px', textAlign: 'center', fontSize: receiptFontSize === '58mm' ? '7px' : receiptFontSize === 'large' ? '10px' : '8px', color: '#475569', fontStyle: 'italic' }}>
                  {storeSettings.footer_receipt_note || 'Terima kasih telah mempercayakan pakaian Anda kepada kami!'}
                </div>

                {/* Powered By */}
                <div style={{ textAlign: 'center', fontSize: '7px', color: '#94a3b8', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                  Powered by App Laundry System
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. BACKUP & RESET DATA */}
      {settingTab === 'backup' && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border space-y-6">
          <h3 className="font-extrabold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" /> Backup Data & Reset System
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200 space-y-3">
              <h4 className="font-extrabold text-teal-900 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-teal-700" /> Export Backup Data (JSON)
              </h4>
              <p className="text-xs text-teal-800">
                Unduh seluruh cadangan data transaksi, pelanggan, layanan, dan pengaturan ke file JSON.
              </p>
              <button 
                onClick={onExportData}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Backup JSON
              </button>
            </div>

            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 space-y-3">
              <h4 className="font-extrabold text-red-900 text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-700" /> Reset Data Aplikasi
              </h4>
              <p className="text-xs text-red-800">
                Kembalikan data transaksi ke data awal bawaan aplikasi (Gunakan jika ingin memulai dari awal).
              </p>
              <button 
                onClick={onResetData}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Reset Ke Data Awal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT OUTLET */}
      {editingOutlet && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 font-sans">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" /> Edit Data Outlet Cabang
            </h3>
            <form onSubmit={handleEditOutletSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Outlet Cabang *</label>
                <input 
                  type="text" 
                  required 
                  value={editingOutlet.store_name} 
                  onChange={e => setEditingOutlet({...editingOutlet, store_name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">No. WhatsApp Outlet *</label>
                <input 
                  type="tel" 
                  required 
                  value={editingOutlet.phone} 
                  onChange={e => setEditingOutlet({...editingOutlet, phone: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold block">Alamat Lengkap Outlet</label>
                  {editingOutlet.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editingOutlet.address)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-teal-700 font-extrabold flex items-center gap-0.5 hover:underline"
                    >
                      📍 Pin Lokasi Di Google Maps ↗
                    </a>
                  )}
                </div>
                <textarea 
                  rows="2" 
                  value={editingOutlet.address} 
                  onChange={e => setEditingOutlet({...editingOutlet, address: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Jl. Raya Dago No. 88, Bandung"
                ></textarea>
              </div>

              {/* Interactive Draggable Pin Map Picker */}
              <div>
                <label className="font-bold block mb-1">📍 Geser Pin Merah Untuk Atur Lokasi Outlet</label>
                <InteractiveMapPicker 
                  onLocationSelect={({ lat, lng, address }) => {
                    const generatedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
                    setEditingOutlet(prev => ({ 
                      ...prev, 
                      maps_embed_url: generatedUrl,
                      ...(address ? { address: address } : {})
                    }));
                  }}
                  height="180px"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl">Update Outlet</button>
                <button type="button" onClick={() => setEditingOutlet(null)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH OUTLET */}
      {showAddOutlet && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Buat Outlet Cabang Baru</h3>
            <form onSubmit={handleAddOutletSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Outlet Cabang *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Misal: Fresh & Clean Cabang 2"
                  value={newOutlet.store_name} 
                  onChange={e => setNewOutlet({...newOutlet, store_name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">No. WhatsApp Outlet *</label>
                <input 
                  type="tel" 
                  required 
                  value={newOutlet.phone} 
                  onChange={e => setNewOutlet({...newOutlet, phone: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Alamat Outlet</label>
                <textarea 
                  rows="2" 
                  value={newOutlet.address} 
                  onChange={e => setNewOutlet({...newOutlet, address: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Jl. Raya Juanda No. 88, Bandung"
                ></textarea>
              </div>

              {/* Interactive Draggable Pin Map Picker */}
              <div>
                <label className="font-bold block mb-1">📍 Geser Pin Merah Untuk Atur Lokasi Outlet</label>
                <InteractiveMapPicker 
                  onLocationSelect={({ lat, lng, address }) => {
                    const generatedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
                    setNewOutlet(prev => ({ 
                      ...prev, 
                      maps_embed_url: generatedUrl,
                      ...(address ? { address: address } : {})
                    }));
                  }}
                  height="180px"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2.5 rounded-xl">Simpan Outlet</button>
                <button type="button" onClick={() => setShowAddOutlet(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BANK / QRIS */}
      {showAddBank && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Tambah Rekening / QRIS Pembayaran</h3>
            <form onSubmit={handleAddBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Bank / E-Wallet / QRIS *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="BCA / Mandiri / QRIS ShopeePay / QRIS BCA"
                  value={newBank.bank_name} 
                  onChange={e => setNewBank({...newBank, bank_name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Nomor Rekening / ID QRIS *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="1234567890"
                  value={newBank.account_number} 
                  onChange={e => setNewBank({...newBank, account_number: e.target.value})}
                  className="w-full p-2.5 border rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Atas Nama (a.n.)</label>
                <input 
                  type="text" 
                  placeholder="Laundry Fresh & Clean"
                  value={newBank.account_holder} 
                  onChange={e => setNewBank({...newBank, account_holder: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              {/* Upload QR Code */}
              <div>
                <label className="font-bold block mb-1">Unggah Gambar QR Code / QRIS (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) return showAlertWarning('Terlalu Besar', 'Maksimal ukuran file 5MB!');
                      const reader = new FileReader();
                      reader.onloadend = () => setNewBank({ ...newBank, qr_code_url: reader.result });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 border rounded-xl bg-slate-50 text-xs"
                />
                {newBank.qr_code_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={newBank.qr_code_url} alt="Preview QR" className="w-16 h-16 object-contain rounded border p-1" />
                    <span className="text-[11px] text-emerald-700 font-bold">✅ QR Code Terpilih</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2.5 rounded-xl">Simpan Rekening</button>
                <button type="button" onClick={() => setShowAddBank(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT BANK / QRIS */}
      {editingBank && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Edit Rekening / QRIS</h3>
            <form onSubmit={handleEditBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Bank / E-Wallet / QRIS *</label>
                <input 
                  type="text" 
                  required 
                  value={editingBank.bank_name} 
                  onChange={e => setEditingBank({...editingBank, bank_name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Nomor Rekening / ID QRIS *</label>
                <input 
                  type="text" 
                  required 
                  value={editingBank.account_number} 
                  onChange={e => setEditingBank({...editingBank, account_number: e.target.value})}
                  className="w-full p-2.5 border rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Atas Nama (a.n.)</label>
                <input 
                  type="text" 
                  value={editingBank.account_holder} 
                  onChange={e => setEditingBank({...editingBank, account_holder: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              {/* Upload QR Code */}
              <div>
                <label className="font-bold block mb-1">Ganti Foto QR Code / QRIS</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) return showAlertWarning('Terlalu Besar', 'Maksimal ukuran file 5MB!');
                      const reader = new FileReader();
                      reader.onloadend = () => setEditingBank({ ...editingBank, qr_code_url: reader.result });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 border rounded-xl bg-slate-50 text-xs"
                />
                {editingBank.qr_code_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={editingBank.qr_code_url} alt="Preview QR" className="w-16 h-16 object-contain rounded border p-1" />
                    <span className="text-[11px] text-emerald-700 font-bold">✅ QR Code Siap Ditampilkan</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl">Update Rekening</button>
                <button type="button" onClick={() => setEditingBank(null)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
