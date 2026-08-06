import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Plus, 
  ShieldCheck, 
  Calendar, 
  Star, 
  Wallet, 
  UserPlus, 
  LogIn, 
  LogOut,
  CheckCircle,
  Briefcase,
  Layers,
  Search,
  Hash,
  Shirt,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { showAlertSuccess, showAlertWarning, showAlertError, showConfirmModal } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

export default function ManagementView({ 
  customers = [], 
  setCustomers, 
  employees = [], 
  setEmployees, 
  attendances = [], 
  setAttendances,
  services = [],
  setServices,
  currentTenant,
  storeSettings = {}
}) {
  const [mgmtTab, setMgmtTab] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTenantId = currentTenant?.id || storeSettings?.tenant_id || 1;

  // Modal State
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', password: '123' });
  
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: 'Kasir', phone: '', salary: 2500000 });

  const [showTopupDeposit, setShowTopupDeposit] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');

  // Attendance Clock-in State
  const [selectedEmpAttendance, setSelectedEmpAttendance] = useState(employees[0]?.id || '');

  // Service Management State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({ service_name: '', category: 'kiloan', price: '', unit: 'kg', duration_hours: 48 });
  const [editingService, setEditingService] = useState(null);

  // Filtered lists
  const query = searchQuery.trim().toLowerCase();

  const filteredCustomers = customers.filter(c => {
    if (!query) return true;
    return (c.name && c.name.toLowerCase().includes(query)) ||
           (c.phone && c.phone.includes(query)) ||
           (c.address && c.address.toLowerCase().includes(query));
  });

  const filteredEmployees = employees.filter(e => {
    if (!query) return true;
    return (e.name && e.name.toLowerCase().includes(query)) ||
           (e.role && e.role.toLowerCase().includes(query)) ||
           (e.phone && e.phone.includes(query));
  });

  const filteredAttendances = attendances.filter(a => {
    if (!query) return true;
    return (a.employee_name && a.employee_name.toLowerCase().includes(query)) ||
           (a.role && a.role.toLowerCase().includes(query)) ||
           (a.date && a.date.includes(query));
  });

  const filteredServices = (services || []).filter(s => {
    if (!query) return true;
    return (s.service_name && s.service_name.toLowerCase().includes(query)) ||
           (s.category && s.category.toLowerCase().includes(query)) ||
           (s.unit && s.unit.toLowerCase().includes(query));
  });

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
      service_name: editingService.service_name,
      category: editingService.category || 'kiloan',
      price: parseFloat(editingService.price) || 0,
      unit: editingService.unit || 'kg',
      duration_hours: parseInt(editingService.duration_hours) || 48
    };

    fetch(`${API_BASE}/services/${editingService.id}`, {
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
      fetch(`${API_BASE}/services/${service.id}`, {
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

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return showAlertWarning('Form Incomplete', 'Nama dan No. HP wajib diisi!');
    const created = {
      id: Date.now(),
      tenant_id: activeTenantId,
      name: newCustomer.name,
      phone: newCustomer.phone,
      password: newCustomer.password || '123',
      address: newCustomer.address || '-',
      points: 0,
      deposit_balance: 0,
      is_first_order: true
    };

    setCustomers([created, ...customers]);

    fetch(`${API_BASE}/customers?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB customer error:', err));

    setNewCustomer({ name: '', phone: '', address: '', password: '123' });
    setShowAddCustomer(false);
    showAlertSuccess('Member Ditambahkan', `Member pelanggan baru "${created.name}" berhasil disimpan!`);
  };

  const handleTopupSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) return showAlertWarning('Input Invalid', 'Masukkan jumlah top-up yang valid!');

    setCustomers(customers.map(c => c.id === showTopupDeposit.id ? { ...c, deposit_balance: c.deposit_balance + amt } : c));

    fetch(`${API_BASE}/customers/${showTopupDeposit.id}/deposit?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, tenant_id: activeTenantId })
    }).catch(err => console.log('DB deposit error:', err));

    setShowTopupDeposit(null);
    setTopupAmount('');
    showAlertSuccess('Top-Up Berhasil', `Berhasil top up deposit sebesar Rp ${amt.toLocaleString('id-ID')} untuk ${showTopupDeposit.name}!`);
  };

  const handleAddEmployeeSubmit = (e) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.phone) return showAlertWarning('Form Incomplete', 'Lengkapi nama dan nomor telepon pegawai!');
    const created = {
      id: Date.now(),
      tenant_id: activeTenantId,
      name: newEmployee.name,
      role: newEmployee.role,
      phone: newEmployee.phone,
      salary: parseFloat(newEmployee.salary) || 0,
      status: 'Aktif'
    };

    setEmployees([...employees, created]);

    fetch(`${API_BASE}/employees?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB employee error:', err));

    setNewEmployee({ name: '', role: 'Kasir', phone: '', salary: 2500000 });
    setShowAddEmployee(false);
    showAlertSuccess('Pegawai Ditambahkan', `Pegawai baru "${created.name}" (${created.role}) berhasil disimpan!`);
  };

  // Clock In / Clock Out logic
  const handleClockIn = () => {
    const emp = employees.find(e => e.id === Number(selectedEmpAttendance));
    if (!emp) return showAlertWarning('Pilih Pegawai', 'Pilih pegawai terlebih dahulu!');

    const todayStr = new Date().toISOString().slice(0, 10);
    const existing = attendances.find(a => a.employee_id === emp.id && a.date === todayStr);

    if (existing && existing.clock_in && existing.clock_in !== '-') {
      return showAlertWarning('Sudah Absen', `${emp.name} sudah melakukan Clock In hari ini pada jam ${existing.clock_in}`);
    }

    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newAtt = {
      id: Date.now(),
      tenant_id: activeTenantId,
      employee_id: emp.id,
      employee_name: emp.name,
      role: emp.role,
      date: todayStr,
      clock_in: timeNow,
      clock_out: '-',
      status: 'Hadir'
    };

    setAttendances([newAtt, ...attendances.filter(a => !(a.employee_id === emp.id && a.date === todayStr))]);

    fetch(`${API_BASE}/attendances/clock-in?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: activeTenantId, employee_id: emp.id, employee_name: emp.name, role: emp.role, date: todayStr, time: timeNow })
    }).catch(err => console.log('DB attendance error:', err));

    showAlertSuccess('Clock In Berhasil', `Selamat bekerja, ${emp.name}! Presensi masuk tercatat jam ${timeNow}.`);
  };

  const handleClockOut = () => {
    const emp = employees.find(e => e.id === Number(selectedEmpAttendance));
    if (!emp) return showAlertWarning('Pilih Pegawai', 'Pilih pegawai terlebih dahulu!');

    const todayStr = new Date().toISOString().slice(0, 10);
    const existing = attendances.find(a => a.employee_id === emp.id && a.date === todayStr);

    if (!existing || !existing.clock_in || existing.clock_in === '-') {
      return showAlertWarning('Belum Absen Masuk', `${emp.name} belum melakukan Clock In hari ini!`);
    }

    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setAttendances(attendances.map(a => a.id === existing.id ? { ...a, clock_out: timeNow } : a));

    fetch(`${API_BASE}/attendances/clock-out?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: activeTenantId, employee_id: emp.id, date: todayStr, time: timeNow })
    }).catch(err => console.log('DB attendance error:', err));

    showAlertSuccess('Clock Out Berhasil', `Terima kasih, ${emp.name}! Presensi keluar tercatat jam ${timeNow}.`);
  };

  return (
    <div className="space-y-5 font-sans pb-8">
      
      {/* 1. MASTER LANDING MENU FOR MANAJEMEN (JIKA TAMPILAN UTAMA) */}
      {(!mgmtTab || mgmtTab === 'main') && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-teal-700/50 space-y-3 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Pusat Manajemen & Operasional
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Manajemen Pelanggan, Pegawai & Layanan</h2>
            <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Kelola data member toko, hak akses staf kasir, pencatatan absensi shift, serta katalog paket harga layanan secara terpusat.
            </p>
          </div>

          {/* Grid Menu Cards (Samakan Konsep Pengaturan Toko) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Pelanggan */}
            <div 
              onClick={() => setMgmtTab('customers')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  👥
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-teal-700 transition">Manajemen Pelanggan</h3>
                    <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {customers.length} Member
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Kelola data pelanggan, saldo deposit member, & poin reward.</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-teal-700 group-hover:text-white transition flex items-center justify-center shrink-0">
                &rarr;
              </div>
            </div>

            {/* Card 2: Pegawai */}
            <div 
              onClick={() => setMgmtTab('employees')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  👨‍🍳
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-700 transition">Pegawai & Kasir</h3>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {employees.length} Tim
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Atur daftar kasir, gajian, role akses, & pendaftaran tim.</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-700 group-hover:text-white transition flex items-center justify-center shrink-0">
                &rarr;
              </div>
            </div>

            {/* Card 3: Absensi */}
            <div 
              onClick={() => setMgmtTab('attendance')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ⏱️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-700 transition">Absensi Shift Karyawan</h3>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {attendances.length} Catatan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Presensi masuk/keluar kasir shift & rekap jam kerja harian.</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-600 group-hover:text-white transition flex items-center justify-center shrink-0">
                &rarr;
              </div>
            </div>

            {/* Card 4: Services */}
            <div 
              onClick={() => setMgmtTab('services')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🧺
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-emerald-700 transition">Katalog Paket Layanan</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {services.length} Paket
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Atur daftar paket cuci kiloan, satuan, express, & harga.</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-700 group-hover:text-white transition flex items-center justify-center shrink-0">
                &rarr;
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. SUB-VIEW DETAILS (JIKA MEMILIH SUB-MENU) */}
      {mgmtTab && mgmtTab !== 'main' && (
        <div className="space-y-5">
          
          {/* Header Sub-Menu Navigation */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between gap-4">
            <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              {mgmtTab === 'customers' && <span>👥 Manajemen Pelanggan ({filteredCustomers.length})</span>}
              {mgmtTab === 'employees' && <span>👨‍🍳 Manajemen Pegawai ({filteredEmployees.length})</span>}
              {mgmtTab === 'attendance' && <span>⏱️ Absensi Karyawan ({filteredAttendances.length})</span>}
              {mgmtTab === 'services' && <span>🧺 Katalog Layanan ({filteredServices.length})</span>}
            </h2>
          </div>

      {/* Global Filter Bar for Manajemen */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <input 
            type="text" 
            placeholder="Cari (nama, No HP, role)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs p-2 pl-8 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <span className="text-xs font-bold text-slate-500">
          Total Tampil: <b className="text-teal-800">
            {mgmtTab === 'customers' ? filteredCustomers.length : (mgmtTab === 'employees' ? filteredEmployees.length : filteredAttendances.length)} Baris Data
          </b>
        </span>
      </div>

      {/* 1. PELANGGAN & MEMBER WITH ROW NUMBERING (# NO) */}
      {mgmtTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Daftar Pelanggan / Member Terdaftar</h3>
              <p className="text-xs text-slate-500">Total: <b className="text-teal-700">{filteredCustomers.length} Baris Data Pelanggan</b></p>
            </div>
            <button 
              onClick={() => setShowAddCustomer(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <UserPlus className="w-4 h-4" /> Tambah Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                Tidak ada data pelanggan yang sesuai dengan pencarian.
              </div>
            ) : (
              filteredCustomers.map((cust, idx) => (
                <div key={cust.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {/* ROW NUMBER BADGE (# BARIS) */}
                        <span className="bg-slate-800 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-base inline">{cust.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500">{cust.phone} | Pass: <span className="font-mono text-teal-700 font-bold">{cust.password || '123'}</span></p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cust.address}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {cust.points} Poin
                    </span>
                  </div>

                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-teal-800 uppercase">Saldo Deposit Member</p>
                      <p className="text-base font-black text-teal-900">Rp {cust.deposit_balance.toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                      onClick={() => setShowTopupDeposit(cust)}
                      className="bg-teal-700 hover:bg-teal-800 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Top Up
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. PEGAWAI & KARYAWAN WITH ROW NUMBERING (# NO) */}
      {mgmtTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Daftar Pegawai & Hak Akses</h3>
              <p className="text-xs text-slate-500">Total: <b className="text-teal-700">{filteredEmployees.length} Baris Data Pegawai</b></p>
            </div>
            <button 
              onClick={() => setShowAddEmployee(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <UserPlus className="w-4 h-4" /> Tambah Pegawai
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                Tidak ada data pegawai yang sesuai dengan pencarian.
              </div>
            ) : (
              filteredEmployees.map((emp, idx) => (
                <div key={emp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      {/* ROW NUMBER BADGE (# BARIS) */}
                      <span className="bg-slate-800 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        {emp.role}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold">{emp.status || 'Aktif'}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base">{emp.name}</h4>
                  <p className="text-xs text-slate-500">No. HP: {emp.phone}</p>
                  <p className="text-xs text-slate-600 font-semibold pt-2 border-t">
                    Gaji Pokok: Rp {(emp.salary || 2500000).toLocaleString('id-ID')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. ABSENSI KARYAWAN WITH ROW NUMBERING (# NO) */}
      {mgmtTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" /> Presensi Shift Kerja Hari Ini
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Karyawan Shift Hari Ini</label>
                <select 
                  value={selectedEmpAttendance}
                  onChange={(e) => setSelectedEmpAttendance(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs bg-white font-bold"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <button 
                  onClick={handleClockIn}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> Absen Masuk (Clock In)
                </button>
                <button 
                  onClick={handleClockOut}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Absen Keluar (Clock Out)
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-800 text-base">Riwayat Presensi Pegawai</h3>
              <span className="text-xs font-bold text-teal-700">{filteredAttendances.length} Baris Presensi</span>
            </div>
            
            <div className="space-y-2">
              {filteredAttendances.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-4">Belum ada catatan presensi pegawai yang sesuai.</p>
              ) : (
                filteredAttendances.map((att, idx) => (
                  <div key={att.id} className="bg-slate-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      {/* ROW NUMBER BADGE (# BARIS) */}
                      <span className="bg-slate-800 text-amber-300 text-xs font-black px-2 py-0.5 rounded-lg">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{att.employee_name} ({att.role})</p>
                        <p className="text-[11px] text-slate-500">Tanggal: {att.date}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Jam Masuk</span>
                        <span className="font-extrabold text-emerald-700">{att.clock_in}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Jam Keluar</span>
                        <span className="font-extrabold text-amber-700">{att.clock_out}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. KATALOG LAYANAN LAUNDRY (KILOAN, SATUAN, PAKET) */}
      {mgmtTab === 'services' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Shirt className="w-5 h-5 text-teal-600" /> Katalog Layanan Laundry
              </h3>
              <p className="text-xs text-slate-500">Kelola daftar harga untuk Layanan Kiloan, Satuan, dan Paket/Express</p>
            </div>
            <button 
              onClick={() => setShowAddServiceModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Layanan Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                Belum ada layanan. Klik "Tambah Layanan Baru" untuk membuat harga baru.
              </div>
            ) : (
              filteredServices.map((srv, idx) => (
                <div key={srv.id} className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 relative hover:border-teal-400 transition">
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
                    <h4 className="font-extrabold text-slate-800 text-sm">{srv.service_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Estimasi Pengerjaan: <b>{srv.duration_hours || 48} Jam</b></p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <span className="text-xs text-slate-400">Harga per {srv.unit}:</span>
                      <p className="text-base font-black text-teal-700">Rp {srv.price.toLocaleString('id-ID')}</p>
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => setEditingService(srv)}
                        className="p-1.5 bg-slate-100 hover:bg-teal-100 text-teal-800 rounded-lg transition"
                        title="Edit Layanan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteService(srv)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="Hapus Layanan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
        </div>
      )}

      {/* MODAL TAMBAH PEGAWAI */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Tambah Pegawai Staf Baru</h3>
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Pegawai *</label>
                <input 
                  type="text" 
                  required 
                  value={newEmployee.name} 
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Jabatan / Role</label>
                  <select 
                    value={newEmployee.role} 
                    onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-white font-semibold"
                  >
                    <option value="Kasir">Staf Kasir</option>
                    <option value="Operator Dapur">Operator Dapur</option>
                    <option value="Kurir Jemput">Kurir Jemput</option>
                    <option value="Admin Outlet">Admin Outlet</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">No. WhatsApp *</label>
                  <input 
                    type="tel" 
                    required 
                    value={newEmployee.phone} 
                    onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Gaji Pokok (Rp)</label>
                <input 
                  type="number" 
                  value={newEmployee.salary} 
                  onChange={e => setNewEmployee({...newEmployee, salary: e.target.value})}
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2.5 rounded-xl">Simpan Pegawai</button>
                <button type="button" onClick={() => setShowAddEmployee(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH CUSTOMER & TOPUP */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Tambah Member Pelanggan Baru</h3>
            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Nama Pelanggan *</label>
                <input 
                  type="text" 
                  required 
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">No. WhatsApp *</label>
                  <input 
                    type="tel" 
                    required 
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Password Login</label>
                  <input 
                    type="text" 
                    value={newCustomer.password} 
                    onChange={e => setNewCustomer({...newCustomer, password: e.target.value})}
                    className="w-full p-2 border rounded-lg font-mono"
                    placeholder="123"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Alamat Lengkap</label>
                <textarea 
                  rows="2" 
                  value={newCustomer.address} 
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                ></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2 rounded-xl">Simpan Member</button>
                <button type="button" onClick={() => setShowAddCustomer(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTopupDeposit && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Top Up Deposit: {showTopupDeposit.name}</h3>
            <form onSubmit={handleTopupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Jumlah Top Up (Rp)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="misal: 100000"
                  value={topupAmount} 
                  onChange={e => setTopupAmount(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-bold text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2 rounded-xl">Proses Top Up</button>
                <button type="button" onClick={() => setShowTopupDeposit(null)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH LAYANAN LAUNDRY */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Shirt className="w-5 h-5 text-teal-600" /> Tambah Layanan Laundry Baru
              </h3>
              <button onClick={() => setShowAddServiceModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
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
                  className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Layanan *</label>
                  <select 
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full p-2.5 border rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
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
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddServiceModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow">
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT LAYANAN LAUNDRY */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-teal-600" /> Edit Layanan Laundry
              </h3>
              <button onClick={() => setEditingService(null)} className="p-1 text-slate-400 hover:text-slate-600">
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
                  className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Layanan *</label>
                  <select 
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full p-2.5 border rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Jam)</label>
                  <input 
                    type="number" 
                    value={editingService.duration_hours}
                    onChange={(e) => setEditingService({ ...editingService, duration_hours: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEditingService(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow">
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
