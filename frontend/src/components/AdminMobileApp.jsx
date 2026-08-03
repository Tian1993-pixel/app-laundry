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
  ShoppingCart
} from 'lucide-react';

export default function AdminMobileApp({
  storeSettings,
  setStoreSettings,
  services,
  setServices,
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
  onExportData
}) {
  const [adminTab, setAdminTab] = useState('pos');

  // POS State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [perfumeVariant, setPerfumeVariant] = useState('Original Fresh');
  const [rackLocation, setRackLocation] = useState('RAK A-01');
  const [paymentType, setPaymentType] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paidAmount, setPaidAmount] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showMobileCartDrawer, setShowMobileCartDrawer] = useState(false);

  // Custom Discounts & Additional Fees
  const [useFirstMemberDiscount, setUseFirstMemberDiscount] = useState(false);
  const [useRedeemPointDiscount, setUseRedeemPointDiscount] = useState(false);
  
  const [customDiscountValue, setCustomDiscountValue] = useState(0);
  const [customDiscountType, setCustomDiscountType] = useState('fixed');
  
  const [shippingFee, setShippingFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [otherFeeNote, setOtherFeeNote] = useState('');

  // Filter Dapur Order
  const [orderFilterStatus, setOrderFilterStatus] = useState('');
  const [orderSearchKeyword, setOrderSearchKeyword] = useState('');

  // Count orders that need pickup
  const pickupPendingOrders = orders.filter(o => o.work_status === 'butuh_penjemputan');

  // Cart operations
  const addToCart = (service) => {
    const existing = cart.find(item => item.id === service.id);
    if (existing) {
      setCart(cart.map(item => item.id === service.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...service, qty: service.unit === 'kg' ? 3.0 : 1 }]);
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

  // Calculate discounts
  let firstDiscountAmount = 0;
  if (useFirstMemberDiscount && selectedCustomer && selectedCustomer.is_first_order) {
    firstDiscountAmount = storeSettings.first_member_discount || 10000;
  }

  let pointDiscountAmount = 0;
  if (useRedeemPointDiscount && selectedCustomer && selectedCustomer.points >= (storeSettings.point_redeem_threshold || 10)) {
    pointDiscountAmount = storeSettings.point_redeem_discount || 10000;
  }

  let customDiscountAmount = 0;
  if (customDiscountValue > 0) {
    if (customDiscountType === 'percentage') {
      customDiscountAmount = (subtotalCart * customDiscountValue) / 100;
    } else {
      customDiscountAmount = parseFloat(customDiscountValue) || 0;
    }
  }

  const grandTotalDiscount = firstDiscountAmount + pointDiscountAmount + customDiscountAmount;
  const totalAdditionalFees = (parseFloat(shippingFee) || 0) + (parseFloat(otherFee) || 0);

  const finalTotalAmount = Math.max(0, subtotalCart - grandTotalDiscount + totalAdditionalFees);

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
    const invoiceNo = `LD-${dateStr}-${String(orders.length + 1).padStart(3, '0')}`;

    const newOrder = {
      id: Date.now(),
      invoice_number: invoiceNo,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      subtotal_amount: subtotalCart,
      discount_amount: grandTotalDiscount,
      shipping_fee: parseFloat(shippingFee) || 0,
      other_fee: parseFloat(otherFee) || 0,
      total_amount: finalTotalAmount,
      paid_amount: paymentStatus === 'paid' ? finalTotalAmount : (parseFloat(paidAmount) || 0),
      change_amount: paymentStatus === 'paid' && paidAmount > finalTotalAmount ? (paidAmount - finalTotalAmount) : 0,
      payment_type: paymentType,
      payment_status: paymentStatus,
      work_status: 'diterima',
      rack_location: rackLocation || 'RAK A-01',
      perfume_variant: perfumeVariant,
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

    // Save to MySQL DB
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.log('DB order error:', err));

    setActiveReceipt(newOrder);

    // Reset Form
    setCart([]);
    setSelectedCustomer(null);
    setUseFirstMemberDiscount(false);
    setUseRedeemPointDiscount(false);
    setCustomDiscountValue(0);
    setShippingFee(0);
    setOtherFee(0);
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
      
      {/* Top Mobile Bar */}
      <div className="bg-teal-900 text-white p-4 shadow-md flex justify-between items-center sticky top-16 z-30">
        <div>
          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">Mode POS Kasir</span>
          <h2 className="font-extrabold text-base leading-tight mt-0.5">{storeSettings.store_name}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-teal-200">{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="text-[10px] text-amber-300 font-mono">Kasir Aktif</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* TAB 1: POS KASIR TRANSAKSI */}
        {adminTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Customer & Services (Lg: 7) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Customer Selector */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" /> Pelanggan / Member
                  </h3>
                  {selectedCustomer && (
                    <button 
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Batal Pilih
                    </button>
                  )}
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
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text"
                        placeholder="Cari Nama Pelanggan / No. HP..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {customerSearch && (
                      <div className="max-h-36 overflow-y-auto border rounded-xl divide-y text-xs bg-white shadow-lg">
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
                  </div>
                )}
              </div>

              {/* Services Grid */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-2">
                  <Shirt className="w-4 h-4 text-teal-600" /> Katalog Layanan & Produk
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {services.map(srv => (
                    <div 
                      key={srv.id}
                      onClick={() => addToCart(srv)}
                      className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-xl transition cursor-pointer flex flex-col justify-between space-y-2 group shadow-2xs"
                    >
                      <div>
                        <span className="text-[9px] bg-slate-200 group-hover:bg-teal-200 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                          {srv.category}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-800 mt-1 line-clamp-2">{srv.service_name}</h4>
                      </div>
                      <div className="flex justify-between items-center border-t pt-1.5">
                        <span className="font-black text-teal-700 text-xs">Rp {srv.price.toLocaleString('id-ID')}</span>
                        <span className="text-[10px] text-slate-400">/{srv.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: POS Cart Summary & Checkout (Lg: 5) */}
            <div className="lg:col-span-5">
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
                customDiscountValue={customDiscountValue}
                setCustomDiscountValue={setCustomDiscountValue}
                customDiscountType={customDiscountType}
                setCustomDiscountType={setCustomDiscountType}
                shippingFee={shippingFee}
                setShippingFee={setShippingFee}
                otherFee={otherFee}
                setOtherFee={setOtherFee}
                perfumeVariant={perfumeVariant}
                setPerfumeVariant={setPerfumeVariant}
                rackLocation={rackLocation}
                setRackLocation={setRackLocation}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                paidAmount={paidAmount}
                setPaidAmount={setPaidAmount}
                subtotalCart={subtotalCart}
                grandTotalDiscount={grandTotalDiscount}
                totalAdditionalFees={totalAdditionalFees}
                finalTotalAmount={finalTotalAmount}
                totalKgOrQty={totalKgOrQty}
                handleCheckout={handleCheckout}
              />
            </div>

          </div>
        )}

        {/* TAB 2: DAPUR & DAFTAR JEMPUT */}
        {adminTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Header Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-teal-600" /> Dapur Cucian & Daftar Jemput
                  </h3>
                  <p className="text-xs text-slate-500">Pantau proses penjemputan, cuci, setrika, & rak simpan</p>
                </div>
                <span className="bg-teal-100 text-teal-800 font-extrabold text-xs px-3 py-1 rounded-full">
                  Total Tampil: {filteredDapurOrders.length} Pesanan
                </span>
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

                  {/* Action Buttons: Cetak Struk */}
                  <div className="pt-1 flex justify-end">
                    <button 
                      onClick={() => setActiveReceipt(ord)}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Struk Nota
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: LAPORAN */}
        {adminTab === 'reports' && (
          <ReportsView 
            orders={orders}
            expenses={expenses}
            setExpenses={setExpenses}
            storeSettings={storeSettings}
            receiptFontSize={receiptFontSize}
            setActiveReceipt={setActiveReceipt}
          />
        )}

        {/* TAB 4: MANAJEMEN */}
        {adminTab === 'management' && (
          <ManagementView 
            customers={customers}
            setCustomers={setCustomers}
            employees={employees}
            setEmployees={setEmployees}
            attendances={attendances}
            setAttendances={setAttendances}
          />
        )}

        {/* TAB 5: PENGATURAN */}
        {adminTab === 'settings' && (
          <OutletSettingsView 
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
          />
        )}

      </main>

      {/* ========================================================================= */}
      {/* FLOATING POS CART BUTTON (STICKY SISI KANAN BAWAH POS KASIR) (USER REQUEST) */}
      {/* ========================================================================= */}
      {adminTab === 'pos' && (
        <div className="fixed bottom-20 right-5 z-40 flex items-center gap-2 group">
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
              customDiscountValue={customDiscountValue}
              setCustomDiscountValue={setCustomDiscountValue}
              customDiscountType={customDiscountType}
              setCustomDiscountType={setCustomDiscountType}
              shippingFee={shippingFee}
              setShippingFee={setShippingFee}
              otherFee={otherFee}
              setOtherFee={setOtherFee}
              perfumeVariant={perfumeVariant}
              setPerfumeVariant={setPerfumeVariant}
              rackLocation={rackLocation}
              setRackLocation={setRackLocation}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              paidAmount={paidAmount}
              setPaidAmount={setPaidAmount}
              subtotalCart={subtotalCart}
              grandTotalDiscount={grandTotalDiscount}
              totalAdditionalFees={totalAdditionalFees}
              finalTotalAmount={finalTotalAmount}
              totalKgOrQty={totalKgOrQty}
              handleCheckout={handleCheckout}
            />
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40 px-1 py-2 flex justify-around items-center">
        <button 
          onClick={() => setAdminTab('pos')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition ${
            adminTab === 'pos' ? 'text-teal-700 scale-105' : 'text-slate-400'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>POS Kasir</span>
        </button>

        <button 
          onClick={() => setAdminTab('orders')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition relative ${
            adminTab === 'orders' ? 'text-teal-700 scale-105' : 'text-slate-400'
          }`}
        >
          {pickupPendingOrders.length > 0 && (
            <span className="absolute -top-1 right-2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
              {pickupPendingOrders.length}
            </span>
          )}
          <PackageCheck className="w-5 h-5" />
          <span>Dapur</span>
        </button>

        <button 
          onClick={() => setAdminTab('reports')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition ${
            adminTab === 'reports' ? 'text-teal-700 scale-105' : 'text-slate-400'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span>Laporan</span>
        </button>

        <button 
          onClick={() => setAdminTab('management')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition ${
            adminTab === 'management' ? 'text-teal-700 scale-105' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Manajemen</span>
        </button>

        <button 
          onClick={() => setAdminTab('settings')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition ${
            adminTab === 'settings' ? 'text-teal-700 scale-105' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Pengaturan</span>
        </button>
      </nav>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white p-5 rounded-2xl max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div 
              id="printable-receipt" 
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: receiptFontSize === '58mm' ? '9px' : receiptFontSize === 'large' ? '12px' : '10px',
                lineHeight: receiptFontSize === '58mm' ? '1.3' : receiptFontSize === 'large' ? '1.5' : '1.4',
                color: '#1e293b',
                backgroundColor: '#f8fafc',
                padding: '16px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '12px'
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
                    {storeSettings.address || ''}
                  </div>
                  <div style={{ fontSize: receiptFontSize === '58mm' ? '8px' : receiptFontSize === 'large' ? '11px' : '9.5px', color: '#475569', lineHeight: '1.3' }}>
                    Telp: {storeSettings.phone || ''}
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
                  <span style={{ fontWeight: 'bold' }}>{activeReceipt.invoice_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tanggal</span>
                  <span>{activeReceipt.created_at}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pelanggan</span>
                  <span>{activeReceipt.customer_name}</span>
                </div>
                {activeReceipt.perfume_variant && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Parfum</span>
                    <span>{activeReceipt.perfume_variant}</span>
                  </div>
                )}
                {activeReceipt.rack_location && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Rak</span>
                    <span>{activeReceipt.rack_location}</span>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dashed #94a3b8', margin: '4px 0' }}></div>

              {/* Items */}
              <div style={{ margin: '4px 0' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Detail Pesanan:</div>
                {activeReceipt.items && activeReceipt.items.map((it, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.service_name}</span>
                      <span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>&nbsp;&nbsp;{it.qty} {it.unit || 'kg'} x Rp {(it.price_per_unit || 0).toLocaleString('id-ID')}</span>
                      <span>Rp {(it.subtotal || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px dashed #94a3b8', margin: '4px 0' }}></div>

              {/* Totals */}
              <div style={{ margin: '4px 0', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>Rp {((activeReceipt.subtotal_amount || activeReceipt.total_amount) || 0).toLocaleString('id-ID')}</span>
                </div>
                {activeReceipt.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Diskon</span>
                    <span>- Rp {activeReceipt.discount_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {activeReceipt.shipping_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ongkir</span>
                    <span>+ Rp {activeReceipt.shipping_fee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {activeReceipt.other_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Biaya Lain</span>
                    <span>+ Rp {activeReceipt.other_fee.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: receiptFontSize === '58mm' ? '10px' : receiptFontSize === 'large' ? '14px' : '12px', borderTop: '1px solid #334155', paddingTop: '3px', marginTop: '3px' }}>
                  <span>TOTAL</span>
                  <span>Rp {(activeReceipt.total_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bayar ({(activeReceipt.payment_type || 'cash').toUpperCase()})</span>
                  <span>Rp {(activeReceipt.paid_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                {activeReceipt.change_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kembali</span>
                    <span>Rp {activeReceipt.change_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div style={{ textAlign: 'center', margin: '6px 0', fontWeight: 'bold', padding: '3px', border: `1px solid ${activeReceipt.payment_status === 'paid' ? '#0f766e' : '#d97706'}`, borderRadius: '4px', color: activeReceipt.payment_status === 'paid' ? '#0f766e' : '#d97706' }}>
                {activeReceipt.payment_status === 'paid' ? '✅ LUNAS' : '⏳ BELUM BAYAR'}
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

            <div className="space-y-2">
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
  customDiscountValue,
  setCustomDiscountValue,
  customDiscountType,
  setCustomDiscountType,
  shippingFee,
  setShippingFee,
  otherFee,
  setOtherFee,
  perfumeVariant,
  setPerfumeVariant,
  rackLocation,
  setRackLocation,
  paymentType,
  setPaymentType,
  paymentStatus,
  setPaymentStatus,
  paidAmount,
  setPaidAmount,
  subtotalCart,
  grandTotalDiscount,
  totalAdditionalFees,
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

      {/* Diskon & Promo Options */}
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
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Keranjang kosong. Pilih layanan di sebelah kiri untuk menambah item.
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

      {/* Manual Custom Discount & Extra Fees */}
      <div className="space-y-2 pt-2 border-t text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Diskon Lain (Manual)</label>
            <div className="flex gap-1">
              <input 
                type="number" 
                placeholder="0"
                value={customDiscountValue} 
                onChange={(e) => setCustomDiscountValue(e.target.value)}
                className="w-full p-1.5 border rounded-lg bg-white font-bold text-xs"
              />
              <select 
                value={customDiscountType}
                onChange={(e) => setCustomDiscountType(e.target.value)}
                className="p-1.5 border rounded-lg text-xs font-bold bg-slate-100"
              >
                <option value="fixed">Rp</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Biaya Ongkir (Rp)</label>
            <input 
              type="number"
              placeholder="0"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value)}
              className="w-full p-1.5 border rounded-lg bg-white font-bold text-xs"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Biaya Lain-Lain (Penanganan/Admin)</label>
          <input 
            type="number"
            placeholder="0"
            value={otherFee}
            onChange={(e) => setOtherFee(e.target.value)}
            className="w-full p-1.5 border rounded-lg bg-white font-bold text-xs"
          />
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="font-bold text-slate-600 block mb-1">Aroma Parfum</label>
          <select 
            value={perfumeVariant} 
            onChange={(e) => setPerfumeVariant(e.target.value)}
            className="w-full text-xs p-2 border rounded-lg bg-white"
          >
            <option value="Original Fresh">Original Fresh</option>
            <option value="Lavender Sweet">Lavender Sweet</option>
            <option value="Ocean Blue">Ocean Blue</option>
            <option value="Snappy Fresh">Snappy Fresh</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-slate-600 block mb-1">Lokasi Rak</label>
          <input 
            type="text" 
            value={rackLocation} 
            onChange={(e) => setRackLocation(e.target.value)}
            className="w-full text-xs p-2 border rounded-lg"
            placeholder="RAK A-01"
          />
        </div>
      </div>

      {/* Payment options */}
      <div className="bg-slate-50 p-3 rounded-xl border space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-600">Status Pembayaran:</span>
          <div className="flex gap-1">
            <button 
              onClick={() => setPaymentStatus('paid')} 
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${paymentStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
            >
              Lunas
            </button>
            <button 
              onClick={() => setPaymentStatus('unpaid')} 
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${paymentStatus === 'unpaid' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}
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

        {totalAdditionalFees > 0 && (
          <div className="flex justify-between items-center text-xs text-slate-700 font-bold bg-slate-100 p-2 rounded-lg border">
            <span>Tambahan Biaya (Ongkir/Lainnya):</span>
            <span>+ Rp {totalAdditionalFees.toLocaleString('id-ID')}</span>
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
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-extrabold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
        >
          <Printer className="w-4 h-4" /> Cetak Struk & Simpan Transaksi
        </button>
      </div>
    </div>
  );
}
