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
import { showAlertSuccess, showAlertWarning } from '../utils/swalAlert';

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
  const [settingTab, setSettingTab] = useState('outlets');

  // Modal State
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ store_name: '', address: '', phone: '' });

  const [editingOutlet, setEditingOutlet] = useState(null);

  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', account_number: '', account_holder: '' });

  // Handle Image File Upload From Device Memory
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return showAlertWarning('File Terlalu Besar', 'Pilih file gambar logo dengan ukuran maksimal 5MB!');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreSettings(prev => ({ ...prev, logo_url: reader.result }));
        showAlertSuccess('Logo Dipilih', 'Gambar logo baru berhasil dimuat dari memori perangkat!');
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
        setStoreSettings(prev => ({ ...prev, banner_url: reader.result }));
        showAlertSuccess('Banner Dipilih', 'Gambar banner hero depan berhasil dimuat dari memori perangkat!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOutletSubmit = (e) => {
    e.preventDefault();
    if (!newOutlet.store_name || !newOutlet.phone) return showAlertWarning('Form Incomplete', 'Lengkapi nama dan telepon outlet!');
    const created = {
      id: Date.now(),
      store_name: newOutlet.store_name,
      address: newOutlet.address || '-',
      phone: newOutlet.phone
    };

    setOutlets([...outlets, created]);

    fetch(`http://${window.location.hostname}:5000/api/outlets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB outlet error:', err));

    setNewOutlet({ store_name: '', address: '', phone: '' });
    setShowAddOutlet(false);
    showAlertSuccess('Outlet Dibuat', `Outlet cabang baru "${created.store_name}" berhasil disimpan!`);
  };

  const handleEditOutletSubmit = (e) => {
    e.preventDefault();
    if (!editingOutlet.store_name || !editingOutlet.phone) return showAlertWarning('Form Incomplete', 'Lengkapi nama dan telepon outlet!');

    setOutlets(outlets.map(o => o.id === editingOutlet.id ? editingOutlet : o));

    if (activeOutletId === editingOutlet.id) {
      setStoreSettings(prev => ({
        ...prev,
        store_name: editingOutlet.store_name,
        address: editingOutlet.address,
        phone: editingOutlet.phone
      }));
    }

    fetch(`http://${window.location.hostname}:5000/api/outlets/${editingOutlet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingOutlet)
    }).catch(err => console.log('DB outlet update error:', err));

    setEditingOutlet(null);
    showAlertSuccess('Outlet Diperbarui', `Data outlet "${editingOutlet.store_name}" berhasil diubah!`);
  };

  const handleAddBankSubmit = (e) => {
    e.preventDefault();
    if (!newBank.bank_name || !newBank.account_number) return showAlertWarning('Form Incomplete', 'Lengkapi data rekening bank!');
    const created = {
      id: Date.now(),
      bank_name: newBank.bank_name,
      account_number: newBank.account_number,
      account_holder: newBank.account_holder || '-'
    };

    setBankAccounts([...bankAccounts, created]);

    fetch(`http://${window.location.hostname}:5000/api/bank-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB bank error:', err));

    setNewBank({ bank_name: '', account_number: '', account_holder: '' });
    setShowAddBank(false);
    showAlertSuccess('Rekening Ditambahkan', `Rekening ${created.bank_name} (${created.account_number}) berhasil disimpan!`);
  };

  const handleSaveSettings = () => {
    fetch(`http://${window.location.hostname}:5000/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeSettings)
    }).catch(err => console.log('DB settings error:', err));

    showAlertSuccess('Pengaturan Disimpan', 'Pengaturan outlet, logo, banner hero, & nota berhasil disimpan!');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" /> Pengaturan Outlet, Logo, Banner & Nota
          </h2>
          <p className="text-xs text-slate-500">Kelola cabang outlet, upload gambar logo & banner dari memori perangkat, serta backup data</p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border">
          <button 
            onClick={() => setSettingTab('outlets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              settingTab === 'outlets' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Edit & Cabang Outlet ({outlets.length})
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
            Font Nota Struk
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
                        setStoreSettings(prev => ({ ...prev, store_name: out.store_name, address: out.address, phone: out.phone }));
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
                  src={storeSettings.logo_url || '/images/laundry_logo.png'} 
                  alt="Logo Store" 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 bg-teal-950 p-1 shadow shrink-0"
                  onError={(e) => { e.target.src = '/images/laundry_logo.png'; }}
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
                    src={storeSettings.banner_url || '/images/laundry_hero_banner.png'} 
                    alt="Banner Depan Website" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/images/laundry_hero_banner.png'; }}
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
                    onClick={() => setStoreSettings({ ...storeSettings, banner_url: '/images/laundry_hero_banner.png' })}
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
              <h3 className="font-extrabold text-slate-800 text-base">Akun Keuangan & Rekening Bank</h3>
              <p className="text-xs text-slate-500">Nomor rekening transfer dan QRIS pembayaran pelanggan</p>
            </div>
            <button 
              onClick={() => setShowAddBank(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-4 h-4" /> Tambah Rekening
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(b => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-teal-800 text-sm">{b.bank_name}</span>
                  <CreditCard className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-lg font-black font-mono text-slate-900">{b.account_number}</p>
                <p className="text-xs text-slate-500">a.n. {b.account_holder}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PENGATURAN NOTA & UKURAN FONT THERMAL */}
      {settingTab === 'receipt' && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-sm border space-y-6">
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
                <label className="font-bold block mb-1">Alamat Outlet</label>
                <textarea 
                  rows="2" 
                  value={editingOutlet.address} 
                  onChange={e => setEditingOutlet({...editingOutlet, address: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                ></textarea>
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
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
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
                ></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2.5 rounded-xl">Simpan Outlet</button>
                <button type="button" onClick={() => setShowAddOutlet(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BANK */}
      {showAddBank && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Tambah Rekening Pembayaran</h3>
            <form onSubmit={handleAddBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Bank / E-Wallet *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="BCA / Mandiri / QRIS ShopeePay"
                  value={newBank.bank_name} 
                  onChange={e => setNewBank({...newBank, bank_name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Nomor Rekening / HP *</label>
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
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2.5 rounded-xl">Simpan Rekening</button>
                <button type="button" onClick={() => setShowAddBank(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
