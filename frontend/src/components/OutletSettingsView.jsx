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
  FolderOpen,
  Search,
  X,
  ArrowLeft,
  ChevronRight,
  Clock,
  Share2
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
  onExportData,
  services = [],
  setServices,
  perfumes = [],
  setPerfumes,
  currentTenant,
  loggedInStaff
}) {
  const [settingTab, setSettingTab] = useState('main');

  const activeTenantId = currentTenant?.id || loggedInStaff?.tenant_id || storeSettings?.tenant_id || 1;

  // Modal State
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ store_name: '', address: '', phone: '' });

  const [editingOutlet, setEditingOutlet] = useState(null);

  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', account_number: '', account_holder: '', qr_code_url: '' });
  const [editingBank, setEditingBank] = useState(null);

  // Service CRUD State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({ service_name: '', category: 'kiloan', price: '', unit: 'kg', duration_hours: 48 });
  const [editingService, setEditingService] = useState(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');

  // Parfum / Aroma CRUD State
  const [newParfumName, setNewParfumName] = useState('');
  const [editingParfum, setEditingParfum] = useState(null);

  const handleAddParfum = (e) => {
    e.preventDefault();
    if (!newParfumName.trim()) return showAlertWarning('Nama Kosong', 'Masukkan nama aroma parfum!');
    const nameVal = newParfumName.trim();

    fetch(`${API_BASE}/perfumes?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal, tenant_id: activeTenantId })
    })
      .then(res => res.json())
      .then(data => {
        const created = { id: data.id || Date.now(), tenant_id: activeTenantId, name: nameVal };
        if (setPerfumes) {
          setPerfumes(prev => [...prev, created]);
        }
        setNewParfumName('');
        showAlertSuccess('Aroma Ditambahkan', `Aroma "${created.name}" berhasil tersimpan permanen di database!`);
      })
      .catch(err => {
        console.log('DB perfume post error:', err);
        const created = { id: Date.now(), tenant_id: activeTenantId, name: nameVal };
        if (setPerfumes) setPerfumes(prev => [...prev, created]);
        setNewParfumName('');
        showAlertSuccess('Aroma Ditambahkan (Lokal)', `Aroma "${created.name}" tersimpan di memori!`);
      });
  };

  const handleEditParfumSubmit = (parfumId, newName) => {
    if (!newName.trim()) return;
    const nameVal = newName.trim();

    fetch(`${API_BASE}/perfumes/${parfumId}?tenant_id=${activeTenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal, tenant_id: activeTenantId })
    })
      .then(res => res.json())
      .then(() => {
        if (setPerfumes) {
          setPerfumes(prev => prev.map(x => String(x.id) === String(parfumId) ? { ...x, name: nameVal } : x));
        }
        setEditingParfum(null);
        showAlertSuccess('Aroma Diperbarui', `Aroma berhasil diubah menjadi "${nameVal}" di database!`);
      })
      .catch(err => {
        console.log('DB perfume put error:', err);
        if (setPerfumes) {
          setPerfumes(prev => prev.map(x => String(x.id) === String(parfumId) ? { ...x, name: nameVal } : x));
        }
        setEditingParfum(null);
        showAlertSuccess('Aroma Diperbarui (Lokal)', `Aroma diubah menjadi "${nameVal}"!`);
      });
  };

  const handleDeleteParfum = (parfum) => {
    const doDelete = () => {
      fetch(`${API_BASE}/perfumes/${parfum.id}?tenant_id=${activeTenantId}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(() => {
          if (setPerfumes) {
            setPerfumes(prev => prev.filter(p => String(p.id) !== String(parfum.id)));
          }
          showAlertSuccess('Aroma Dihapus', `Aroma "${parfum.name}" telah dihapus dari database.`);
        })
        .catch(err => {
          console.log('DB perfume delete error:', err);
          if (setPerfumes) {
            setPerfumes(prev => prev.filter(p => String(p.id) !== String(parfum.id)));
          }
          showAlertSuccess('Aroma Dihapus (Lokal)', `Aroma "${parfum.name}" dihapus.`);
        });
    };

    try {
      Swal.fire({
        title: `<span class="font-extrabold text-slate-800 text-base">Hapus Aroma ${parfum.name}?</span>`,
        html: `<p class="text-xs text-slate-600 mt-1">Yakin ingin menghapus aroma <b>"${parfum.name}"</b> dari database?</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        customClass: {
          confirmButton: 'bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs mx-1 cursor-pointer',
          cancelButton: 'bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs mx-1 cursor-pointer',
          popup: 'rounded-3xl p-6 font-sans shadow-2xl border z-[99999]'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result && result.isConfirmed) {
          doDelete();
        }
      });
    } catch (e) {
      if (window.confirm(`Hapus aroma "${parfum.name}"?`)) {
        doDelete();
      }
    }
  };

  // Service CRUD Handlers
  const handleAddServiceSubmit = (e) => {
    e.preventDefault();
    if (!newService.service_name || !newService.price) {
      return showAlertWarning('Form Incomplete', 'Nama Layanan dan Harga wajib diisi!');
    }

    const payload = {
      tenant_id: activeTenantId,
      service_name: newService.service_name,
      category: newService.category || 'kiloan',
      price: parseFloat(newService.price) || 0,
      unit: newService.unit || 'kg',
      duration_hours: parseInt(newService.duration_hours) || 48
    };

    fetch(`${API_BASE}/services?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        const created = {
          id: data.id || Date.now(),
          ...payload
        };
        if (setServices) {
          setServices(prev => [created, ...prev.filter(s => s.id !== created.id)]);
        }
        setShowAddServiceModal(false);
        setNewService({ service_name: '', category: 'kiloan', price: '', unit: 'kg', duration_hours: 48 });
        showAlertSuccess('Layanan Ditambahkan', `Layanan baru "${created.service_name}" berhasil tersimpan permanen di database!`);
      })
      .catch(err => {
        console.log('DB service error:', err);
        const created = { id: Date.now(), ...payload };
        if (setServices) {
          setServices(prev => [created, ...prev]);
        }
        setShowAddServiceModal(false);
        setNewService({ service_name: '', category: 'kiloan', price: '', unit: 'kg', duration_hours: 48 });
        showAlertSuccess('Layanan Ditambahkan (Lokal)', `Layanan "${created.service_name}" tersimpan di memori!`);
      });
  };

  const handleEditServiceSubmit = (e) => {
    e.preventDefault();
    if (!editingService.service_name || !editingService.price) {
      return showAlertWarning('Form Incomplete', 'Nama Layanan dan Harga wajib diisi!');
    }

    const payload = {
      tenant_id: activeTenantId,
      service_name: editingService.service_name,
      category: editingService.category || 'kiloan',
      price: parseFloat(editingService.price) || 0,
      unit: editingService.unit || 'kg',
      duration_hours: parseInt(editingService.duration_hours) || 48
    };

    fetch(`${API_BASE}/services/${editingService.id}?tenant_id=${activeTenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        if (setServices) {
          setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...payload } : s));
        }
        setEditingService(null);
        showAlertSuccess('Layanan Diperbarui', `Layanan "${payload.service_name}" berhasil diperbarui di database!`);
      })
      .catch(err => {
        console.log('DB service update error:', err);
        if (setServices) {
          setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...payload } : s));
        }
        setEditingService(null);
        showAlertSuccess('Layanan Diperbarui (Lokal)', `Layanan "${payload.service_name}" diperbarui di memori!`);
      });
  };

  const handleDeleteService = (service) => {
    const doDelete = () => {
      fetch(`${API_BASE}/services/${service.id}?tenant_id=${activeTenantId}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(() => {
          if (setServices) {
            setServices(prev => prev.filter(s => String(s.id) !== String(service.id)));
          }
          showAlertSuccess('Layanan Dihapus', `Layanan "${service.service_name}" telah dihapus dari database.`);
        })
        .catch(err => {
          console.log('DB service delete error:', err);
          if (setServices) {
            setServices(prev => prev.filter(s => String(s.id) !== String(service.id)));
          }
          showAlertSuccess('Layanan Dihapus (Lokal)', `Layanan "${service.service_name}" dihapus dari memori.`);
        });
    };

    try {
      Swal.fire({
        title: `<span class="font-extrabold text-slate-800 text-base">Hapus Layanan ${service.service_name}?</span>`,
        html: `<p class="text-xs text-slate-600 mt-1">Yakin ingin menghapus layanan <b>"${service.service_name}"</b> secara permanen dari database?</p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus Sekarang',
        cancelButtonText: 'Batal',
        customClass: {
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs mx-1 shadow transition cursor-pointer',
          cancelButton: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs mx-1 transition cursor-pointer',
          popup: 'rounded-3xl p-6 font-sans shadow-2xl border border-slate-200 z-[99999]'
        },
        buttonsStyling: false
      }).then((result) => {
        if (result && result.isConfirmed) {
          doDelete();
        }
      });
    } catch (e) {
      if (window.confirm(`Yakin ingin menghapus layanan "${service.service_name}"?`)) {
        doDelete();
      }
    }
  };

  const filteredServices = (services || []).filter(s => {
    const cat = (s.category || '').toLowerCase();
    const matchCat = serviceCategoryFilter === 'all' || cat === serviceCategoryFilter || (serviceCategoryFilter === 'express' && (cat === 'express' || cat === 'paket'));
    const matchQuery = !serviceSearch.trim() || s.service_name.toLowerCase().includes(serviceSearch.trim().toLowerCase());
    return matchCat && matchQuery;
  });

  // Handle Image File Upload From Device Memory & Auto Save to Database
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return showAlertWarning('File Terlalu Besar', 'Pilih file gambar logo dengan ukuran maksimal 5MB!');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...storeSettings, tenant_id: activeTenantId, logo_url: reader.result };
        setStoreSettings(updated);

        fetch(`${API_BASE}/settings?tenant_id=${activeTenantId}`, {
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
        const updated = { ...storeSettings, tenant_id: activeTenantId, banner_url: reader.result };
        setStoreSettings(updated);

        fetch(`${API_BASE}/settings?tenant_id=${activeTenantId}`, {
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
      tenant_id: activeTenantId,
      store_name: newOutlet.store_name,
      address: newOutlet.address || '-',
      phone: newOutlet.phone,
      maps_embed_url: newOutlet.maps_embed_url || null
    };

    setOutlets(prev => [...prev, created]);

    fetch(`${API_BASE}/outlets?tenant_id=${activeTenantId}`, {
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

    const updatedOutletObj = { ...editingOutlet, tenant_id: activeTenantId };
    const updatedOutlets = outlets.map(o => o.id === editingOutlet.id ? updatedOutletObj : o);
    setOutlets(updatedOutlets);

    fetch(`${API_BASE}/outlets/${editingOutlet.id}?tenant_id=${activeTenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOutletObj)
    }).catch(err => console.log('DB outlet update error:', err));

    if (activeOutletId === editingOutlet.id) {
      const updatedSettings = {
        ...storeSettings,
        tenant_id: activeTenantId,
        store_name: editingOutlet.store_name,
        address: editingOutlet.address,
        phone: editingOutlet.phone,
        maps_embed_url: editingOutlet.maps_embed_url
      };
      setStoreSettings(updatedSettings);

      fetch(`${API_BASE}/settings?tenant_id=${activeTenantId}`, {
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
      tenant_id: activeTenantId,
      bank_name: newBank.bank_name,
      account_number: newBank.account_number,
      account_holder: newBank.account_holder || '-',
      qr_code_url: newBank.qr_code_url || null
    };

    setBankAccounts([...bankAccounts, created]);

    fetch(`${API_BASE}/bank-accounts?tenant_id=${activeTenantId}`, {
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

    const updatedBankObj = { ...editingBank, tenant_id: activeTenantId };
    const updated = bankAccounts.map(b => b.id === editingBank.id ? updatedBankObj : b);
    setBankAccounts(updated);

    fetch(`${API_BASE}/bank-accounts/${editingBank.id}?tenant_id=${activeTenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBankObj)
    }).catch(err => console.log('DB bank update error:', err));

    setEditingBank(null);
    showAlertSuccess('Rekening / QRIS Diperbarui', `Metode pembayaran "${editingBank.bank_name}" berhasil diperbarui!`);
  };

  const handleDeleteBank = (bankId, bankName) => {
    const doDelete = () => {
      setBankAccounts(prev => prev.filter(b => b.id !== bankId));

      fetch(`${API_BASE}/bank-accounts/${bankId}?tenant_id=${activeTenantId}`, {
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
    const settingsPayload = { ...storeSettings, tenant_id: activeTenantId };

    if (outlets && outlets.length > 0) {
      const activeOutlet = outlets.find(o => o.id === Number(activeOutletId));
      if (activeOutlet) {
        const updatedOutlet = {
          ...activeOutlet,
          tenant_id: activeTenantId,
          store_name: storeSettings.store_name,
          address: storeSettings.address,
          phone: storeSettings.phone
        };
        setOutlets(outlets.map(o => o.id === activeOutlet.id ? updatedOutlet : o));
        fetch(`${API_BASE}/outlets/${activeOutlet.id}?tenant_id=${activeTenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOutlet)
        }).catch(err => console.log('DB outlet sync error:', err));
      }
    }

    fetch(`${API_BASE}/settings?tenant_id=${activeTenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsPayload)
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
    <div className="space-y-5 font-sans pb-8">
      
      {/* 1. MASTER SETTINGS LANDING MENU (JIKA BELUM MEMILIH SUB-MENU) */}
      {(!settingTab || settingTab === 'main') && (
        <div className="max-w-4xl mx-auto space-y-5">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-4 sm:p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <span className="bg-teal-700/80 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-500/30">
                ⚙️ Master Control Center
              </span>
              <h2 className="font-extrabold text-base sm:text-lg mt-1 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" /> Pusat Pengaturan Toko & System
              </h2>
              <p className="text-[11px] text-teal-100 mt-0.5 max-w-xl">
                Pilih salah satu menu pengaturan di bawah untuk mengedit profil, harga layanan, cabang outlet, logo, atau pembayaran.
              </p>
            </div>

            <div className="bg-teal-950/50 backdrop-blur border border-teal-700/50 p-2.5 rounded-xl text-[11px] space-y-0.5 shrink-0">
              <p className="font-bold text-amber-300">💡 Bebas Akses Fleksibel</p>
              <p className="text-[10px] text-teal-100">Tampilan simpel, proporsional & nyaman di HP, Tablet & Desktop.</p>
            </div>
          </div>

          {/* Grid Master Menu Pengaturan Compact Clean App Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[
              { 
                id: 'profile', 
                label: 'Profil Toko & Promo', 
                icon: Building2, 
                desc: 'Nama toko, No. WA, pin lokasi Maps, & promo diskon member', 
                color: 'bg-teal-700 text-amber-300',
                border: 'hover:border-teal-500'
              },
              { 
                id: 'services', 
                label: 'Katalog Layanan', 
                icon: Shirt, 
                desc: 'Kelola harga & jenis paket Cucian Kiloan, Satuan, dan Express', 
                badge: `${services.length} Layanan`,
                color: 'bg-indigo-700 text-white',
                border: 'hover:border-indigo-500'
              },
              { 
                id: 'parfums',
                label: 'Aroma Parfum',
                icon: Sparkles,
                desc: 'Kelola daftar varian aroma parfum cucian yang tersedia',
                badge: `${perfumes.length} Varian`,
                color: 'bg-pink-600 text-white',
                border: 'hover:border-pink-400'
              },
              { 
                id: 'outlets', 
                label: 'Cabang Outlet', 
                icon: FolderOpen, 
                desc: 'Kelola data cabang outlet laundry dan lokasi operasional', 
                badge: `${outlets.length} Cabang`,
                color: 'bg-blue-700 text-white',
                border: 'hover:border-blue-500'
              },
              { 
                id: 'theme', 
                label: 'Logo & Banner Web', 
                icon: Image, 
                desc: 'Upload file logo toko dan foto hero banner promosi', 
                color: 'bg-amber-600 text-white',
                border: 'hover:border-amber-500'
              },
              { 
                id: 'bank', 
                label: 'Rekening & QRIS', 
                icon: CreditCard, 
                desc: 'Tambah/edit nomor rekening bank & upload QRIS pembayaran', 
                badge: `${bankAccounts.length} Rekening`,
                color: 'bg-emerald-700 text-white',
                border: 'hover:border-emerald-500'
              },
              { 
                id: 'receipt', 
                label: 'Ukuran Font Struk', 
                icon: Printer, 
                desc: 'Atur ukuran huruf font cetak nota thermal (58mm / 80mm)', 
                color: 'bg-purple-700 text-white',
                border: 'hover:border-purple-500'
              },
              { 
                id: 'backup', 
                label: 'Backup & Database', 
                icon: Database, 
                desc: 'Unduh file cadangan JSON transaksi & reset sistem', 
                color: 'bg-rose-700 text-white',
                border: 'hover:border-rose-500'
              },
            ].map(item => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSettingTab(item.id)}
                  className={`bg-white p-3.5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer ${item.border}`}
                >
                  <div className="flex justify-between items-center">
                    <div className={`p-2 rounded-xl ${item.color} shadow-sm transition transform group-hover:scale-105`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border">
                          {item.badge}
                        </span>
                      )}
                      <div className="p-1 rounded-full bg-slate-100 text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-700 transition">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-teal-700 transition">{item.label}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{item.desc}</p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-[11px] font-extrabold text-teal-700 group-hover:translate-x-0.5 transition">
                    <span>Buka Pengaturan</span>
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. HEADER TOP BAR SUB-NAVIGASI TERINTEGRASI & SIMPEL */}
      {settingTab && settingTab !== 'main' && (
        <div className="max-w-4xl mx-auto mb-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/80 shrink-0">
                {settingTab === 'profile' && <Building2 className="w-4 h-4" />}
                {settingTab === 'services' && <Shirt className="w-4 h-4 text-indigo-600" />}
                {settingTab === 'parfums' && <Sparkles className="w-4 h-4 text-pink-600" />}
                {settingTab === 'outlets' && <FolderOpen className="w-4 h-4 text-blue-600" />}
                {settingTab === 'theme' && <Image className="w-4 h-4 text-amber-600" />}
                {settingTab === 'bank' && <CreditCard className="w-4 h-4 text-emerald-600" />}
                {settingTab === 'receipt' && <Printer className="w-4 h-4 text-purple-600" />}
                {settingTab === 'backup' && <Database className="w-4 h-4 text-rose-600" />}
              </div>
              
              <div>
                <h2 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight">
                  {settingTab === 'profile' && 'Profil Toko & Promo Member'}
                  {settingTab === 'services' && 'Katalog Layanan Laundry'}
                  {settingTab === 'parfums' && 'Varian Aroma Parfum'}
                  {settingTab === 'outlets' && 'Cabang Outlet Operasional'}
                  {settingTab === 'theme' && 'Logo & Hero Banner Website'}
                  {settingTab === 'bank' && 'Rekening Bank & QRIS'}
                  {settingTab === 'receipt' && 'Ukuran Font Nota Struk'}
                  {settingTab === 'backup' && 'Backup Data & Reset Sistem'}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">Pengaturan Toko / {settingTab}</p>
              </div>
            </div>
          </div>

          {/* Akses Tombol Aksi Langsung di Header Sub-Menu */}
          {settingTab === 'services' && (
            <button 
              onClick={() => setShowAddServiceModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Tambah Layanan Baru
            </button>
          )}
          {settingTab === 'outlets' && (
            <button 
              onClick={() => setShowAddOutlet(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Buat Outlet Baru
            </button>
          )}
          {settingTab === 'bank' && (
            <button 
              onClick={() => setShowAddBank(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Tambah Rekening / QRIS
            </button>
          )}
        </div>
      )}

      {/* 0. PROFIL TOKO & PROMO MEMBER */}
      {settingTab === 'profile' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-5">
            <div className="border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-teal-600" /> Informasi Utama Toko & Promo Member
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Ubah nama toko, slogan website, nomor WhatsApp, dan nominal diskon member</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko / Laundry</label>
                  <input 
                    type="text" 
                    value={storeSettings.store_name || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition bg-white"
                    placeholder="Contoh: Laundry Fresh & Clean"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / Telepon Toko</label>
                  <input 
                    type="text" 
                    value={storeSettings.phone || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition bg-white"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Tagline Website</label>
                <input 
                  type="text" 
                  value={storeSettings.tagline || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition bg-white"
                  placeholder="Contoh: Solusi Pakaian Bersih, Rapi & Harum Premium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Toko</label>
                <textarea 
                  rows="2"
                  value={storeSettings.address || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition bg-white"
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

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3">
                <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Pengaturan Promo Member & Point Reward
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Diskon Member Baru (Rp)</label>
                    <input 
                      type="number" 
                      value={storeSettings.first_member_discount || 10000}
                      onChange={(e) => setStoreSettings({ ...storeSettings, first_member_discount: Number(e.target.value) })}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Batas Syarat Poin</label>
                    <input 
                      type="number" 
                      value={storeSettings.point_redeem_threshold || 10}
                      onChange={(e) => setStoreSettings({ ...storeSettings, point_redeem_threshold: Number(e.target.value) })}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Potongan Poin (Rp)</label>
                    <input 
                      type="number" 
                      value={storeSettings.point_redeem_discount || 10000}
                      onChange={(e) => setStoreSettings({ ...storeSettings, point_redeem_discount: Number(e.target.value) })}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
              {/* Jam Operasional Buka & Tutup Toko Card */}
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 space-y-3">
                <h4 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> Pengaturan Jam Operasional Buka & Tutup Toko
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Hari Operasional</label>
                    <input 
                      type="text" 
                      value={storeSettings.operating_days || 'Senin - Minggu'}
                      onChange={(e) => {
                        const days = e.target.value;
                        const openT = storeSettings.open_time || '07:00';
                        const closeT = storeSettings.close_time || '21:00';
                        setStoreSettings({
                          ...storeSettings,
                          operating_days: days,
                          operating_hours: `${days}: ${openT} - ${closeT} WIB`
                        });
                      }}
                      className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Contoh: Senin - Minggu"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Jam Buka Toko (WIB)</label>
                    <input 
                      type="time" 
                      value={storeSettings.open_time || '07:00'}
                      onChange={(e) => {
                        const openT = e.target.value;
                        const days = storeSettings.operating_days || 'Senin - Minggu';
                        const closeT = storeSettings.close_time || '21:00';
                        setStoreSettings({
                          ...storeSettings,
                          open_time: openT,
                          operating_hours: `${days}: ${openT} - ${closeT} WIB`
                        });
                      }}
                      className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Jam Tutup Toko (WIB)</label>
                    <input 
                      type="time" 
                      value={storeSettings.close_time || '21:00'}
                      onChange={(e) => {
                        const closeT = e.target.value;
                        const days = storeSettings.operating_days || 'Senin - Minggu';
                        const openT = storeSettings.open_time || '07:00';
                        setStoreSettings({
                          ...storeSettings,
                          close_time: closeT,
                          operating_hours: `${days}: ${openT} - ${closeT} WIB`
                        });
                      }}
                      className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">Preview Teks Jam Operasional (Tampil di Website)</label>
                  <input 
                    type="text" 
                    value={storeSettings.operating_hours || 'Senin - Minggu: 07:00 - 21:00 WIB'}
                    onChange={(e) => setStoreSettings({ ...storeSettings, operating_hours: e.target.value })}
                    className="w-full p-2.5 border border-indigo-200 rounded-xl bg-white text-xs font-semibold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: Senin - Minggu: 07:00 - 21:00 WIB"
                  />
                </div>
              </div>

              {/* Pengaturan Link Media Sosial Toko Card */}
              <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200/80 space-y-3">
                <h4 className="font-extrabold text-teal-900 text-xs flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-teal-600" /> Pengaturan Link Media Sosial Toko
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-teal-900 mb-1">Link Instagram Toko</label>
                    <input 
                      type="url" 
                      value={storeSettings.social_instagram || 'https://instagram.com'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, social_instagram: e.target.value })}
                      className="w-full p-2.5 border border-teal-200 rounded-xl bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="https://instagram.com/nama_toko"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900 mb-1">Link Facebook Toko</label>
                    <input 
                      type="url" 
                      value={storeSettings.social_facebook || 'https://facebook.com'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, social_facebook: e.target.value })}
                      className="w-full p-2.5 border border-teal-200 rounded-xl bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="https://facebook.com/nama_toko"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900 mb-1">Link TikTok Toko</label>
                    <input 
                      type="url" 
                      value={storeSettings.social_tiktok || 'https://tiktok.com'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, social_tiktok: e.target.value })}
                      className="w-full p-2.5 border border-teal-200 rounded-xl bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="https://tiktok.com/@nama_toko"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-900 mb-1">Hotline WhatsApp Toko</label>
                    <input 
                      type="text" 
                      value={storeSettings.social_whatsapp || storeSettings.phone || '081234567890'}
                      onChange={(e) => setStoreSettings({ ...storeSettings, social_whatsapp: e.target.value })}
                      className="w-full p-2.5 border border-teal-200 rounded-xl bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Simpan Perubahan Profil & Sosmed Toko
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 0.5. KATALOG LAYANAN LAUNDRY (KILOAN, SATUAN, PAKET) */}
      {settingTab === 'services' && (
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Filter Bar & Search */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'Semua Layanan' },
                { id: 'kiloan', label: '🧺 Kiloan' },
                { id: 'satuan', label: '👔 Satuan' },
                { id: 'express', label: '⚡ Paket / Express' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setServiceCategoryFilter(cat.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-extrabold transition border cursor-pointer ${
                    serviceCategoryFilter === cat.id 
                      ? 'bg-teal-800 text-white border-teal-800 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cari Layanan..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-semibold bg-slate-50"
              />
            </div>
          </div>

          {/* Services List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredServices.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border border-slate-200/80">
                Tidak ada layanan yang sesuai. Klik "Tambah Layanan Baru" untuk membuat harga baru.
              </div>
            ) : (
              filteredServices.map((srv, idx) => (
                <div key={srv.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3 relative hover:border-teal-400 transition">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                      srv.category === 'kiloan' 
                        ? 'bg-teal-100 text-teal-800' 
                        : srv.category === 'satuan' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {srv.category === 'kiloan' ? '🧺 Kiloan' : srv.category === 'satuan' ? '👔 Satuan' : '⚡ Paket / Express'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{srv.service_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Estimasi: <b>{srv.duration_hours || 48} Jam</b></p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400">Harga / {srv.unit}:</span>
                      <p className="text-sm font-black text-teal-700">Rp {srv.price.toLocaleString('id-ID')}</p>
                    </div>

                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setEditingService(srv)}
                        className="p-2 bg-slate-100 hover:bg-teal-100 text-teal-800 rounded-xl transition cursor-pointer"
                        title="Edit Layanan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteService(srv)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer border border-red-100"
                        title="Hapus Layanan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PARFUM / AROMA SECTION */}
      {settingTab === 'parfums' && (
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Add New Parfum Form */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-600" /> Tambah Varian Aroma Parfum Baru
            </h4>
            <form onSubmit={handleAddParfum} className="flex gap-2">
              <input
                type="text"
                value={newParfumName}
                onChange={(e) => setNewParfumName(e.target.value)}
                placeholder="Nama aroma, contoh: Jasmine White..."
                className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-400 bg-white"
              />
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </form>
          </div>

          {/* Parfum List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {perfumes.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
                Belum ada varian aroma. Tambahkan di atas.
              </div>
            ) : (
              perfumes.map((p, idx) => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center">
                  {editingParfum?.id === p.id ? (
                    <div className="flex flex-1 gap-2 mr-2">
                      <input
                        type="text"
                        value={editingParfum.name}
                        onChange={(e) => setEditingParfum({ ...editingParfum, name: e.target.value })}
                        className="flex-1 p-2 border rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditParfumSubmit(p.id, editingParfum.name)}
                        className="bg-teal-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingParfum(null)}
                        className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs sm:text-sm">🌸 {p.name}</p>
                      </div>
                    </div>
                  )}

                  {editingParfum?.id !== p.id && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingParfum({ ...p })}
                        className="p-2 bg-slate-100 hover:bg-amber-100 text-amber-700 rounded-xl transition cursor-pointer"
                        title="Edit Aroma"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteParfum(p)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer border border-red-100"
                        title="Hapus Aroma"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 1. PENGATURAN OUTLET & EDIT OUTLET */}
      {settingTab === 'outlets' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {outlets.map(out => (
              <div 
                key={out.id} 
                className={`p-4 rounded-2xl border transition shadow-sm space-y-3 flex flex-col justify-between ${
                  activeOutletId === out.id ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20' : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight">{out.store_name}</h4>
                    {activeOutletId === out.id && (
                      <span className="bg-teal-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5 shrink-0">
                        <Check className="w-3 h-3" /> Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">📞 {out.phone}</p>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">📍 {out.address}</p>
                </div>

                <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingOutlet({ ...out })}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
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
                      className="flex-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold py-2 rounded-xl transition shadow-sm cursor-pointer"
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

      {/* 2. PENGATURAN LOGO & BANNER DEPAN DEVICEMEMORY / FILE UPLOAD */}
      {settingTab === 'theme' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b pb-3 flex items-center gap-2">
              <Image className="w-4.5 h-4.5 text-teal-600" /> Upload Gambar Logo & Banner Perangkat
            </h3>

            <div className="space-y-5 text-xs">
              
              {/* Logo Customizer */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block text-xs sm:text-sm">Gambar Logo Toko Laundry</label>
                  <p className="text-slate-500 text-[11px] mt-0.5">Tampil di navbar header atas & nota struk.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img 
                    src={storeSettings.logo_url && storeSettings.logo_url.startsWith('/images/') ? storeSettings.logo_url.slice(1) : (storeSettings.logo_url || 'images/laundry_logo.png')} 
                    alt="Logo Store" 
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 bg-teal-950 p-1 shadow-sm shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
                  />
                  
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex gap-2">
                      <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-2 rounded-xl cursor-pointer shadow-sm transition flex items-center gap-2 text-xs">
                        <FolderOpen className="w-4 h-4" /> Ambil Gambar Dari Perangkat
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
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="Atau tempel URL Gambar Online di sini..."
                    />
                  </div>
                </div>
              </div>

              {/* Banner Customizer */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block text-xs sm:text-sm">Gambar Banner Depan Website (Hero Banner)</label>
                  <p className="text-slate-500 text-[11px] mt-0.5">Tampil penuh sebagai spanduk latar depan website utama.</p>
                </div>

                <div className="space-y-3">
                  <div className="h-40 sm:h-44 w-full rounded-2xl overflow-hidden border-2 border-amber-400 relative bg-teal-900 shadow-sm">
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
                    <label className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-2 rounded-xl cursor-pointer shadow-sm transition flex items-center gap-2 text-xs">
                      <Upload className="w-4 h-4" /> Pilih File Banner Dari Perangkat
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleBannerFileChange}
                        className="hidden" 
                      />
                    </label>

                    <button
                      onClick={() => setStoreSettings({ ...storeSettings, banner_url: 'images/laundry_hero_banner.png' })}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      Gunakan Default
                    </button>
                  </div>

                  <input 
                    type="text" 
                    value={storeSettings.banner_url || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, banner_url: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Atau tempel URL Gambar Online di sini..."
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Simpan Gambar Logo & Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REKENING BANK & QRIS */}
      {settingTab === 'bank' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {bankAccounts.map(b => (
              <div key={b.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-teal-800 text-xs sm:text-sm">{b.bank_name}</span>
                    <CreditCard className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-base font-black font-mono text-slate-900">{b.account_number}</p>
                  <p className="text-xs text-slate-500">a.n. {b.account_holder}</p>

                  {/* QR Code Image Preview */}
                  {b.qr_code_url ? (
                    <div className="pt-2 border-t border-slate-100 flex flex-col items-center">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Gambar QR Code / QRIS:</p>
                      <img 
                        src={b.qr_code_url} 
                        alt={`QR Code ${b.bank_name}`} 
                        className="w-28 h-28 object-contain rounded-xl border bg-slate-50 p-1"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 italic">Belum ada foto QR Code</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingBank({ ...b })}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteBank(b.id, b.bank_name)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-2 rounded-xl transition flex items-center justify-center gap-1 border border-red-200 cursor-pointer"
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
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Controls */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b pb-3 flex items-center gap-2">
              <Printer className="w-4.5 h-4.5 text-teal-600" /> Pengaturan Nota Struk Thermal & Font Size
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ukuran Font Kertas Thermal Struk</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '58mm', name: '58mm (Kecil)' },
                    { id: '80mm', name: '80mm (Standar)' },
                    { id: 'large', name: 'Besar (Jelas)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setReceiptFontSize(f.id);
                        const updated = { ...storeSettings, receipt_font_size: f.id, tenant_id: activeTenantId };
                        setStoreSettings(updated);
                        try { localStorage.setItem('receiptFontSize', f.id); } catch (e) {}

                        fetch(`${API_BASE}/settings?tenant_id=${activeTenantId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updated)
                        }).catch(err => console.log('DB paper size save error:', err));
                      }}
                      className={`p-2.5 rounded-xl border font-bold text-center text-xs transition cursor-pointer ${
                        receiptFontSize === f.id ? 'bg-teal-700 text-white border-teal-700 shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Header Nota (Atas)</label>
                <input 
                  type="text" 
                  value={storeSettings.header_receipt_note || 'Nota Resmi Pembayaran Laundry'}
                  onChange={(e) => setStoreSettings({ ...storeSettings, header_receipt_note: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Footer Nota (Bawah)</label>
                <textarea 
                  rows="2"
                  value={storeSettings.footer_receipt_note || 'Terima kasih telah mempercayakan pakaian Anda kepada kami!'}
                  onChange={(e) => setStoreSettings({ ...storeSettings, footer_receipt_note: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3 rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                Simpan Pengaturan Nota
              </button>
            </div>
          </div>

          {/* LIVE RECEIPT PREVIEW */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b pb-3 mb-3 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" /> Preview Struk Nota (Live)
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
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base border-b pb-3 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-teal-600" /> Backup Data & Reset System
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-teal-50/70 p-5 rounded-2xl border border-teal-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-teal-900 text-xs sm:text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-teal-700" /> Export Backup Data (JSON)
                  </h4>
                  <p className="text-xs text-teal-800 mt-1">
                    Unduh seluruh cadangan data transaksi, pelanggan, layanan, dan pengaturan ke file JSON.
                  </p>
                </div>
                <button 
                  onClick={onExportData}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Backup JSON
                </button>
              </div>

              <div className="bg-red-50/70 p-5 rounded-2xl border border-red-200/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-red-900 text-xs sm:text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-700" /> Reset Data Aplikasi
                  </h4>
                  <p className="text-xs text-red-800 mt-1">
                    Kembalikan data transaksi ke data awal bawaan aplikasi (Gunakan jika ingin memulai dari awal).
                  </p>
                </div>
                <button 
                  onClick={onResetData}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Ke Data Awal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT OUTLET */}
      {editingOutlet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                <Edit className="w-4.5 h-4.5 text-amber-500" /> Edit Data Outlet Cabang
              </h3>
              <button onClick={() => setEditingOutlet(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditOutletSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Outlet Cabang *</label>
                <input 
                  type="text" 
                  required 
                  value={editingOutlet.store_name} 
                  onChange={e => setEditingOutlet({...editingOutlet, store_name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Outlet *</label>
                <input 
                  type="tel" 
                  required 
                  value={editingOutlet.phone} 
                  onChange={e => setEditingOutlet({...editingOutlet, phone: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700">Alamat Lengkap Outlet</label>
                  {editingOutlet.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editingOutlet.address)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] text-teal-700 font-extrabold flex items-center gap-0.5 hover:underline"
                    >
                      📍 Pin Lokasi Di Maps ↗
                    </a>
                  )}
                </div>
                <textarea 
                  rows="2" 
                  value={editingOutlet.address} 
                  onChange={e => setEditingOutlet({...editingOutlet, address: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Jl. Raya Dago No. 88, Bandung"
                ></textarea>
              </div>

              {/* Interactive Draggable Pin Map Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">📍 Geser Pin Merah Untuk Atur Lokasi Outlet</label>
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

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingOutlet(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer">Update Outlet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH OUTLET */}
      {showAddOutlet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-4.5 h-4.5 text-blue-600" /> Buat Outlet Cabang Baru
              </h3>
              <button onClick={() => setShowAddOutlet(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOutletSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Outlet Cabang *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Misal: Fresh & Clean Cabang 2"
                  value={newOutlet.store_name} 
                  onChange={e => setNewOutlet({...newOutlet, store_name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Outlet *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="081234567890"
                  value={newOutlet.phone} 
                  onChange={e => setNewOutlet({...newOutlet, phone: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Outlet</label>
                <textarea 
                  rows="2" 
                  value={newOutlet.address} 
                  onChange={e => setNewOutlet({...newOutlet, address: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Jl. Raya Juanda No. 88, Bandung"
                ></textarea>
              </div>

              {/* Interactive Draggable Pin Map Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">📍 Geser Pin Merah Untuk Atur Lokasi Outlet</label>
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

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddOutlet(false)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer">Simpan Outlet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BANK / QRIS */}
      {showAddBank && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-emerald-600" /> Tambah Rekening / QRIS
              </h3>
              <button onClick={() => setShowAddBank(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bank / E-Wallet / QRIS *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="BCA / Mandiri / QRIS ShopeePay / QRIS BCA"
                  value={newBank.bank_name} 
                  onChange={e => setNewBank({...newBank, bank_name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rekening / ID QRIS *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="1234567890"
                  value={newBank.account_number} 
                  onChange={e => setNewBank({...newBank, account_number: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Atas Nama (a.n.)</label>
                <input 
                  type="text" 
                  placeholder="Laundry Fresh & Clean"
                  value={newBank.account_holder} 
                  onChange={e => setNewBank({...newBank, account_holder: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Upload QR Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unggah Gambar QR Code / QRIS (Opsional)</label>
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
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                />
                {newBank.qr_code_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={newBank.qr_code_url} alt="Preview QR" className="w-16 h-16 object-contain rounded border p-1" />
                    <span className="text-[11px] text-emerald-700 font-bold">✅ QR Code Terpilih</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddBank(false)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer">Simpan Rekening</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT BANK / QRIS */}
      {editingBank && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                <Edit className="w-4.5 h-4.5 text-amber-500" /> Edit Rekening / QRIS
              </h3>
              <button onClick={() => setEditingBank(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bank / E-Wallet / QRIS *</label>
                <input 
                  type="text" 
                  required 
                  value={editingBank.bank_name} 
                  onChange={e => setEditingBank({...editingBank, bank_name: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rekening / ID QRIS *</label>
                <input 
                  type="text" 
                  required 
                  value={editingBank.account_number} 
                  onChange={e => setEditingBank({...editingBank, account_number: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Atas Nama (a.n.)</label>
                <input 
                  type="text" 
                  value={editingBank.account_holder} 
                  onChange={e => setEditingBank({...editingBank, account_holder: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Upload QR Code */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ganti Foto QR Code / QRIS</label>
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
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                />
                {editingBank.qr_code_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={editingBank.qr_code_url} alt="Preview QR" className="w-16 h-16 object-contain rounded border p-1" />
                    <span className="text-[11px] text-emerald-700 font-bold">✅ QR Code Siap Ditampilkan</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingBank(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer">Update Rekening</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH LAYANAN LAUNDRY */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <Shirt className="w-4.5 h-4.5 text-teal-600" /> Tambah Layanan Laundry Baru
              </h3>
              <button onClick={() => setShowAddServiceModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Layanan Laundry *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Cuci Komplit Reguler / Bed Cover Jumbo" 
                  value={newService.service_name}
                  onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Layanan *</label>
                  <select 
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="kiloan">🧺 Kiloan</option>
                    <option value="satuan">👔 Satuan</option>
                    <option value="express">⚡ Paket / Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Unit *</label>
                  <select 
                    value={newService.unit}
                    onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="kg">kg (Kiloan)</option>
                    <option value="pcs">pcs (Potong)</option>
                    <option value="pasang">pasang (Sepatu/Kaos Kaki)</option>
                    <option value="m2">m2 (Meter Persegi/Karpet)</option>
                    <option value="meter">meter (Panjang/Gorden)</option>
                    <option value="paket">paket (Paket Khusus)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp) *</label>
                  <input 
                    type="number" 
                    placeholder="7000" 
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Jam)</label>
                  <input 
                    type="number" 
                    placeholder="48" 
                    value={newService.duration_hours}
                    onChange={(e) => setNewService({ ...newService, duration_hours: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddServiceModal(false)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT LAYANAN LAUNDRY */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <Edit className="w-4.5 h-4.5 text-teal-600" /> Edit Layanan Laundry
              </h3>
              <button onClick={() => setEditingService(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditServiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Layanan Laundry *</label>
                <input 
                  type="text" 
                  value={editingService.service_name}
                  onChange={(e) => setEditingService({ ...editingService, service_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Layanan *</label>
                  <select 
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="kiloan">🧺 Kiloan</option>
                    <option value="satuan">👔 Satuan</option>
                    <option value="express">⚡ Paket / Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Unit *</label>
                  <select 
                    value={editingService.unit}
                    onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="kg">kg (Kiloan)</option>
                    <option value="pcs">pcs (Potong)</option>
                    <option value="pasang">pasang (Sepatu/Kaos Kaki)</option>
                    <option value="m2">m2 (Meter Persegi/Karpet)</option>
                    <option value="meter">meter (Panjang/Gorden)</option>
                    <option value="paket">paket (Paket Khusus)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp) *</label>
                  <input 
                    type="number" 
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Jam)</label>
                  <input 
                    type="number" 
                    value={editingService.duration_hours}
                    onChange={(e) => setEditingService({ ...editingService, duration_hours: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingService(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">
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
