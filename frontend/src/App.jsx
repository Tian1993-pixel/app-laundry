import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PromotionalWebsite from './components/PromotionalWebsite';
import AdminMobileApp from './components/AdminMobileApp';
import { showAlertSuccess, showAlertWarning, showAlertError, showConfirmModal } from './utils/swalAlert';

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && !host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return '/api.php';
    }
    return `http://${host}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

const DEFAULT_SETTINGS = {
  store_name: 'Laundry Fresh & Clean',
  tagline: 'Solusi Pakaian Bersih, Rapi & Harum Premium',
  address: 'Jl. Raya Utama No. 12, Bandung',
  phone: '081234567890',
  logo_url: '/images/laundry_logo.png',
  banner_url: '/images/laundry_hero_banner.png',
  header_receipt_note: 'Nota Resmi Pembayaran Laundry',
  footer_receipt_note: 'Terima kasih telah mempercayakan pakaian Anda kepada kami!',
  license_key: 'LND-2026-PREMIUM-OK',
  license_active_until: '2026-12-31',
  is_active: true,
  first_member_discount: 10000,
  point_redeem_threshold: 10,
  point_redeem_discount: 10000
};

const INITIAL_OUTLETS = [
  { id: 1, store_name: 'Laundry Fresh & Clean (Pusat)', address: 'Jl. Raya Utama No. 12, Bandung', phone: '081234567890' },
  { id: 2, store_name: 'Laundry Fresh & Clean (Cabang Dago)', address: 'Jl. Ir. H. Juanda No. 88, Bandung', phone: '081299881122' },
];

const INITIAL_BANK_ACCOUNTS = [
  { id: 1, bank_name: 'BCA', account_number: '7788990011', account_holder: 'Laundry Fresh & Clean' },
  { id: 2, bank_name: 'QRIS ShopeePay', account_number: '081234567890', account_holder: 'Outlet Utama' },
];

const INITIAL_SERVICES = [
  { id: 1, service_name: 'Cuci Komplit Reguler', category: 'kiloan', price: 7000, unit: 'kg', duration_hours: 48 },
  { id: 2, service_name: 'Cuci Komplit Express 24 jam', category: 'express', price: 12000, unit: 'kg', duration_hours: 24 },
  { id: 3, service_name: 'Setrika Saja (Kiloan)', category: 'kiloan', price: 4500, unit: 'kg', duration_hours: 24 },
  { id: 4, service_name: 'Bed Cover Besar (Jumbo)', category: 'satuan', price: 35000, unit: 'pcs', duration_hours: 48 },
  { id: 5, service_name: 'Cuci Sepatu Sneaker', category: 'satuan', price: 30000, unit: 'pasang', duration_hours: 48 },
  { id: 6, service_name: 'Jas / Gaun Pesta Premium', category: 'satuan', price: 40000, unit: 'pcs', duration_hours: 72 },
  { id: 7, service_name: 'Cuci Karpet Tebal', category: 'satuan', price: 15000, unit: 'm2', duration_hours: 72 },
  { id: 8, service_name: 'Gorden & Tirai', category: 'satuan', price: 12000, unit: 'meter', duration_hours: 48 },
];

const INITIAL_CUSTOMERS = [
  { id: 1, name: 'Budi Santoso', phone: '081299887766', password: '123', address: 'Jl. Merdeka No. 5', points: 12, deposit_balance: 150000, is_first_order: false },
  { id: 2, name: 'Siti Aminah', phone: '085711223344', password: '123', address: 'Komp. Mawar Indah B-3', points: 4, deposit_balance: 0, is_first_order: true },
  { id: 3, name: 'Rina Permata', phone: '081344556677', password: '123', address: 'Jl. Melati No. 8', points: 0, deposit_balance: 50000, is_first_order: true },
];

const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Ahmad Subagja', role: 'Kasir', phone: '081211112222', salary: 2500000, status: 'Aktif' },
  { id: 2, name: 'Dewi Rahmawati', role: 'Operator Dapur', phone: '081233334444', salary: 2300000, status: 'Aktif' },
  { id: 3, name: 'Joko Kurir', role: 'Kurir Jemput', phone: '081255556666', salary: 2200000, status: 'Aktif' },
];

const INITIAL_EXPENSES = [
  { id: 1, title: 'Beli Deterjen & Softener 10L', category: 'Operasional', amount: 120000, notes: 'Stok toko', date: '2026-08-01 09:00' },
  { id: 2, title: 'Token Listrik PLN Dapur', category: 'Utilitas', amount: 150000, notes: 'Token 100 kWh', date: '2026-08-01 11:30' },
];

const INITIAL_REVIEWS = [
  { id: 1, customer_name: 'Hendra Wijaya', rating: 5, package_used: 'Paket Express Kilat', comment: 'Cucian sangat wangi dan bersih. Penjemputannya tepat waktu dan harga terjangkau! Sangat direkomendasikan.' },
  { id: 2, customer_name: 'Anisa Rahmawati', rating: 5, package_used: 'Paket Satuan Bed Cover', comment: 'Bedcover jumbo saya kembali seperti baru, sangat lembut dan packing plastiknya rapi banget.' },
  { id: 3, customer_name: 'Bambang Kusuma', rating: 5, package_used: 'Paket Kiloan Reguler', comment: 'Sudah langganan 6 bulan di sini. Poin reward-nya lumayan banget bisa ditukar diskon!' }
];

const INITIAL_ATTENDANCES = [
  { id: 1, employee_id: 1, employee_name: 'Ahmad Subagja', role: 'Kasir', date: new Date().toISOString().slice(0, 10), clock_in: '07:55', clock_out: '-', status: 'Hadir' }
];

const INITIAL_ORDERS = [
  {
    id: 1,
    invoice_number: 'LD-20260801-001',
    customer_name: 'Budi Santoso',
    customer_phone: '081299887766',
    total_amount: 21000,
    paid_amount: 21000,
    discount_amount: 0,
    change_amount: 0,
    payment_type: 'cash',
    payment_status: 'paid',
    work_status: 'disetrika',
    rack_location: 'RAK A-02',
    perfume_variant: 'Lily Fresh',
    created_at: '2026-08-01 10:30',
    items: [{ service_name: 'Cuci Komplit Reguler', qty: 3, price_per_unit: 7000, subtotal: 21000 }]
  },
  {
    id: 2,
    invoice_number: 'LD-20260801-002',
    customer_name: 'Siti Aminah',
    customer_phone: '085711223344',
    total_amount: 35000,
    paid_amount: 0,
    discount_amount: 0,
    change_amount: 0,
    payment_type: 'cash',
    payment_status: 'unpaid',
    work_status: 'butuh_penjemputan',
    rack_location: 'Daftar Jemput',
    perfume_variant: 'Original Fresh',
    created_at: '2026-08-01 14:15',
    items: [{ service_name: 'Bed Cover Besar (Jumbo)', qty: 1, price_per_unit: 35000, subtotal: 35000 }]
  }
];

export default function App() {
  const [activeMode, setActiveMode] = useState('promotional'); // 'promotional' | 'admin'
  const [websiteTab, setWebsiteTab] = useState('home');

  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS);
  const [outlets, setOutlets] = useState(INITIAL_OUTLETS);
  const [activeOutletId, setActiveOutletId] = useState(1);

  const [bankAccounts, setBankAccounts] = useState(INITIAL_BANK_ACCOUNTS);
  const [receiptFontSize, setReceiptFontSize] = useState('80mm');

  const [services, setServices] = useState(INITIAL_SERVICES);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [attendances, setAttendances] = useState(INITIAL_ATTENDANCES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Member Auth State
  const [loggedInMember, setLoggedInMember] = useState(null);

  // Tracking State
  const [trackKeyword, setTrackKeyword] = useState('');
  const [trackResults, setTrackResults] = useState(null);

  // Sync state with Member
  useEffect(() => {
    if (loggedInMember) {
      const updated = customers.find(c => c.id === loggedInMember.id);
      if (updated) setLoggedInMember(updated);
    }
  }, [customers]);

  // INITIAL DATA FETCHING FROM MYSQL DB_LAUNDRY
  useEffect(() => {
    fetch(`${API_BASE}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setStoreSettings(prev => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback settings'));

    fetch(`${API_BASE}/services`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setServices(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback services'));

    fetch(`${API_BASE}/customers`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setCustomers(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback customers'));

    fetch(`${API_BASE}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setReviews(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback reviews'));

    fetch(`${API_BASE}/orders`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setOrders(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback orders'));

    fetch(`${API_BASE}/expenses`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setExpenses(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback expenses'));

    fetch(`${API_BASE}/employees`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setEmployees(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback employees'));

    fetch(`${API_BASE}/attendances`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setAttendances(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback attendances'));

    fetch(`${API_BASE}/outlets`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setOutlets(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback outlets'));

    fetch(`${API_BASE}/bank-accounts`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setBankAccounts(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback bank accounts'));
  }, []);

  const handleAddReview = (newReviewData) => {
    const created = {
      id: Date.now(),
      customer_name: newReviewData.customer_name,
      rating: newReviewData.rating || 5,
      package_used: newReviewData.package_used || 'Paket Kiloan Reguler',
      comment: newReviewData.comment
    };
    setReviews([created, ...reviews]);

    fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB review save error:', err));
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!trackKeyword.trim()) return;

    fetch(`${API_BASE}/track/${encodeURIComponent(trackKeyword.trim())}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setTrackResults(res.data);
        } else {
          filterLocalTracking();
        }
      })
      .catch(() => {
        filterLocalTracking();
      });
  };

  const filterLocalTracking = () => {
    const keywordLower = trackKeyword.trim().toLowerCase();
    const found = orders.filter(o => 
      o.invoice_number.toLowerCase().includes(keywordLower) || 
      o.customer_phone.includes(keywordLower)
    );
    setTrackResults(found);
  };

  const handleRegisterMember = (name, phone, password, address) => {
    const existing = customers.find(c => c.phone === phone);
    if (existing) {
      showAlertWarning('Registrasi Gagal', 'Nomor HP ini sudah terdaftar sebagai member!');
      return false;
    }

    const newCust = {
      id: Date.now(),
      name,
      phone,
      password,
      address: address || '-',
      points: 0,
      deposit_balance: 0,
      is_first_order: true
    };

    setCustomers([newCust, ...customers]);
    setLoggedInMember(newCust);

    // Save to MySQL DB
    fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password, address })
    }).catch(err => console.log('Error saving member to DB:', err));

    showAlertSuccess(
      `Selamat ${name}!`, 
      `Pendaftaran member berhasil. Anda berhak mendapatkan Diskon Transaksi Pertama sebesar Rp ${(storeSettings.first_member_discount || 10000).toLocaleString('id-ID')}!`
    );
    return true;
  };

  const handleLoginMember = (phone, password) => {
    const cust = customers.find(c => c.phone === phone && (c.password === password || !c.password));
    if (!cust) {
      showAlertError('Login Gagal', 'No. HP atau Password yang Anda masukkan salah!');
      return false;
    }

    setLoggedInMember(cust);
    showAlertSuccess('Login Berhasil', `Selamat datang kembali, ${cust.name}!`);
    return true;
  };

  const handleLogoutMember = () => {
    setLoggedInMember(null);
    showAlertSuccess('Logout Berhasil', 'Anda telah keluar dari akun member.');
  };

  const handleAddPickupOrder = (pickupData) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNo = `LD-${dateStr}-${String(orders.length + 1).padStart(3, '0')}`;

    const newOrder = {
      id: Date.now(),
      invoice_number: invoiceNo,
      customer_name: pickupData.name,
      customer_phone: pickupData.phone,
      total_amount: pickupData.estimatedTotal || 0,
      paid_amount: 0,
      discount_amount: 0,
      change_amount: 0,
      payment_type: 'cash',
      payment_status: 'unpaid',
      work_status: 'butuh_penjemputan',
      rack_location: 'Penjemputan WA',
      perfume_variant: 'Original Fresh',
      created_at: new Date().toLocaleString('id-ID'),
      notes: `Alamat: ${pickupData.address} | Paket: ${pickupData.package} | Tgl: ${pickupData.pickupDate} | Catatan: ${pickupData.notes || '-'}`,
      items: [{ service_name: pickupData.package, qty: 1, unit: 'kg', price_per_unit: pickupData.estimatedTotal || 0, subtotal: pickupData.estimatedTotal || 0 }]
    };

    const existingCust = customers.find(c => c.phone === pickupData.phone);
    if (!existingCust) {
      const autoCust = {
        id: Date.now(),
        name: pickupData.name,
        phone: pickupData.phone,
        password: '123',
        address: pickupData.address,
        points: 0,
        deposit_balance: 0,
        is_first_order: true
      };
      setCustomers([autoCust, ...customers]);

      fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pickupData.name, phone: pickupData.phone, password: '123', address: pickupData.address })
      }).catch(err => console.log('DB error:', err));
    }

    setOrders([newOrder, ...orders]);

    // Save Order to MySQL
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.log('DB Order error:', err));
  };

  // Export JSON Backup Data
  const handleExportData = () => {
    const backupObj = {
      storeSettings,
      outlets,
      bankAccounts,
      services,
      customers,
      employees,
      expenses,
      reviews,
      attendances,
      orders,
      exportedAt: new Date().toLocaleString('id-ID')
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `laundry_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showAlertSuccess('Export Berhasil', 'File cadangan JSON telah diunduh.');
  };

  // Reset Data to Defaults with SweetAlert Modal Confirmation
  const handleResetData = () => {
    showConfirmModal(
      'Reset Seluruh Data?',
      'Tindakan ini akan mengembalikan seluruh data transaksi ke keadaan awal aplikasi!',
      'Ya, Reset Sekarang'
    ).then((result) => {
      if (result.isConfirmed) {
        setOrders(INITIAL_ORDERS);
        setExpenses(INITIAL_EXPENSES);
        setCustomers(INITIAL_CUSTOMERS);
        setEmployees(INITIAL_EMPLOYEES);
        setServices(INITIAL_SERVICES);
        setOutlets(INITIAL_OUTLETS);
        setReviews(INITIAL_REVIEWS);
        showAlertSuccess('Reset Selesai', 'Data aplikasi telah dikembalikan ke data awal.');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans">
      
      {/* Global Responsive Header & Flexible Mobile Sidebar Drawer */}
      <Navbar 
        activeMode={activeMode} 
        setActiveMode={setActiveMode} 
        storeSettings={storeSettings} 
        loggedInMember={loggedInMember}
        onLogoutMember={handleLogoutMember}
        activeWebsiteTab={websiteTab}
        setActiveWebsiteTab={setWebsiteTab}
      />

      {/* View Switcher */}
      {activeMode === 'promotional' ? (
        <PromotionalWebsite 
          storeSettings={storeSettings}
          services={services}
          orders={orders}
          reviews={reviews}
          onAddReview={handleAddReview}
          onTrackOrder={handleTrackOrder}
          trackResults={trackResults}
          trackKeyword={trackKeyword}
          setTrackKeyword={setTrackKeyword}
          loggedInMember={loggedInMember}
          onRegisterMember={handleRegisterMember}
          onLoginMember={handleLoginMember}
          onLogoutMember={handleLogoutMember}
          onAddPickupOrder={handleAddPickupOrder}
          activeTab={websiteTab}
          setActiveTab={setWebsiteTab}
        />
      ) : (
        <AdminMobileApp 
          storeSettings={storeSettings}
          setStoreSettings={setStoreSettings}
          services={services}
          setServices={setServices}
          customers={customers}
          setCustomers={setCustomers}
          orders={orders}
          setOrders={setOrders}
          activeReceipt={activeReceipt}
          setActiveReceipt={setActiveReceipt}
          expenses={expenses}
          setExpenses={setExpenses}
          employees={employees}
          setEmployees={setEmployees}
          attendances={attendances}
          setAttendances={setAttendances}
          outlets={outlets}
          setOutlets={setOutlets}
          activeOutletId={activeOutletId}
          setActiveOutletId={setActiveOutletId}
          bankAccounts={bankAccounts}
          setBankAccounts={setBankAccounts}
          receiptFontSize={receiptFontSize}
          setReceiptFontSize={setReceiptFontSize}
          onResetData={handleResetData}
          onExportData={handleExportData}
        />
      )}

    </div>
  );
}