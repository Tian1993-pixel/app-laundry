import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PromotionalWebsite from './components/PromotionalWebsite';
import AdminMobileApp from './components/AdminMobileApp';
import StaffLoginModal from './components/StaffLoginModal';
import SuperAdminView from './components/SuperAdminView';
import SaaSAuthModal from './components/SaaSAuthModal';
import { showAlertSuccess, showAlertWarning, showAlertError, showConfirmModal } from './utils/swalAlert';
import { API_BASE } from './utils/apiConfig';

const DEFAULT_STORE_SETTINGS = {
  store_name: 'laundryAja',
  tagline: 'Solusi Pakaian Bersih, Rapi & Harum Premium',
  address: 'Jl. Raya Utama No. 12, Bandung',
  phone: '081234567890',
  logo_url: 'images/laundry_logo.png',
  banner_url: 'images/laundry_hero_banner.png',
  header_receipt_note: 'Nota Resmi Pembayaran Laundry',
  footer_receipt_note: 'Terima kasih telah mempercayakan pakaian Anda kepada kami!',
  license_key: 'LND-2026-PREMIUM-OK',
  license_active_until: '2026-12-31',
  is_active: true,
  first_member_discount: 10000,
  point_redeem_threshold: 10,
  point_redeem_discount: 10000
};

const DEFAULT_OUTLETS = [
  { id: 1, store_name: 'laundryAja (Pusat)', address: 'Jl. Raya Utama No. 12, Bandung', phone: '081234567890' },
  { id: 2, store_name: 'laundryAja (Cabang Dago)', address: 'Jl. Ir. H. Juanda No. 88, Bandung', phone: '081299881122' }
];

const getStoredSettings = () => {
  try {
    const saved = localStorage.getItem('app_store_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.store_name) return parsed;
    }
  } catch (e) {}
  return DEFAULT_STORE_SETTINGS;
};

const getStoredOutlets = () => {
  try {
    const saved = localStorage.getItem('app_outlets');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_OUTLETS;
};

const INITIAL_BANK_ACCOUNTS = [
  { id: 1, bank_name: 'BCA', account_number: '7788990011', account_holder: 'Outlet Utama' },
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
  const isNativeApk = typeof window !== 'undefined' && (
    (window.Capacitor && (window.Capacitor.isNativePlatform?.() || window.Capacitor.platform === 'android')) ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    (typeof navigator !== 'undefined' && (navigator.userAgent?.includes('Capacitor') || navigator.userAgent?.includes('AndroidApp'))) ||
    localStorage.getItem('app_is_apk') === 'true'
  );

  const [activeMode, setActiveMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const isApkEnv = (
          (window.Capacitor && (window.Capacitor.isNativePlatform?.() || window.Capacitor.platform === 'android')) ||
          window.location.protocol === 'capacitor:' ||
          window.location.protocol === 'file:' ||
          (typeof navigator !== 'undefined' && (navigator.userAgent?.includes('Capacitor') || navigator.userAgent?.includes('AndroidApp'))) ||
          localStorage.getItem('app_is_apk') === 'true'
        );

        if (isApkEnv) {
          try { localStorage.setItem('app_is_apk', 'true'); } catch (e) {}
          return 'admin';
        }

        const params = new URLSearchParams(window.location.search);
        const path = window.location.pathname;
        if (params.get('mode') === 'superadmin' || path === '/superadmin') return 'superadmin';
        if (params.get('mode') === 'pos' || params.get('pos') === 'true' || path === '/pos' || path.startsWith('/pos/')) {
          return 'admin';
        }
      }
    } catch (e) {}
    return 'promotional';
  });

  const changeMode = (newMode) => {
    setActiveMode(newMode);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (newMode === 'admin') {
          url.searchParams.set('mode', 'pos');
        } else if (newMode === 'superadmin') {
          url.searchParams.set('mode', 'superadmin');
        } else {
          url.searchParams.delete('mode');
          url.searchParams.delete('pos');
        }
        window.history.pushState({}, '', url.toString());
      }
    } catch (e) {}
  };

  const [currentTenant, setCurrentTenant] = useState(() => {
    try {
      const saved = localStorage.getItem('saas_current_tenant');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showSaaSAuthModal, setShowSaaSAuthModal] = useState(false);

  const handleSaaSRegisterSuccess = (tenant, token, user) => {
    // Tetap di halaman website utama (promotional) & pastikan belum login staff
    changeMode('promotional');
    setLoggedInStaff(null);
    try { localStorage.removeItem('app_staff_user'); } catch (e) {}

    if (tenant && tenant.store_name) {
      setStoreSettings(prev => ({ ...prev, store_name: tenant.store_name }));
    }

    showAlertSuccess(
      '🎉 Pendaftaran Trial 7 Hari Berhasil!',
      `Akun toko "${tenant.store_name}" telah dibuat! Silakan login manual dengan Email/No. HP (${tenant.email || tenant.phone}) dan Password yang telah Anda daftarkan.`
    );

    // Buka modal login kasir untuk uji login manual pengguna
    setShowStaffLoginModal(true);
  };

  const handleSaaSAuthSuccess = (data) => {
    if (data.isSuperAdmin) {
      changeMode('superadmin');
    } else if (data.tenant) {
      const tenant = data.tenant;
      const ownerUser = data.user || {
        id: tenant.id,
        name: tenant.name,
        username: tenant.email,
        role: 'admin',
        tenant_id: tenant.id
      };

      setCurrentTenant(tenant);
      try { localStorage.setItem('saas_current_tenant', JSON.stringify(tenant)); } catch (e) {}
      
      if (tenant.store_name) {
        setStoreSettings(prev => ({ ...prev, store_name: tenant.store_name }));
      }

      setLoggedInStaff(ownerUser);
      try { localStorage.setItem('app_staff_user', JSON.stringify(ownerUser)); } catch (e) {}

      changeMode('admin');
      showAlertSuccess(
        'Login Berhasil!',
        `Selamat datang kembali ${ownerUser.name}! POS Kasir "${tenant.store_name}" aktif.`
      );
    }
  };

  const handleSimulateTenantPos = (tenant) => {
    setCurrentTenant(tenant);
    try { localStorage.setItem('saas_current_tenant', JSON.stringify(tenant)); } catch (e) {}
    if (tenant.store_name) {
      setStoreSettings(prev => ({ ...prev, store_name: tenant.store_name }));
    }
    showAlertSuccess('Simulasi POS', `Masuk sebagai demo POS toko "${tenant.store_name}"!`);
    changeMode('admin');
  };

  const [websiteTab, setWebsiteTab] = useState('home');

  const [storeSettings, setStoreSettings] = useState(getStoredSettings);
  const [outlets, setOutlets] = useState(getStoredOutlets);
  const [activeOutletId, setActiveOutletId] = useState(() => {
    try {
      const saved = localStorage.getItem('activeOutletId');
      return saved ? Number(saved) : 1;
    } catch (e) {
      return 1;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('activeOutletId', activeOutletId);
    } catch (e) {}
  }, [activeOutletId]);

  const [bankAccounts, setBankAccounts] = useState(INITIAL_BANK_ACCOUNTS);
  const [receiptFontSize, setReceiptFontSize] = useState(() => {
    try {
      return localStorage.getItem('receiptFontSize') || '80mm';
    } catch (e) {
      return '80mm';
    }
  });

  useEffect(() => {
    try {
      if (receiptFontSize) localStorage.setItem('receiptFontSize', receiptFontSize);
    } catch (e) {}
  }, [receiptFontSize]);

  const [services, setServices] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [attendances, setAttendances] = useState(INITIAL_ATTENDANCES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Member Auth State
  const [loggedInMember, setLoggedInMember] = useState(null);

  // Staff / Kasir Auth State
  const [loggedInStaff, setLoggedInStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('app_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [showStaffLoginModal, setShowStaffLoginModal] = useState(false);

  // Mandatory Staff Login Trigger when entering POS mode or APK
  useEffect(() => {
    if (isNativeApk && !loggedInStaff) {
      setShowStaffLoginModal(true);
    }
  }, [isNativeApk, loggedInStaff]);

  // Event listener for Locked Screen Login button
  useEffect(() => {
    const handleOpenModal = () => setShowStaffLoginModal(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('openStaffLoginModal', handleOpenModal);
      return () => window.removeEventListener('openStaffLoginModal', handleOpenModal);
    }
  }, []);

  const handleLoginStaffSuccess = (staffData, tenantData) => {
    setLoggedInStaff(staffData);
    setShowStaffLoginModal(false);
    try {
      localStorage.setItem('app_staff_user', JSON.stringify(staffData));
    } catch (e) {}

    const effectiveTenant = tenantData || (staffData?.tenant_id ? { id: staffData.tenant_id, store_name: staffData.store_name || storeSettings.store_name } : null);

    if (effectiveTenant) {
      setCurrentTenant(effectiveTenant);
      try { localStorage.setItem('saas_current_tenant', JSON.stringify(effectiveTenant)); } catch (e) {}
      if (effectiveTenant.store_name) {
        setStoreSettings(prev => ({ ...prev, store_name: effectiveTenant.store_name }));
      }
    }
    setActiveMode('admin');
  };

  const handleLogoutStaff = () => {
    setLoggedInStaff(null);
    setCurrentTenant(null);

    try {
      localStorage.removeItem('app_staff_user');
      localStorage.removeItem('saas_current_tenant');
      localStorage.removeItem('app_store_settings');
      localStorage.removeItem('app_outlets');
      localStorage.setItem('activeOutletId', '1');
    } catch (e) {}

    // Reset storeSettings & outlets to Default Tenant (laundryAja)
    setStoreSettings(DEFAULT_STORE_SETTINGS);
    setOutlets(DEFAULT_OUTLETS);
    setActiveOutletId(1);

    // Fetch default tenant 1 settings from server
    fetch(`${API_BASE}/settings?tenant_id=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setStoreSettings(data.data);
        }
      })
      .catch(() => {});

    if (isNativeApk) {
      setActiveMode('admin');
      setShowStaffLoginModal(true);
      showAlertSuccess('Logout Staff Berhasil', 'Sesi POS Kasir telah diakhiri. Silakan login kembali.');
    } else {
      setShowStaffLoginModal(false);
      changeMode('promotional');
      showAlertSuccess('Logout Berhasil', 'Sesi diakhiri & kembali ke Halaman Website Utama (Default Tenant).');
    }
  };

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

  // Sync active outlet details (address, phone) with storeSettings ONLY when logged in
  useEffect(() => {
    if (outlets && outlets.length > 0 && activeOutletId && loggedInStaff) {
      const activeOutlet = outlets.find(o => o.id === Number(activeOutletId));
      if (activeOutlet) {
        setStoreSettings(prev => {
          const updated = {
            ...prev,
            address: activeOutlet.address || prev.address,
            phone: activeOutlet.phone || prev.phone
          };
          try { localStorage.setItem('app_store_settings', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    }
  }, [outlets, activeOutletId, loggedInStaff]);

  // Auto-sync currentTenant state from loggedInStaff if currentTenant is null/outdated
  useEffect(() => {
    if (loggedInStaff && loggedInStaff.tenant_id && (!currentTenant || currentTenant.id !== loggedInStaff.tenant_id)) {
      const tenantObj = { id: loggedInStaff.tenant_id, store_name: storeSettings?.store_name || 'Laundry App' };
      setCurrentTenant(tenantObj);
      try { localStorage.setItem('saas_current_tenant', JSON.stringify(tenantObj)); } catch (e) {}
    }
  }, [loggedInStaff, currentTenant]);

  // INITIAL DATA FETCHING FROM MYSQL DB_LAUNDRY (ISOLATED BY TENANT)
  // When logged out, ALWAYS default to Tenant 1 (Default Provider Website)
  const activeTenantId = currentTenant?.id || loggedInStaff?.tenant_id || storeSettings?.tenant_id || 1;

  useEffect(() => {
    const tId = activeTenantId;

    fetch(`${API_BASE}/settings?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          const sanitized = { ...data.data };
          if (sanitized.logo_url && sanitized.logo_url.startsWith('/images/')) {
            sanitized.logo_url = sanitized.logo_url.slice(1);
          }
          if (sanitized.banner_url && sanitized.banner_url.startsWith('/images/')) {
            sanitized.banner_url = sanitized.banner_url.slice(1);
          }

          setStoreSettings(sanitized);
          if (sanitized.receipt_font_size) {
            setReceiptFontSize(sanitized.receipt_font_size);
            try { localStorage.setItem('receiptFontSize', sanitized.receipt_font_size); } catch (e) {}
          }
          try { localStorage.setItem('app_store_settings', JSON.stringify(sanitized)); } catch (e) {}
        } else if (tId !== 1) {
          // Tenant test lama sudah terhapus di DB, bersihkan session tenant & balik ke default laundryAja
          setCurrentTenant(null);
          try { 
            localStorage.removeItem('saas_current_tenant'); 
            localStorage.removeItem('app_store_settings'); 
            localStorage.removeItem('app_outlets'); 
          } catch (e) {}
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback settings'));

    fetch(`${API_BASE}/services?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.data)) {
          setServices(data.data);
        }
      })
      .catch((err) => console.log('DB Connect: services fetch error:', err));

    fetch(`${API_BASE}/perfumes?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.data)) {
          setPerfumes(data.data);
        }
      })
      .catch((err) => console.log('DB Connect: perfumes fetch error:', err));

    fetch(`${API_BASE}/customers?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setCustomers(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback customers'));

    fetch(`${API_BASE}/reviews?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setReviews(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback reviews'));

    fetch(`${API_BASE}/orders?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setOrders(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback orders'));

    fetch(`${API_BASE}/expenses?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setExpenses(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback expenses'));

    fetch(`${API_BASE}/employees?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setEmployees(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback employees'));

    fetch(`${API_BASE}/attendances?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setAttendances(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback attendances'));

    fetch(`${API_BASE}/bank-accounts?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data) {
          setBankAccounts(data.data);
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback bank accounts'));

    fetch(`${API_BASE}/outlets?tenant_id=${tId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.data && data.data.length > 0) {
          setOutlets(data.data);
          try { localStorage.setItem('app_outlets', JSON.stringify(data.data)); } catch (e) {}
          const match = data.data.find(o => o.id === Number(activeOutletId));
          if (!match && data.data[0]) {
            setActiveOutletId(data.data[0].id);
          }
        }
      })
      .catch(() => console.log('DB Connect: Menggunakan fallback outlets'));
  }, [activeTenantId]);

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
    fetch(`${API_BASE}/customers?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: activeTenantId, name, phone, password, address })
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
      tenant_id: activeTenantId,
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
        tenant_id: activeTenantId,
        name: pickupData.name,
        phone: pickupData.phone,
        password: '123',
        address: pickupData.address,
        points: 0,
        deposit_balance: 0,
        is_first_order: true
      };
      setCustomers([autoCust, ...customers]);

      fetch(`${API_BASE}/customers?tenant_id=${activeTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: activeTenantId, name: pickupData.name, phone: pickupData.phone, password: '123', address: pickupData.address })
      }).catch(err => console.log('DB error:', err));
    }

    setOrders([newOrder, ...orders]);

    // Save Order to MySQL
    fetch(`${API_BASE}/orders?tenant_id=${activeTenantId}`, {
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
        fetch(`${API_BASE}/services`).then(res => res.json()).then(data => {
          if (data && data.success && Array.isArray(data.data)) setServices(data.data);
        }).catch(() => {});
        setOutlets(INITIAL_OUTLETS);
        setReviews(INITIAL_REVIEWS);
        showAlertSuccess('Reset Selesai', 'Data aplikasi telah dikembalikan ke data awal.');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans">
      
      {/* 1. PUBLIC WEBSITE NAVBAR (HANYA DITAMPILKAN SAAT MODE WEBSITE DEPAN) */}
      {activeMode === 'promotional' && (
        <Navbar 
          activeMode={activeMode} 
          setActiveMode={changeMode} 
          storeSettings={storeSettings} 
          loggedInMember={loggedInMember}
          onLogoutMember={handleLogoutMember}
          loggedInStaff={loggedInStaff}
          onLogoutStaff={handleLogoutStaff}
          onOpenStaffLogin={() => setShowStaffLoginModal(true)}
          activeWebsiteTab={websiteTab}
          setActiveWebsiteTab={setWebsiteTab}
        />
      )}

      {/* 2. VIEW SWITCHER */}
      {activeMode === 'superadmin' ? (
        <SuperAdminView 
          onLogoutSuperAdmin={() => changeMode('promotional')}
          onSwitchToWebsite={() => changeMode('promotional')}
          onSimulateTenantPos={handleSimulateTenantPos}
        />
      ) : activeMode === 'promotional' ? (
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
          onOpenSaaSAuth={() => setShowSaaSAuthModal(true)}
        />
      ) : (
        <AdminMobileApp 
          storeSettings={storeSettings}
          setStoreSettings={setStoreSettings}
          services={services}
          setServices={setServices}
          perfumes={perfumes}
          setPerfumes={setPerfumes}
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
          loggedInStaff={loggedInStaff}
          onLogoutStaff={handleLogoutStaff}
          onSwitchToWebsite={() => changeMode('promotional')}
          currentTenant={currentTenant}
          activeTenantId={activeTenantId}
          isNativeApk={isNativeApk}
        />
      )}

      {/* Staff / Kasir Login Modal */}
      <StaffLoginModal 
        isOpen={showStaffLoginModal}
        onClose={() => setShowStaffLoginModal(false)}
        onLoginSuccess={handleLoginStaffSuccess}
      />

      {/* SaaS Auth & 7-Day Trial Modal */}
      <SaaSAuthModal 
        isOpen={showSaaSAuthModal}
        onClose={() => setShowSaaSAuthModal(false)}
        onRegisterSuccess={(tenant, token) => handleSaaSRegisterSuccess(tenant, token)}
        onLoginSuccess={handleSaaSAuthSuccess}
      />

    </div>
  );
}