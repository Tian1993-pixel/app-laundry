import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import ReportsView from './ReportsView';
import ManagementView from './ManagementView';
import OutletSettingsView from './OutletSettingsView';
import { showAlertSuccess, showAlertWarning, showAlertError, showConfirmModal } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

import { 
  ShoppingBag, 
  PackageCheck, 
  Users, 
  Shirt, 
  Settings, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Clock, 
  Key, 
  CheckCircle2, 
  DollarSign, 
  UserPlus, 
  Wallet, 
  ChevronRight,
  X,
  Sliders,
  Check,
  Gift,
  Star,
  Tag,
  Download,
  Share2,
  Percent,
  Sparkles,
  Truck,
  AlertTriangle,
  PieChart,
  Building2,
  Receipt,
  Hash,
  ShoppingCart,
  Globe,
  LogOut
} from 'lucide-react';

export default function AdminMobileApp({
  storeSettings,
  setStoreSettings,
  services,
  setServices,
  perfumes = [],
  setPerfumes,
  customers,
  setCustomers,
  orders,
  setOrders,
  activeReceipt,
  setActiveReceipt,
  expenses,
  setExpenses,
  employees,
  setEmployees,
  attendances,
  setAttendances,
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
  loggedInStaff,
  onLogoutStaff,
  onSwitchToWebsite,
  currentTenant,
  isNativeApk
}) {
  const [adminTab, setAdminTab] = useState('pos');
  const [showMemberBook, setShowMemberBook] = useState(false);

  // POS State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [perfumeVariant, setPerfumeVariant] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paidAmount, setPaidAmount] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showMobileCartDrawer, setShowMobileCartDrawer] = useState(false);

  // Member Discount only (from store settings)
  const [useFirstMemberDiscount, setUseFirstMemberDiscount] = useState(false);
  const [useRedeemPointDiscount, setUseRedeemPointDiscount] = useState(false);

  // POS Services Filter State
  const [posCategoryFilter, setPosCategoryFilter] = useState('all');
  const [serviceSearchKeyword, setServiceSearchKeyword] = useState('');

  const filteredServices = services.filter(srv => {
    const cat = (srv.category || '').toLowerCase();
    const matchCategory = posCategoryFilter === 'all' || 
      cat === posCategoryFilter || 
      (posCategoryFilter === 'express' && (cat === 'express' || cat === 'paket'));
    const matchKeyword = !serviceSearchKeyword.trim() || 
      srv.service_name.toLowerCase().includes(serviceSearchKeyword.trim().toLowerCase());
    return matchCategory && matchKeyword;
  });

  // Filter Dapur Order
  const [dapurTab, setDapurTab] = useState('main');
  const [resetSubTabKey, setResetSubTabKey] = useState(0);
  const [orderFilterStatus, setOrderFilterStatus] = useState('');
  const [orderSearchKeyword, setOrderSearchKeyword] = useState('');

  const handleNavClick = (tabName) => {
    setAdminTab(tabName);
    setDapurTab('main');
    setResetSubTabKey(prev => prev + 1);
  };

  // Count orders that need pickup
  const pickupPendingOrders = orders.filter(o => o.work_status === 'butuh_penjemputan');

  // Cart operations
  const addToCart = (service) => {
    const existing = cart.find(item => item.id === service.id);
    if (existing) {
      setCart(cart.map(item => item.id === service.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...service, qty: 1 }]);
    }
  };

  const updateCartQty = (id, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, qty: parseFloat(newQty) || 1 } : item));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Subtotal & Discounts Calculations
  const subtotalCart = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalKgOrQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // Calculate discounts (member discount only)
  let firstDiscountAmount = 0;
  if (useFirstMemberDiscount && selectedCustomer && selectedCustomer.is_first_order) {
    firstDiscountAmount = storeSettings.first_member_discount || 10000;
  }

  let pointDiscountAmount = 0;
  if (useRedeemPointDiscount && selectedCustomer && selectedCustomer.points >= (storeSettings.point_redeem_threshold || 10)) {
    pointDiscountAmount = storeSettings.point_redeem_discount || 10000;
  }

  const grandTotalDiscount = firstDiscountAmount + pointDiscountAmount;

  const finalTotalAmount = Math.max(0, subtotalCart - grandTotalDiscount);

  // Filter Customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  // Handle Checkout POS Transaction
  const handleCheckout = () => {
    if (cart.length === 0) return showAlertWarning('Keranjang Kosong', 'Pilih minimal 1 layanan laundry!');

    const customerName = selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum (Walk-in)';
    const customerPhone = selectedCustomer ? selectedCustomer.phone : '-';
    const customerId = selectedCustomer ? selectedCustomer.id : null;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LD-${dateStr}-`;
    const targetTenantId = currentTenant?.id || (loggedInStaff?.tenant_id) || 1;

    const todaySequences = (orders || [])
      .filter(o => Number(o.tenant_id || 1) === Number(targetTenantId))
      .map(o => o.invoice_number || '')
      .filter(inv => inv.startsWith(prefix))
      .map(inv => parseInt(inv.replace(prefix, ''), 10))
      .filter(seq => !isNaN(seq));

    const maxSeq = todaySequences.length > 0 ? Math.max(...todaySequences) : 0;
    const nextSeq = maxSeq + 1;
    const invoiceNo = `${prefix}${String(nextSeq).padStart(3, '0')}`;

    const newOrder = {
      id: Date.now(),
      tenant_id: targetTenantId,
      invoice_number: invoiceNo,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      subtotal_amount: subtotalCart,
      discount_amount: grandTotalDiscount,
      shipping_fee: 0,
      other_fee: 0,
      total_amount: finalTotalAmount,
      paid_amount: paymentStatus === 'paid' ? finalTotalAmount : (parseFloat(paidAmount) || 0),
      change_amount: paymentStatus === 'paid' && paidAmount > finalTotalAmount ? (paidAmount - finalTotalAmount) : 0,
      payment_type: paymentType,
      payment_status: paymentStatus,
      work_status: 'diterima',
      rack_location: '',
      perfume_variant: perfumeVariant || (perfumes[0]?.name || '-'),
      notes: orderNotes || '-',
      created_at: new Date().toLocaleString('id-ID'),
      items: cart.map(item => ({
        service_name: item.service_name,
        qty: item.qty,
        unit: item.unit,
        price_per_unit: item.price,
        subtotal: item.price * item.qty
      }))
    };

    // Update Customer points & balance if member
    if (selectedCustomer) {
      const earnedPoints = Math.floor(totalKgOrQty);
      let updatedPoints = selectedCustomer.points + earnedPoints;
      let isFirstOrderUpdated = false;

      if (useRedeemPointDiscount) {
        updatedPoints = Math.max(0, updatedPoints - (storeSettings.point_redeem_threshold || 10));
      }

      setCustomers(customers.map(c => {
        if (c.id === selectedCustomer.id) {
          return {
            ...c,
            points: updatedPoints,
            is_first_order: isFirstOrderUpdated,
            deposit_balance: paymentType === 'deposit' ? Math.max(0, c.deposit_balance - finalTotalAmount) : c.deposit_balance
          };
        }
        return c;
      }));
    }

    setOrders([newOrder, ...orders]);

    // Save to MySQL DB with explicit tenant_id
    fetch(`${API_BASE}/orders?tenant_id=${targetTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newOrder, tenant_id: targetTenantId })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.id) {
          newOrder.id = data.id;
        }
      })
      .catch(err => console.log('DB order error:', err));

    setActiveReceipt(newOrder);

    // Reset Form
    setCart([]);
    setSelectedCustomer(null);
    setUseFirstMemberDiscount(false);
    setUseRedeemPointDiscount(false);
    setOrderNotes('');
    setShowMobileCartDrawer(false);

    showAlertSuccess('Transaksi Berhasil', `Nota ${invoiceNo} berhasil disimpan & siap cetak!`);
  };

  // Update Status Cucian di Dapur
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, work_status: newStatus } : o));

    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_status: newStatus })
    }).catch(err => console.log('DB error status:', err));

    showAlertSuccess('Status Diperbarui', `Status pengerjaan cucian diubah menjadi: ${newStatus}`);
  };

  // Update Lokasi Rak di Dapur
  const handleUpdateRackLocation = (orderId, newRack) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, rack_location: newRack } : o));

    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rack_location: newRack })
    }).catch(err => console.log('DB rack error:', err));
  };

  // Tandai Lunas Pembayaran di Admin POS
  const handleMarkAsPaid = (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId || o.invoice_number === orderId);
    const targetAmount = targetOrder ? targetOrder.total_amount : 0;

    setOrders(orders.map(o => (o.id === orderId || o.invoice_number === orderId) ? { ...o, payment_status: 'paid', paid_amount: targetAmount } : o));

    fetch(`${API_BASE}/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid', paid_amount: targetAmount })
    }).catch(err => console.log('DB error payment:', err));

    showAlertSuccess('Pelunasan Berhasil', 'Status pembayaran pesanan diperbarui menjadi LUNAS!');
  };

  // Filter Dapur Orders
  const filteredDapurOrders = orders.filter(o => {
    const matchStatus = !orderFilterStatus || o.work_status === orderFilterStatus;
    const matchKeyword = !orderSearchKeyword.trim() || 
      o.invoice_number.toLowerCase().includes(orderSearchKeyword.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(orderSearchKeyword.toLowerCase()) ||
      o.customer_phone.includes(orderSearchKeyword);
    return matchStatus && matchKeyword;
  });

  return (
    <div className="bg-slate-100 min-h-screen pb-24 font-sans text-slate-800 relative">
      
      {/* Sleek Dedicated POS Header Bar */}
      <header className="bg-teal-900 text-white p-3 sm:p-4 shadow-md sticky top-0 z-40 border-b border-teal-800 flex items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3">
          <img 
            src={storeSettings.logo_url && storeSettings.logo_url.startsWith('/images/') ? storeSettings.logo_url.slice(1) : (storeSettings.logo_url || 'images/laundry_logo.png')} 
            alt="Logo Store" 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-amber-400 shadow shrink-0"
            onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-white leading-none">{storeSettings.store_name}</h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                {loggedInStaff?.role === 'admin' ? '👑 Owner Mode' : '⚡ POS Kasir'}
              </span>
            </div>
            <p className="text-[11px] text-teal-200 mt-0.5 flex items-center gap-1 font-medium">
              <span>📍 {outlets.find(o => o.id === Number(activeOutletId))?.store_name || storeSettings.store_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Staff Info & Logout */}
          {loggedInStaff && (
            <div className="flex items-center gap-2 bg-teal-800/90 border border-teal-700/80 px-3 py-1.5 rounded-xl text-xs shadow-sm">
              <div className="text-right hidden sm:block">
                <p className="font-extrabold text-amber-300 text-xs flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {loggedInStaff.name}
                </p>
                <p className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                  {loggedInStaff.role === 'admin' ? 'Owner / Admin' : 'Kasir Shift'}
                </p>
              </div>
              <button 
                onClick={onLogoutStaff} 
                title="Logout Staff POS"
                className="p-1.5 text-amber-300 hover:text-red-300 transition hover:bg-teal-700 rounded-lg cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Clean Link to Website (HIDDEN DI APK & POS STANDALONE) */}
          {!isNativeApk && onSwitchToWebsite && (
            <button
              onClick={onSwitchToWebsite}
              className="bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-950 font-extrabold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-slate-200"
              title="Buka Halaman Utama Website"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden md:inline">Website Utama</span>
            </button>
          )}
        </div>
      </header>

      {/* SaaS Trial Status Alert Banner */}
      {currentTenant && (
        <div className={`text-xs py-2 px-4 flex items-center justify-between gap-2 shadow-inner font-sans ${
          currentTenant.status === 'active' 
            ? 'bg-emerald-800 text-emerald-100 border-b border-emerald-700'
            : currentTenant.status === 'expired'
            ? 'bg-rose-900 text-rose-100 border-b border-rose-800'
            : 'bg-amber-400 text-slate-950 font-bold border-b border-amber-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>
              <b>Status Akses:</b> {currentTenant.store_name} ({currentTenant.status === 'trial' ? 'Masa Coba Gratis 7 Hari' : currentTenant.status})
            </span>
          </div>

          <a 
            href={`https://wa.me/${(storeSettings.phone || '081234567890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo CS Provider SaaS Laundry! Saya pemilik toko ${currentTenant.store_name} (${currentTenant.email}) ingin info perpanjangan lisensi...`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-900 text-amber-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider hover:bg-slate-950 transition shrink-0 shadow-sm"
          >
            Upgrade Lisensi &rarr;
          </a>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
        {/* LOCKED SCREEN IF KASIR IS NOT LOGGED IN */}
        {!loggedInStaff ? (
          <div className="max-w-md mx-auto p-4 py-16 text-center space-y-6">
            <div className="bg-white p-8 rounded-3xl border-2 border-teal-600 shadow-2xl space-y-6">
              <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-teal-200">
                🔒
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">Akses POS Kasir Terkunci</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Silakan login dengan akun Kasir atau Owner/Admin untuk membuka transaksi kasir & mengelola toko.
                </p>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('openStaffLoginModal');
                    window.dispatchEvent(event);
                  }
                }}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-300" /> Login Kasir / Shift Sekarang &rarr;
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: POS KASIR TRANSAKSI */}
            {adminTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Customer & Services (Lg: 7) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Customer Selector */}
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" /> Pelanggan / Member
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMemberBook(true)}
                      className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3 h-3" /> Buku Member
                    </button>
                    {selectedCustomer && (
                      <button 
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {selectedCustomer ? (
                  <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-black text-teal-900 text-sm">{selectedCustomer.name}</p>
                      <p className="text-teal-700">{selectedCustomer.phone} | {selectedCustomer.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-amber-400 text-teal-950 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] block">
                        ⭐ {selectedCustomer.points} Poin
                      </span>
                      <p className="text-[10px] text-teal-800 mt-1 font-bold">
                        Saldo: Rp {selectedCustomer.deposit_balance.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input 
                        type="text"
                        placeholder="Cari Nama Pelanggan / No. HP..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {customerSearch && (
                      <div className="max-h-40 overflow-y-auto border rounded-xl divide-y text-xs bg-white shadow-lg">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-slate-400 text-center">Pelanggan tidak ditemukan</div>
                        ) : (
                          filteredCustomers.map(cust => (
                            <div 
                              key={cust.id} 
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setCustomerSearch('');
                              }}
                              className="p-2.5 hover:bg-teal-50 cursor-pointer flex justify-between items-center"
                            >
                              <div>
                                <p className="font-bold text-slate-800">{cust.name}</p>
                                <p className="text-[11px] text-slate-500">{cust.phone}</p>
                              </div>
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                                {cust.points} Poin
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {!customerSearch && (
                      <p className="text-[10px] text-slate-400 text-center">Ketik nama/HP untuk cari, atau klik <b>Buku Member</b> untuk lihat semua.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Services Grid with Category Filter & Search */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-teal-600" /> Katalog Layanan ({filteredServices.length})
                  </h3>
                  
                  {/* Service Search Input */}
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Cari Layanan..."
                      value={serviceSearchKeyword}
                      onChange={(e) => setServiceSearchKeyword(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 font-semibold"
                    />
                  </div>
                </div>

                {/* Category Selection Tabs (Kiloan, Satuan, Paket / Express) - no scroll, wrap */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'kiloan', label: '🧺 Kiloan' },
                    { id: 'satuan', label: '👔 Satuan' },
                    { id: 'express', label: '⚡ Express' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPosCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        posCategoryFilter === cat.id
                          ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Services Grid List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredServices.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs italic">
                      Tidak ada layanan pada kategori ini.
                    </div>
                  ) : (
                    filteredServices.map(srv => (
                      <div 
                        key={srv.id}
                        onClick={() => addToCart(srv)}
                        className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-2 group shadow-2xs transform active:scale-95"
                      >
                        <div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            srv.category === 'kiloan' 
                              ? 'bg-teal-100 text-teal-800' 
                              : srv.category === 'satuan' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {srv.category}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 mt-1 line-clamp-2">{srv.service_name}</h4>
                        </div>
                        <div className="flex justify-between items-center border-t pt-1.5">
                          <span className="font-black text-teal-700 text-xs">Rp {srv.price.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-slate-400">/{srv.unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: POS Cart Summary & Checkout (Lg: 5) — HIDDEN on mobile, only visible on lg+ desktop */}
            <div className="hidden lg:block lg:col-span-5">
              <POSCartSummary 
                cart={cart}
                updateCartQty={updateCartQty}
                removeFromCart={removeFromCart}
                selectedCustomer={selectedCustomer}
                storeSettings={storeSettings}
                useFirstMemberDiscount={useFirstMemberDiscount}
                setUseFirstMemberDiscount={setUseFirstMemberDiscount}
                useRedeemPointDiscount={useRedeemPointDiscount}
                setUseRedeemPointDiscount={setUseRedeemPointDiscount}
                perfumeVariant={perfumeVariant}
                setPerfumeVariant={setPerfumeVariant}
                perfumes={perfumes}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                paidAmount={paidAmount}
                setPaidAmount={setPaidAmount}
                subtotalCart={subtotalCart}
                grandTotalDiscount={grandTotalDiscount}
                finalTotalAmount={finalTotalAmount}
                totalKgOrQty={totalKgOrQty}
                handleCheckout={handleCheckout}
              />
            </div>

          </div>
        )}

        {/* TAB 2: DAPUR & DAFTAR JEMPUT */}
        {adminTab === 'orders' && (
          <div className="space-y-5">
            
            {/* 1. MASTER LANDING MENU FOR DAPUR (JIKA TAMPILAN UTAMA DAPUR) */}
            {(!dapurTab || dapurTab === 'main') && (
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-teal-700/50 space-y-3 relative overflow-hidden">
                  <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
                    <PackageCheck className="w-4 h-4 text-amber-400" /> Alur Operasional Dapur Cucian
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Dapur Cucian & Alur Pengerjaan Nota</h2>
                  <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Pantau status penerimaan antrean, proses cuci & kering, setrika uap, pewangi parfum, hingga rak penyimpanan siap diambil/diantar.
                  </p>
                </div>

                {/* Grid Menu Cards (Samakan Konsep Pengaturan Toko) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Card 1: Diterima / Antrean */}
                  <div 
                    onClick={() => { setDapurTab('list'); setOrderFilterStatus('diterima'); }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🧺
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-base group-hover:text-teal-700 transition">Antrean Diterima</h3>
                          <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.work_status === 'diterima').length} Pesanan
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Cucian baru masuk antrean yang siap diproses ke mesin cuci.</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-teal-700 group-hover:text-white transition flex items-center justify-center shrink-0">
                      &rarr;
                    </div>
                  </div>

                  {/* Card 2: Sedang Dicuci */}
                  <div 
                    onClick={() => { setDapurTab('list'); setOrderFilterStatus('dicuci'); }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🧼
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-base group-hover:text-blue-700 transition">Proses Cuci & Kering</h3>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.work_status === 'dicuci').length} Diproses
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Pencucian mesin, pembilasan detergen, & pengeringan.</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-700 group-hover:text-white transition flex items-center justify-center shrink-0">
                      &rarr;
                    </div>
                  </div>

                  {/* Card 3: Setrika & Packing */}
                  <div 
                    onClick={() => { setDapurTab('list'); setOrderFilterStatus('disetrika'); }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        👔
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-700 transition">Setrika & Packing</h3>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.work_status === 'disetrika').length} Perapian
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Setrika uap rapi, pewangi parfum, & pembungkusan plastik.</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-600 group-hover:text-white transition flex items-center justify-center shrink-0">
                      &rarr;
                    </div>
                  </div>

                  {/* Card 4: Selesai Rak Simpan */}
                  <div 
                    onClick={() => { setDapurTab('list'); setOrderFilterStatus(''); }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        ✨
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-base group-hover:text-emerald-700 transition">Semua Daftar Pesanan Dapur</h3>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {orders.length} Total Nota
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Lihat seluruh daftar nota pengerjaan cucian & penjemputan.</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-700 group-hover:text-white transition flex items-center justify-center shrink-0">
                      &rarr;
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. SUB-VIEW ORDERS LIST (JIKA MEMILIH SUB-MENU DAPUR) */}
            {dapurTab && dapurTab !== 'main' && (
              <div className="space-y-4">
                
                {/* Header Filter Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-teal-600" /> Daftar Pengerjaan Cucian ({filteredDapurOrders.length})
                    </h3>
                  </div>

                  {/* Filter inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="🔍 Cari Nomor Nota / Nama Pelanggan / No. HP..."
                      value={orderSearchKeyword}
                      onChange={(e) => setOrderSearchKeyword(e.target.value)}
                      className="p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <select 
                      value={orderFilterStatus}
                      onChange={(e) => setOrderFilterStatus(e.target.value)}
                      className="p-2.5 border rounded-xl bg-white font-semibold outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Semua Status Pengerjaan</option>
                      <option value="butuh_penjemputan">🚚 Butuh Penjemputan ({pickupPendingOrders.length})</option>
                      <option value="diterima">🧺 Diterima / Antrian</option>
                      <option value="dicuci">🧼 Sedang Dicuci</option>
                      <option value="disetrika">👔 Sedang Disetrika</option>
                      <option value="selesai">✨ Selesai Simpan Rak</option>
                      <option value="diambil">✅ Sudah Diambil</option>
                    </select>
                  </div>
                </div>

            {/* Dapur Orders List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDapurOrders.map((ord, idx) => (
                <div key={ord.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  
                  {/* Order Header */}
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-amber-300 font-mono font-black text-xs px-2 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <span className="font-extrabold text-teal-900 text-sm">{ord.invoice_number}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1">{ord.customer_name} ({ord.customer_phone})</p>
                      <p className="text-[11px] text-slate-400">{ord.created_at}</p>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      ord.work_status === 'butuh_penjemputan' ? 'bg-amber-500 text-slate-950 animate-pulse' :
                      ord.work_status === 'selesai' ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white'
                    }`}>
                      {ord.work_status}
                    </span>
                  </div>

                  {/* Order Items Summary */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border text-xs space-y-1">
                    {ord.items && ord.items.map((it, i) => (
                      <div key={i} className="flex justify-between font-medium">
                        <span>{it.service_name} ({it.qty} {it.unit || 'kg'})</span>
                        <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 flex justify-between font-extrabold text-teal-800">
                      <span>Total Tagihan:</span>
                      <span>Rp {ord.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Rack Location Dropdown (RAK 1 - RAK 30) */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block text-[11px]">📦 Lokasi Penyimpanan Rak (1 s/d 30):</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={ord.rack_location || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateRackLocation(ord.id, val);
                          if (val) {
                            showAlertSuccess('Posisi Rak Disimpan', `Lokasi penyimpan rak cucian berhasil diubah ke: ${val}`);
                          }
                        }}
                        className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs font-extrabold text-teal-900 bg-white outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm"
                      >
                        <option value="">-- Pilih Lokasi Rak (1 s/d 30) --</option>
                        {Array.from({ length: 30 }, (_, i) => `RAK ${i + 1}`).map(rackName => (
                          <option key={rackName} value={rackName}>{rackName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Work Status Switcher */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block text-[11px]">Ubah Status Pengerjaan Dapur:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'butuh_penjemputan', name: '🚛 Jemput' },
                        { id: 'diterima', name: '🧺 Diterima' },
                        { id: 'dicuci', name: '🧼 Dicuci' },
                        { id: 'disetrika', name: '👔 Setrika' },
                        { id: 'selesai', name: '✨ Selesai' },
                        { id: 'diambil', name: '✅ Diambil' }
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => handleUpdateOrderStatus(ord.id, st.id)}
                          className={`p-1.5 rounded-lg text-[10px] font-bold transition ${
                            ord.work_status === st.id ? 'bg-teal-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: Tandai Lunas & Cetak Struk */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span className="text-slate-500">Bayar:</span>
                      <span className={`uppercase font-black px-2 py-0.5 rounded text-[10px] ${
                        ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {ord.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.payment_status !== 'paid' && (
                        <button 
                          onClick={() => handleMarkAsPaid(ord.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Lunas
                        </button>
                      )}
                      <button 
                        onClick={() => setActiveReceipt(ord)}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak Struk Nota
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 3: LAPORAN */}
        {adminTab === 'reports' && (
          <ReportsView 
            key={resetSubTabKey}
            orders={orders}
            setOrders={setOrders}
            expenses={expenses}
            setExpenses={setExpenses}
            storeSettings={storeSettings}
            receiptFontSize={receiptFontSize}
            setActiveReceipt={setActiveReceipt}
            currentTenant={currentTenant}
          />
        )}

        {/* TAB 4: MANAJEMEN */}
        {adminTab === 'management' && (
          <ManagementView 
            key={resetSubTabKey}
            customers={customers}
            setCustomers={setCustomers}
            employees={employees}
            setEmployees={setEmployees}
            attendances={attendances}
            setAttendances={setAttendances}
            services={services}
            setServices={setServices}
            currentTenant={currentTenant}
          />
        )}

        {/* TAB 5: PENGATURAN */}
        {adminTab === 'settings' && (
          <OutletSettingsView 
            key={resetSubTabKey}
            storeSettings={storeSettings}
            setStoreSettings={setStoreSettings}
            outlets={outlets}
            setOutlets={setOutlets}
            activeOutletId={activeOutletId}
            setActiveOutletId={setActiveOutletId}
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            receiptFontSize={receiptFontSize}
            setReceiptFontSize={setReceiptFontSize}
            onResetData={onResetData}
            onExportData={onExportData}
            services={services}
            setServices={setServices}
            perfumes={perfumes}
            setPerfumes={setPerfumes}
            currentTenant={currentTenant}
            loggedInStaff={loggedInStaff}
          />
        )}
          </>
        )}

      </main>

      {/* ========================================================================= */}
      {/* FLOATING POS CART BUTTON (STICKY SISI KANAN BAWAH POS KASIR) (USER REQUEST) */}
      {/* ========================================================================= */}
      {adminTab === 'pos' && (
        <div className="fixed bottom-20 right-5 z-40 flex items-center gap-2 group lg:hidden">
          <div className="hidden sm:block bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            🛒 Keranjang POS ({cart.length} Item) • Rp {finalTotalAmount.toLocaleString('id-ID')}
          </div>
          <button 
            onClick={() => setShowMobileCartDrawer(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 p-4 rounded-full shadow-2xl transition transform hover:scale-110 flex items-center justify-center border-2 border-slate-950 ring-4 ring-amber-400/40 relative cursor-pointer animate-bounce"
            title="Buka Keranjang POS Kasir"
          >
            <ShoppingCart className="w-6 h-6 fill-slate-950" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[11px] rounded-full w-5 h-5 flex items-center justify-center shadow border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* BUKU MEMBER MODAL */}
      {showMemberBook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-xl">
                  <Users className="w-4 h-4 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Buku Member</h3>
                  <p className="text-[10px] text-slate-500">{customers.length} pelanggan terdaftar</p>
                </div>
              </div>
              <button onClick={() => setShowMemberBook(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau nomor HP..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                />
              </div>
            </div>

            {/* Member List */}
            <div className="overflow-y-auto flex-1 divide-y">
              {(customerSearch.trim()
                ? customers.filter(c =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.phone.includes(customerSearch)
                  )
                : customers
              ).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Tidak ada member ditemukan</div>
              ) : (
                (customerSearch.trim()
                  ? customers.filter(c =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch)
                    )
                  : customers
                ).map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setCustomerSearch('');
                      setShowMemberBook(false);
                    }}
                    className="w-full p-3 hover:bg-indigo-50 transition text-left flex justify-between items-center gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs">{cust.name}</p>
                        <p className="text-[11px] text-slate-500">{cust.phone}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-amber-100 text-amber-800 font-black text-[10px] px-2 py-0.5 rounded-full block">
                        ⭐ {cust.points} Poin
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Rp {cust.deposit_balance.toLocaleString('id-ID')}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t shrink-0">
              <button
                onClick={() => setShowMemberBook(false)}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE / RESPONSIVE CART DRAWER MODAL */}
      {showMobileCartDrawer && adminTab === 'pos' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" /> Ringkasan Keranjang Kasir POS
              </h3>
              <button onClick={() => setShowMobileCartDrawer(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <POSCartSummary 
              cart={cart}
              updateCartQty={updateCartQty}
              removeFromCart={removeFromCart}
              selectedCustomer={selectedCustomer}
              storeSettings={storeSettings}
              useFirstMemberDiscount={useFirstMemberDiscount}
              setUseFirstMemberDiscount={setUseFirstMemberDiscount}
              useRedeemPointDiscount={useRedeemPointDiscount}
              setUseRedeemPointDiscount={setUseRedeemPointDiscount}
              perfumeVariant={perfumeVariant}
              setPerfumeVariant={setPerfumeVariant}
              perfumes={perfumes}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              paidAmount={paidAmount}
              setPaidAmount={setPaidAmount}
              subtotalCart={subtotalCart}
              grandTotalDiscount={grandTotalDiscount}
              finalTotalAmount={finalTotalAmount}
              totalKgOrQty={totalKgOrQty}
              handleCheckout={handleCheckout}
            />
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-40 px-1 py-1.5 flex justify-around items-center max-w-7xl mx-auto">
        <button 
          onClick={() => handleNavClick('pos')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
            adminTab === 'pos' ? 'text-teal-700 font-black scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          <span>POS Kasir</span>
        </button>

        <button 
          onClick={() => handleNavClick('orders')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-extrabold transition relative cursor-pointer ${
            adminTab === 'orders' ? 'text-teal-700 font-black scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {pickupPendingOrders.length > 0 && (
            <span className="absolute -top-1 right-2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center animate-pulse">
              {pickupPendingOrders.length}
            </span>
          )}
          <PackageCheck className="w-4.5 h-4.5" />
          <span>Dapur Cucian</span>
        </button>

        {(!loggedInStaff || loggedInStaff.role === 'admin') && (
          <>
            <button 
              onClick={() => handleNavClick('reports')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                adminTab === 'reports' ? 'text-teal-700 font-black scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChart className="w-4.5 h-4.5" />
              <span>Laporan</span>
            </button>

            <button 
              onClick={() => handleNavClick('management')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                adminTab === 'management' ? 'text-teal-700 font-black scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Manajemen</span>
            </button>

            <button 
              onClick={() => handleNavClick('settings')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                adminTab === 'settings' ? 'text-teal-700 font-black scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>Pengaturan</span>
            </button>
          </>
        )}
      </nav>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-sans print:p-0 print:bg-white print:static print:block">
          <div className="bg-white p-5 rounded-2xl max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none print:max-h-none print:w-auto">
            <div 
              id="printable-receipt" 
              className={receiptFontSize === '58mm' ? 'thermal-58mm' : 'thermal-80mm'}
              style={{
                fontFamily: "Consolas, 'Courier New', monospace, sans-serif",
                fontSize: receiptFontSize === '58mm' ? '11.5px' : receiptFontSize === 'large' ? '14px' : '13px',
                lineHeight: '1.3',
                letterSpacing: '-0.2px',
                color: '#000000',
                backgroundColor: '#ffffff',
                padding: '10px 6px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: '700'
              }}
            >
              {/* Header Block: Logo Left + Store Info Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1.5px solid #000000', paddingBottom: '6px' }}>
                {/* Logo on Left */}
                <div style={{ flexShrink: 0 }}>
                  {storeSettings.logo_url ? (
                    <img 
                      src={storeSettings.logo_url} 
                      alt="Logo" 
                      style={{ 
                        width: receiptFontSize === '58mm' ? '50px' : '75px', 
                        height: receiptFontSize === '58mm' ? '50px' : '75px', 
                        objectFit: 'contain', 
                        borderRadius: '6px',
                        display: 'block'
                      }} 
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ 
                      width: receiptFontSize === '58mm' ? '50px' : '75px', 
                      height: receiptFontSize === '58mm' ? '50px' : '75px', 
                      backgroundColor: '#f1f5f9', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '22px'
                    }}>🧺</div>
                  )}
                </div>

                {/* Store Info on Right */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontWeight: '900', fontSize: receiptFontSize === '58mm' ? '13.5px' : '17px', lineHeight: '1.2', marginBottom: '2px', wordBreak: 'break-word', color: '#000000' }}>
                    {storeSettings.store_name || 'Nama Toko'}
                  </div>
                  <div style={{ fontSize: receiptFontSize === '58mm' ? '10px' : '11.5px', color: '#000000', lineHeight: '1.2', marginBottom: '2px', wordBreak: 'break-word' }}>
                    {storeSettings.address || ''}
                  </div>
                  <div style={{ fontSize: receiptFontSize === '58mm' ? '10px' : '11.5px', color: '#000000', lineHeight: '1.2' }}>
                    Telp: {storeSettings.phone || ''}
                  </div>
                </div>
              </div>

              {/* Header Note */}
              <div style={{ textAlign: 'center', fontWeight: '900', borderTop: '1px dashed #000000', borderBottom: '1px dashed #000000', padding: '3px 0', margin: '4px 0', fontSize: receiptFontSize === '58mm' ? '10.5px' : '12px', color: '#000000' }}>
                {storeSettings.header_receipt_note || 'Nota Resmi Pembayaran Laundry'}
              </div>

              {/* Invoice Info */}
              <div style={{ margin: '5px 0', lineHeight: '1.35', color: '#000000', fontSize: receiptFontSize === '58mm' ? '11px' : '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px' }}>
                  <span>No. Invoice</span>
                  <span style={{ fontWeight: '900' }}>{activeReceipt.invoice_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px' }}>
                  <span>Tanggal</span>
                  <span>{
                    (() => {
                      if (!activeReceipt.created_at) return new Date().toLocaleString('id-ID');
                      try {
                        const d = new Date(activeReceipt.created_at);
                        if (!isNaN(d.getTime())) {
                          const dd = String(d.getDate()).padStart(2, '0');
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const yyyy = d.getFullYear();
                          const hh = String(d.getHours()).padStart(2, '0');
                          const min = String(d.getMinutes()).padStart(2, '0');
                          return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
                        }
                      } catch (e) {}
                      return String(activeReceipt.created_at).replace('T', ' ').replace('.000Z', '').slice(0, 16);
                    })()
                  }</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px' }}>
                  <span>Pelanggan</span>
                  <span style={{ fontWeight: '900' }}>{activeReceipt.customer_name}</span>
                </div>
                {activeReceipt.perfume_variant && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px' }}>
                    <span>Parfum</span>
                    <span>{activeReceipt.perfume_variant}</span>
                  </div>
                )}
                {activeReceipt.rack_location && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px' }}>
                    <span>Rak</span>
                    <span style={{ fontWeight: '900' }}>{activeReceipt.rack_location}</span>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }}></div>

              {/* Items */}
              <div style={{ margin: '4px 0', color: '#000000' }}>
                <div style={{ fontWeight: '900', marginBottom: '3px', fontSize: receiptFontSize === '58mm' ? '11.5px' : '13.5px' }}>Detail Pesanan:</div>
                {activeReceipt.items && activeReceipt.items.map((it, idx) => (
                  <div key={idx} style={{ marginBottom: '3px' }}>
                    <div style={{ fontWeight: '900', wordBreak: 'break-word' }}>
                      {it.service_name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000000', fontSize: receiptFontSize === '58mm' ? '10.5px' : '12.5px' }}>
                      <span>&nbsp;{it.qty} {it.unit || 'kg'} x Rp {Math.round(Number(it.price_per_unit) || 0).toLocaleString('id-ID')}</span>
                      <span style={{ fontWeight: '900' }}>Rp {Math.round(Number(it.subtotal) || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }}></div>

              {/* Totals */}
              <div style={{ margin: '4px 0', lineHeight: '1.4', color: '#000000', fontSize: receiptFontSize === '58mm' ? '11px' : '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>Rp {Math.round(Number(activeReceipt.subtotal_amount || activeReceipt.total_amount) || 0).toLocaleString('id-ID')}</span>
                </div>
                {activeReceipt.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Diskon</span>
                    <span>- Rp {Math.round(Number(activeReceipt.discount_amount) || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {activeReceipt.shipping_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ongkir</span>
                    <span>+ Rp {Math.round(Number(activeReceipt.shipping_fee) || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {activeReceipt.other_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Biaya Lain</span>
                    <span>+ Rp {Math.round(Number(activeReceipt.other_fee) || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: receiptFontSize === '58mm' ? '13px' : '16px', borderTop: '1.5px solid #000000', paddingTop: '3px', marginTop: '3px', color: '#000000' }}>
                  <span>TOTAL</span>
                  <span>Rp {Math.round(Number(activeReceipt.total_amount) || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bayar ({(activeReceipt.payment_type || 'cash').toUpperCase()})</span>
                  <span>Rp {Math.round(Number(activeReceipt.paid_amount) || 0).toLocaleString('id-ID')}</span>
                </div>
                {activeReceipt.change_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kembali</span>
                    <span>Rp {Math.round(Number(activeReceipt.change_amount) || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Status Box */}
              <div style={{ textAlign: 'center', margin: '6px 0', fontWeight: '900', padding: '4px', border: '1.5px solid #000000', borderRadius: '4px', color: '#000000', fontSize: receiptFontSize === '58mm' ? '11px' : '13px' }}>
                {activeReceipt.payment_status === 'paid' ? '✅ LUNAS' : '⏳ BELUM BAYAR'}
              </div>

              {/* Footer Note */}
              <div style={{ borderTop: '1px dashed #000000', paddingTop: '5px', marginTop: '5px', textAlign: 'center', fontSize: receiptFontSize === '58mm' ? '9px' : '10.5px', color: '#000000', fontStyle: 'italic' }}>
                {storeSettings.footer_receipt_note || 'Terima kasih telah mempercayakan pakaian Anda kepada kami!'}
              </div>

              {/* Powered By */}
              <div style={{ textAlign: 'center', fontSize: '8px', color: '#000000', marginTop: '4px', paddingTop: '3px', borderTop: '1px dashed #000000' }}>
                Powered by App Laundry System
              </div>
            </div>

            <div className="space-y-2 print:hidden">
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                >
                  <Printer className="w-4 h-4" /> Cetak Thermal
                </button>
                <button 
                  onClick={async () => {
                    const receiptElem = document.getElementById('printable-receipt');
                    if (!receiptElem) return;
                    try {
                      const canvas = await html2canvas(receiptElem, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                      const image = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.href = image;
                      link.download = `Struk-${activeReceipt.invoice_number || 'Laundry'}.png`;
                      link.click();
                      showAlertSuccess('Struk Terunduh (PNG)', 'Gambar struk resmi berhasil diunduh ke memori perangkat!');
                    } catch (err) {
                      console.error('Download error:', err);
                      showAlertError('Gagal Unduh Gambar', 'Tidak dapat memproses gambar struk.');
                    }
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                >
                  <Download className="w-4 h-4" /> Unduh Gambar (PNG)
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    if (!activeReceipt) return;
                    const receiptElem = document.getElementById('printable-receipt');
                    if (receiptElem) {
                      try {
                        const canvas = await html2canvas(receiptElem, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
                        const image = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.href = image;
                        link.download = `Struk-${activeReceipt.invoice_number || 'Laundry'}.png`;
                        link.click();
                      } catch (e) {}
                    }

                    let phone = (activeReceipt.customer_phone || '').replace(/\D/g, '');
                    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

                    const waText = encodeURIComponent(
                      `Halo *${activeReceipt.customer_name}*, terima kasih telah mempercayakan pakaian Anda di *${storeSettings.store_name}*! 🙏\n\n` +
                      `📌 *NO INVOICE:* ${activeReceipt.invoice_number}\n` +
                      `📅 *TANGGAL:* ${activeReceipt.created_at}\n` +
                      `💰 *TOTAL AKHIR:* Rp ${(activeReceipt.total_amount || 0).toLocaleString('id-ID')}\n` +
                      `🏷️ *STATUS:* ${(activeReceipt.payment_status === 'paid' ? '✅ LUNAS' : '⏳ BELUM BAYAR')}\n\n` +
                      `📸 *FOTO STRUK RESMI TERUNDUH:* File gambar nota struk resmi sudah otomatis terunduh. Cukup *Paste (Ctrl+V)* atau *Lampirkan Gambar* di chat ini!`
                    );

                    if (phone) {
                      window.open(`https://wa.me/${phone}?text=${waText}`, '_blank');
                    } else {
                      window.open(`https://wa.me/?text=${waText}`, '_blank');
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                >
                  <Share2 className="w-4 h-4" /> 💬 Forward Struk (Gambar) Ke WA Member
                </button>
                <button 
                  onClick={() => setActiveReceipt(null)}
                  className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// POS CART SUMMARY SUB-COMPONENT FOR REUSABILITY
function POSCartSummary({
  cart,
  updateCartQty,
  removeFromCart,
  selectedCustomer,
  storeSettings,
  useFirstMemberDiscount,
  setUseFirstMemberDiscount,
  useRedeemPointDiscount,
  setUseRedeemPointDiscount,
  perfumeVariant,
  setPerfumeVariant,
  perfumes = [],
  paymentType,
  setPaymentType,
  paymentStatus,
  setPaymentStatus,
  paidAmount,
  setPaidAmount,
  subtotalCart,
  grandTotalDiscount,
  finalTotalAmount,
  totalKgOrQty,
  handleCheckout
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-teal-600" /> Rincian Keranjang ({cart.length} Item)
        </h3>
        <span className="font-mono text-xs font-bold text-teal-700">Subtotal: Rp {subtotalCart.toLocaleString('id-ID')}</span>
      </div>

      {/* Diskon Member Options */}
      {selectedCustomer && (
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2 text-xs">
          <p className="font-black text-amber-900 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5" /> Diskon Pelanggan Member:
          </p>

          {selectedCustomer.is_first_order ? (
            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-300">
              <input 
                type="checkbox" 
                checked={useFirstMemberDiscount}
                onChange={(e) => setUseFirstMemberDiscount(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
              <span className="font-bold text-amber-900">
                Diskon Member Baru (Potongan Rp {(storeSettings.first_member_discount || 10000).toLocaleString('id-ID')})
              </span>
            </label>
          ) : (
            <p className="text-[10px] text-slate-500 italic">*Pelanggan sudah pernah transaksi pertama.</p>
          )}

          {selectedCustomer.points >= (storeSettings.point_redeem_threshold || 10) && (
            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-amber-300">
              <input 
                type="checkbox" 
                checked={useRedeemPointDiscount}
                onChange={(e) => setUseRedeemPointDiscount(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
              <span className="font-bold text-emerald-800">
                Tukar 10 Poin Dengan Diskon Rp {(storeSettings.point_redeem_discount || 10000).toLocaleString('id-ID')}
              </span>
            </label>
          )}
        </div>
      )}

      {/* Cart Item List */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Keranjang kosong. Pilih layanan untuk menambah item.
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border text-xs">
              <div className="flex-1 pr-2">
                <p className="font-bold text-slate-800">{item.service_name}</p>
                <p className="text-[11px] text-slate-500">Rp {item.price.toLocaleString('id-ID')} / {item.unit}</p>
              </div>
              
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  value={item.qty}
                  onChange={(e) => updateCartQty(item.id, e.target.value)}
                  className="w-14 p-1 border rounded text-center font-bold text-xs"
                />
                <span className="text-[11px] text-slate-500">{item.unit}</span>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Aroma Parfum */}
      {perfumes.length > 0 && (
        <div className="text-xs">
          <label className="font-bold text-slate-600 block mb-1">🌸 Aroma Parfum</label>
          <select 
            value={perfumeVariant} 
            onChange={(e) => setPerfumeVariant(e.target.value)}
            className="w-full text-xs p-2 border rounded-xl bg-white"
          >
            {perfumes.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Payment options */}
      <div className="bg-slate-50 p-3 rounded-xl border space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-600">Status Pembayaran:</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setPaymentStatus('paid')} 
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${paymentStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              Lunas
            </button>
            <button 
              onClick={() => setPaymentStatus('unpaid')} 
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${paymentStatus === 'unpaid' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              Bayar Nanti
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 border-t">
          <span className="font-bold text-slate-600">Metode Bayar:</span>
          <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="text-xs p-1.5 border rounded-lg bg-white font-semibold">
            <option value="cash">Tunai / Cash</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
            <option value="deposit">Saldo Deposit Member</option>
          </select>
        </div>
      </div>

      {/* Total & Checkout */}
      <div className="pt-2 border-t space-y-2">
        {grandTotalDiscount > 0 && (
          <div className="flex justify-between items-center text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <span>Total Diskon:</span>
            <span>- Rp {grandTotalDiscount.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline">
          <span className="text-slate-600 font-bold text-xs">Total Tagihan Akhir:</span>
          <span className="text-2xl font-black text-teal-700">Rp {finalTotalAmount.toLocaleString('id-ID')}</span>
        </div>

        {selectedCustomer && (
          <p className="text-[10px] text-teal-800 font-semibold text-right">
            + Pelanggan ini akan mendapatkan <b>+{Math.floor(totalKgOrQty)} Poin</b> dari transaksi ini!
          </p>
        )}

        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-extrabold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Cetak Struk &amp; Simpan Transaksi
        </button>
      </div>
    </div>
  );
}

