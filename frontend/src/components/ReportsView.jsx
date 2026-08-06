import React, { useState } from 'react';
import { 
  Printer,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  PieChart, 
  Shirt, 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Filter,
  Layers,
  Award,
  Search,
  BarChart3
} from 'lucide-react';
import { showAlertSuccess, showAlertWarning } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

export default function ReportsView({ orders = [], setOrders, expenses = [], setExpenses, customers = [], services = [], storeSettings = {}, receiptFontSize = '80mm', setActiveReceipt, currentTenant }) {
  const [reportTab, setReportTab] = useState('main');
  const [dateFilterMode, setDateFilterMode] = useState('today'); // 'today' | 'this_month' | 'custom' | 'all'
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Expense Form Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', category: 'Operasional', amount: '', notes: '' });

  const activeTenantId = currentTenant?.id || storeSettings?.tenant_id || 1;

  // ... (rest of code)
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return showAlertWarning('Form Incomplete', 'Lengkapi judul dan jumlah pengeluaran!');

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const tempId = Date.now();
    const created = {
      id: tempId,
      tenant_id: activeTenantId,
      title: newExpense.title,
      category: newExpense.category || 'Operasional',
      amount: Number(newExpense.amount),
      notes: newExpense.notes || '-',
      date: formattedDate
    };

    setExpenses([created, ...expenses]);

    fetch(`${API_BASE}/expenses?tenant_id=${activeTenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.id) {
          setExpenses(prev => prev.map(exp => exp.id === tempId ? { ...exp, id: data.id } : exp));
        }
      })
      .catch(err => console.log('DB expense error:', err));

    setNewExpense({ title: '', category: 'Operasional', amount: '', notes: '' });
    setShowAddExpense(false);
    showAlertSuccess('Pengeluaran Dicatat', `Pengeluaran "${created.title}" sebesar Rp ${Number(newExpense.amount).toLocaleString('id-ID')} berhasil disimpan!`);
  };

  // Date Filtering Helpers (Robust Matcher for all locale formats & Date Range)
  const nowObj = new Date();
  const todayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;
  const thisMonthStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}`;

  const isDateMatch = (dateVal, filterMode) => {
    if (!dateVal || filterMode === 'all') return true;

    const str = String(dateVal).trim();

    // 1. Try parsing DD/MM/YYYY or D/M/YYYY
    let parsedYear = null;
    let parsedMonth = null; // 0-indexed
    let parsedDate = null;

    if (str.includes('/')) {
      const cleanStr = str.split(',')[0].split(' ')[0].trim();
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        parsedDate = parseInt(parts[0], 10);
        parsedMonth = parseInt(parts[1], 10) - 1;
        parsedYear = parseInt(parts[2], 10);
      }
    }

    // 2. Try Standard JS Date parse if 1 failed
    if (!parsedYear || isNaN(parsedYear)) {
      const dObj = new Date(str);
      if (dObj && !isNaN(dObj.getTime())) {
        parsedYear = dObj.getFullYear();
        parsedMonth = dObj.getMonth();
        parsedDate = dObj.getDate();
      }
    }

    // Custom Date Range match
    if (filterMode === 'custom') {
      let formattedStr = '';
      if (parsedYear && parsedMonth !== null && parsedDate) {
        formattedStr = `${parsedYear}-${String(parsedMonth + 1).padStart(2, '0')}-${String(parsedDate).padStart(2, '0')}`;
      } else {
        formattedStr = str.slice(0, 10);
      }
      if (startDate && endDate) {
        return formattedStr >= startDate && formattedStr <= endDate;
      } else if (startDate) {
        return formattedStr >= startDate;
      } else if (endDate) {
        return formattedStr <= endDate;
      }
      return true;
    }

    // 3. Compare with nowObj for today and this_month
    if (parsedYear && !isNaN(parsedYear) && !isNaN(parsedMonth) && !isNaN(parsedDate)) {
      if (filterMode === 'today') {
        return (
          parsedYear === nowObj.getFullYear() &&
          parsedMonth === nowObj.getMonth() &&
          parsedDate === nowObj.getDate()
        );
      } else if (filterMode === 'this_month') {
        return (
          parsedYear === nowObj.getFullYear() &&
          parsedMonth === nowObj.getMonth()
        );
      }
    }

    // Fallback string matching
    if (filterMode === 'today') {
      const dd = String(nowObj.getDate()).padStart(2, '0');
      const mm = String(nowObj.getMonth() + 1).padStart(2, '0');
      const yyyy = nowObj.getFullYear();
      const rawD = nowObj.getDate();
      const rawM = nowObj.getMonth() + 1;
      return (
        str.includes(todayStr) ||
        str.includes(`${dd}/${mm}/${yyyy}`) ||
        str.includes(`${rawD}/${rawM}/${yyyy}`) ||
        str.includes(`${yyyy}-${mm}-${dd}`)
      );
    } else if (filterMode === 'this_month') {
      const mm = String(nowObj.getMonth() + 1).padStart(2, '0');
      const yyyy = nowObj.getFullYear();
      const rawM = nowObj.getMonth() + 1;
      return (
        str.includes(thisMonthStr) ||
        str.includes(`/${mm}/${yyyy}`) ||
        str.includes(`/${rawM}/${yyyy}`) ||
        str.includes(`${yyyy}-${mm}`)
      );
    }

    return true;
  };

  const filteredOrders = orders.filter(o => {
    const matchDate = isDateMatch(o.created_at, dateFilterMode);
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      (o.invoice_number && o.invoice_number.toLowerCase().includes(query)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.customer_phone && o.customer_phone.includes(query));

    return matchDate && matchQuery;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchDate = isDateMatch(e.date || e.created_at, dateFilterMode);
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      (e.title && e.title.toLowerCase().includes(query)) ||
      (e.category && e.category.toLowerCase().includes(query)) ||
      (e.notes && e.notes.toLowerCase().includes(query));

    return matchDate && matchQuery;
  });

  // Robust Payment Status Helpers (Supports 'paid', 'lunas', 'sudah bayar', etc.)
  const isPaidStatus = (status) => {
    if (!status) return false;
    const s = String(status).toLowerCase().trim();
    return s === 'paid' || s === 'lunas' || s === 'sudah bayar' || s === 'sudah_bayar';
  };

  const isUnpaidStatus = (status) => {
    if (!status) return true;
    const s = String(status).toLowerCase().trim();
    return s === 'unpaid' || s === 'belum_lunas' || s === 'belum lunas' || s === 'hutang';
  };

  // Safe numerical calculations
  const paidOrders = filteredOrders.filter(o => isPaidStatus(o.payment_status));
  const unpaidOrders = filteredOrders.filter(o => isUnpaidStatus(o.payment_status));

  const totalOmset = filteredOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOmsetLunas = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalPaidRevenue = totalOmsetLunas;
  const totalPiutang = unpaidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalUnpaidPiutang = totalPiutang;
  const totalOmsetKotor = totalOmsetLunas + totalPiutang;
  const totalPengeluaran = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = totalPengeluaran;
  const labaBersih = totalOmsetLunas - totalPengeluaran;
  const netProfit = labaBersih;

  // Breakdown Today Metrics (Hari Ini)
  const todayOrders = orders.filter(o => isDateMatch(o.created_at, 'today'));
  const todayPaidOrders = todayOrders.filter(o => isPaidStatus(o.payment_status));
  const todayKasRevenue = todayPaidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const todayOrderCount = todayOrders.length;
  const todayLaundryWeightKg = todayOrders.reduce((sum, o) => {
    if (Array.isArray(o.items)) {
      return sum + o.items.reduce((iSum, item) => iSum + (Number(item.qty) || 0), 0);
    }
    return sum;
  }, 0);

  // Breakdown Buku Kas (Saldo Tunai Laci Kasir)
  const todayExpenses = expenses.filter(e => isDateMatch(e.date || e.created_at, 'today'));
  const todayTotalExpenses = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const todayCashBalance = todayKasRevenue - todayTotalExpenses;

  // Helper for specific YYYY-MM-DD match in 7-day trend chart
  const isSameDay = (dateVal, targetIso) => {
    if (!dateVal) return false;
    const str = String(dateVal).trim();
    if (str.includes(targetIso)) return true;

    let parsedStr = '';
    if (str.includes('/')) {
      const parts = str.split(',')[0].split(' ')[0].trim().split('/');
      if (parts.length === 3) {
        parsedStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } else {
      const dObj = new Date(str);
      if (dObj && !isNaN(dObj.getTime())) {
        parsedStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
      }
    }
    return parsedStr === targetIso;
  };

  // Generate Daily Trend Data for Last 7 Days (Mingguan)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const targetIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayLabel = dayNames[d.getDay()];
    const dateDisplay = `${d.getDate()} ${monthNames[d.getMonth()]}`;

    const dayOrders = orders.filter(o => isSameDay(o.created_at, targetIso));
    const orderCount = dayOrders.length;
    const revenue = dayOrders
      .filter(o => isPaidStatus(o.payment_status))
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const weight = dayOrders.reduce((sum, o) => {
      if (Array.isArray(o.items)) {
        return sum + o.items.reduce((iSum, item) => iSum + (Number(item.qty) || 0), 0);
      }
      return sum;
    }, 0);

    return {
      dateIso: targetIso,
      dayLabel,
      dateDisplay,
      orderCount,
      revenue,
      weight
    };
  });

  const maxOrderInWeek = Math.max(...last7DaysData.map(d => d.orderCount), 1);
  const totalWeekOrders = last7DaysData.reduce((sum, d) => sum + d.orderCount, 0);
  const totalWeekRevenue = last7DaysData.reduce((sum, d) => sum + d.revenue, 0);



  const handleMarkAsPaid = (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId || o.invoice_number === orderId);
    const targetAmount = targetOrder ? targetOrder.total_amount : 0;

    if (typeof setOrders === 'function') {
      setOrders(orders.map(o => (o.id === orderId || o.invoice_number === orderId) ? { ...o, payment_status: 'paid', paid_amount: targetAmount } : o));
    }

    fetch(`${API_BASE}/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid', paid_amount: targetAmount })
    }).catch(err => console.log('DB error:', err));

    showAlertSuccess('Pelunasan Berhasil', 'Status pembayaran pesanan diperbarui menjadi LUNAS!');
  };

  return (
    <div className="space-y-5 font-sans pb-8">
      
      {/* 1. MASTER LANDING MENU FOR LAPORAN (JIKA TAMPILAN UTAMA) */}
      {(!reportTab || reportTab === 'main') && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-teal-700/50 space-y-2 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs px-3 py-1 rounded-full font-bold">
              <PieChart className="w-4 h-4 text-amber-400" /> Pusat Laporan & Analisis Keuangan
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight">Laporan Keuangan, Omset & Laba Rugi</h2>
            <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Pantau rekapitulasi laba rugi, total pendapatan omset transaksi kasir, tagihan piutang pelanggan, dan rincian pengeluaran operasional.
            </p>
          </div>

          {/* Pusat Filter Periode & Rentang Tanggal (Date Range Filter Bar) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>Filter Periode Laporan:</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border text-xs font-bold w-full sm:w-auto justify-between sm:justify-start">
                <button 
                  onClick={() => setDateFilterMode('today')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${dateFilterMode === 'today' ? 'bg-teal-700 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Hari Ini
                </button>
                <button 
                  onClick={() => setDateFilterMode('this_month')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${dateFilterMode === 'this_month' ? 'bg-teal-700 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Bulan Ini
                </button>
                <button 
                  onClick={() => setDateFilterMode('custom')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${dateFilterMode === 'custom' ? 'bg-teal-700 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Rentang Tanggal
                </button>
                <button 
                  onClick={() => setDateFilterMode('all')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${dateFilterMode === 'all' ? 'bg-teal-700 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Custom Date Range Pickers (1 Kalender / Date Range Input) */}
            {dateFilterMode === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs animate-fadeIn">
                <span className="text-slate-500 font-bold text-[11px]">Dari:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                />
                <span className="text-slate-500 font-bold text-[11px]">Sampai:</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                />
                <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
                  Filter Aktif: {startDate} s/d {endDate}
                </span>
              </div>
            )}
          </div>

          {/* Master Overview Ringkasan Widget (1 Baris Presisi di HP) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            
            {/* Card 1: Kas Lunas */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-900 text-white p-2.5 sm:p-4 rounded-2xl shadow-md border border-teal-700/50 space-y-0.5 sm:space-y-1 overflow-hidden">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-tight text-teal-200 block truncate">
                💰 Kas Lunas
              </span>
              <p className="text-xs sm:text-xl font-black tracking-tight text-amber-300 truncate">
                Rp {totalOmsetLunas.toLocaleString('id-ID')}
              </p>
              <p className="text-[8px] sm:text-[10px] text-teal-200 font-medium truncate">
                {paidOrders.length} Transaksi Lunas
              </p>
            </div>

            {/* Card 2: Order Masuk */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-2.5 sm:p-4 rounded-2xl shadow-md border border-slate-700/50 space-y-0.5 sm:space-y-1 overflow-hidden">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-tight text-slate-300 block truncate">
                🧾 Order Masuk
              </span>
              <p className="text-xs sm:text-xl font-black tracking-tight text-teal-300 truncate">
                {filteredOrders.length} <span className="text-[9px] sm:text-xs font-bold">Invoice</span>
              </p>
              <p className="text-[8px] sm:text-[10px] text-slate-300 font-medium truncate">
                Total Transaksi
              </p>
            </div>

            {/* Card 3: Cucian Masuk */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-2.5 sm:p-4 rounded-2xl shadow-md border border-amber-500/50 space-y-0.5 sm:space-y-1 overflow-hidden">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-tight text-amber-200 block truncate">
                🧺 Cucian (Kg)
              </span>
              <p className="text-xs sm:text-xl font-black tracking-tight text-white truncate">
                {filteredOrders.reduce((sum, o) => {
                  if (Array.isArray(o.items)) {
                    return sum + o.items.reduce((iSum, item) => iSum + (Number(item.qty) || 0), 0);
                  }
                  return sum;
                }, 0).toFixed(1)} <span className="text-[9px] sm:text-xs font-bold">Kg/Qty</span>
              </p>
              <p className="text-[8px] sm:text-[10px] text-amber-100 font-medium truncate">
                Total Pakaian
              </p>
            </div>

          </div>

          {/* Grafik Perkembangan Orderan Per Hari (Tampilan Per Minggu) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-amber-400" /> Grafik Perkembangan Orderan Per Hari (Mingguan)
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">Tren Transaksi 7 Hari Terakhir</h3>
              </div>
              <div className="flex items-center gap-2.5 text-xs bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 font-bold self-start sm:self-auto shadow-inner">
                <span className="text-teal-300">Total 7 Hari: <b className="text-white">{totalWeekOrders} Order</b></span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-300">Rp {totalWeekRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Chart Graphic Bar Area */}
            <div className="pt-2">
              <div className="h-44 sm:h-52 flex items-end justify-between gap-1.5 sm:gap-3 px-1 border-b border-slate-700/80 pb-2 relative">
                {last7DaysData.map((item, idx) => {
                  const heightPct = Math.max((item.orderCount / maxOrderInWeek) * 100, 12);
                  const isToday = item.dateIso === todayStr;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer">
                      
                      {/* Tooltip Hover Overlay */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded-xl border border-teal-500/50 shadow-2xl z-30 pointer-events-none whitespace-nowrap font-bold text-center">
                        <p className="text-teal-300 font-extrabold">{item.dayLabel}, {item.dateDisplay}</p>
                        <p className="text-white font-black">{item.orderCount} Order ({item.weight.toFixed(1)} Kg)</p>
                        <p className="text-amber-300 font-bold">Rp {item.revenue.toLocaleString('id-ID')}</p>
                      </div>

                      {/* Top Value Tag */}
                      <span className={`text-[10px] sm:text-xs font-black ${isToday ? 'text-amber-300 scale-110' : 'text-slate-300'} group-hover:text-teal-300 transition`}>
                        {item.orderCount}
                      </span>

                      {/* Vertical Bar */}
                      <div className="w-full max-w-[40px] bg-slate-800/80 rounded-t-xl overflow-hidden flex items-end p-0.5 shadow-inner">
                        <div 
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 ${
                            isToday 
                              ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-lg shadow-amber-500/40' 
                              : 'bg-gradient-to-t from-teal-700 via-teal-500 to-cyan-400 shadow-lg shadow-teal-500/20'
                          }`}
                        />
                      </div>

                      {/* X-Axis Day Label */}
                      <div className="text-center pt-1">
                        <span className={`block text-[10px] sm:text-xs font-black uppercase ${isToday ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                          {item.dayLabel}
                        </span>
                        <span className="block text-[8px] sm:text-[10px] text-slate-400 font-mono">
                          {item.dateDisplay.split(' ')[0]}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Legend & Footnote */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 gap-2 text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm" /> Riwayat Harian
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" /> Hari Ini
                  </span>
                </div>
                <span className="text-slate-400 italic">
                  * Hover/Sentuh batang grafik untuk melihat detail omset & kg harian
                </span>
              </div>
            </div>
          </div>

          {/* Grid Menu Cards (Samakan Konsep Pengaturan Toko) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Laba Rugi */}
            <div 
              onClick={() => setReportTab('summary')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📈
                </div>
                <div className="space-y-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Laba Bersih
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-teal-700 transition">Ringkasan Laba / Rugi</h3>
                  <p className="text-xs text-slate-500">Rekap omset pendapatan, diskon, & estimasi laba bersih toko.</p>
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
                <span className="text-xs font-black text-teal-700">Rp {netProfit.toLocaleString('id-ID')}</span>
                <span className="text-slate-400 group-hover:text-teal-700 font-extrabold">&rarr;</span>
              </div>
            </div>

            {/* Card 2: Piutang */}
            <div 
              onClick={() => setReportTab('unpaid')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ⏳
                </div>
                <div className="space-y-1">
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unpaidOrders.length} Pesanan Belum Lunas
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-700 transition">Tagihan Piutang</h3>
                  <p className="text-xs text-slate-500">Daftar transaksi cucian yang belum dilunasi oleh pelanggan.</p>
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
                <span className="text-xs font-black text-amber-700">Rp {totalUnpaidPiutang.toLocaleString('id-ID')}</span>
                <span className="text-slate-400 group-hover:text-amber-700 font-extrabold">&rarr;</span>
              </div>
            </div>

            {/* Card 3: Pengeluaran */}
            <div 
              onClick={() => setReportTab('expenses')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  💸
                </div>
                <div className="space-y-1">
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {expenses.length} Catatan
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-rose-700 transition">Pengeluaran Operasional</h3>
                  <p className="text-xs text-slate-500">Pencatatan biaya sabun, listrik, parfum, & operasional.</p>
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
                <span className="text-xs font-black text-rose-700">Rp {totalExpenses.toLocaleString('id-ID')}</span>
                <span className="text-slate-400 group-hover:text-rose-700 font-extrabold">&rarr;</span>
              </div>
            </div>

            {/* Card 4: Buku Kas & Arus Kas */}
            <div 
              onClick={() => setReportTab('cashbook')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📖
                </div>
                <div className="space-y-1">
                  <span className="bg-indigo-100 text-indigo-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Arus Kas Realtime
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-700 transition">Laporan Buku Kas</h3>
                  <p className="text-xs text-slate-500">Mutasi fisik laci kasir (uang masuk lunas dikurangi pengeluaran).</p>
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4">
                <span className="text-xs font-black text-indigo-800">Rp {todayCashBalance.toLocaleString('id-ID')}</span>
                <span className="text-slate-400 group-hover:text-indigo-700 font-extrabold">&rarr;</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. SUB-VIEW DETAILS (JIKA MEMILIH SUB-MENU LAPORAN) */}
      {reportTab && reportTab !== 'main' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Top Navigation Header with Kembali Button */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setReportTab('main')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-200"
              >
                &larr; Kembali ke Menu Laporan
              </button>
              <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                {reportTab === 'summary' && <span>📈 Ringkasan Laba / Rugi</span>}
                {reportTab === 'unpaid' && <span>⏳ Laporan Tagihan Piutang ({unpaidOrders.length})</span>}
                {reportTab === 'expenses' && <span>💸 Laporan Pengeluaran Operasional</span>}
              </h2>
            </div>

            {/* Filter Periode & Subtab Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border text-xs font-bold">
                <button 
                  onClick={() => setDateFilterMode('today')}
                  className={`px-2.5 py-1 rounded-lg transition ${dateFilterMode === 'today' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-600'}`}
                >
                  Hari Ini
                </button>
                <button 
                  onClick={() => setDateFilterMode('this_month')}
                  className={`px-2.5 py-1 rounded-lg transition ${dateFilterMode === 'this_month' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-600'}`}
                >
                  Bulan Ini
                </button>
                <button 
                  onClick={() => setDateFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${dateFilterMode === 'all' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-600'}`}
                >
                  Semua
                </button>
              </div>
            </div>
          </div>

          {/* Global Filter Bar for Laporan Sub-View */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <input 
                type="text" 
                placeholder="Cari dalam laporan (nota, pelanggan, judul)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs p-2 pl-8 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <span className="text-xs font-bold text-slate-500">
              Periode Filter: <b className="text-teal-800 uppercase">{dateFilterMode === 'today' ? 'Hari Ini' : dateFilterMode === 'this_month' ? 'Bulan Ini' : 'Semua'}</b>
            </span>
          </div>

      {/* 1. RINGKASAN LABA RUGI & OMSET */}
      {reportTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Omset Pendapatan Lunas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-emerald-600">
                <span className="text-xs font-extrabold uppercase text-slate-500">Pendapatan Omset (Lunas)</span>
                <ArrowUpRight className="w-5 h-5 bg-emerald-50 p-1 rounded-full text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">Rp {totalOmsetLunas.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">{paidOrders.length} Transaksi Lunas Tercatat</p>
            </div>

            {/* Card 2: Pengeluaran Operasional */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-red-500">
                <span className="text-xs font-extrabold uppercase text-slate-500">Total Pengeluaran</span>
                <ArrowDownRight className="w-5 h-5 bg-red-50 p-1 rounded-full text-red-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-red-500 font-semibold">{filteredExpenses.length} Biaya Operasional</p>
            </div>

            {/* Card 3: Laba Bersih */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
              labaBersih >= 0 ? 'bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white' : 'bg-red-900 text-white'
            }`}>
              <div className="flex justify-between items-center text-amber-400">
                <span className="text-xs font-black uppercase text-teal-200">Laba Bersih Realtime</span>
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-amber-300">Rp {labaBersih.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-teal-100">Formula: Omset Lunas - Total Pengeluaran</p>
            </div>

            {/* Card 4: Tagihan Piutang Belum Bayar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-amber-600">
                <span className="text-xs font-extrabold uppercase text-slate-500">Tagihan Piutang (Belum Bayar)</span>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600">Rp {totalPiutang.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-amber-700 font-semibold">{unpaidOrders.length} Tagihan Pelanggan Belum Lunas</p>
            </div>

          </div>

          {/* Additional Summary Stats */}
          <div className="bg-slate-50 p-4 rounded-2xl border flex flex-wrap justify-between items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Total Transaksi Masuk:</span>
              <span className="font-black text-slate-800 ml-1">{filteredOrders.length} Invoice</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Estimasi Total Omset Kotor (Lunas + Piutang):</span>
              <span className="font-black text-teal-800 ml-1">Rp {totalOmsetKotor.toLocaleString('id-ID')}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Periode Terpilih:</span>
              <span className="font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded ml-1 uppercase">
                {dateFilterMode === 'today' ? `Hari Ini (${todayStr})` : (dateFilterMode === 'this_month' ? `Bulan Ini (${thisMonthStr})` : 'Semua Waktu')}
              </span>
            </div>
          </div>

          {/* Metode Pembayaran Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base border-b pb-2 flex items-center justify-between">
              <span>Rincian Penerimaan Berdasarkan Metode Pembayaran</span>
              <span className="text-xs font-bold text-slate-400">Total: Rp {totalOmsetLunas.toLocaleString('id-ID')}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border text-center">
                <p className="text-xs font-bold text-slate-500">Tunai / Cash</p>
                <p className="text-lg font-black text-slate-800 mt-1">Rp {cashOmset.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border text-center">
                <p className="text-xs font-bold text-slate-500">QRIS</p>
                <p className="text-lg font-black text-teal-700 mt-1">Rp {qrisOmset.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border text-center">
                <p className="text-xs font-bold text-slate-500">Transfer Bank</p>
                <p className="text-lg font-black text-indigo-700 mt-1">Rp {transferOmset.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border text-center">
                <p className="text-xs font-bold text-slate-500">Saldo Deposit Member</p>
                <p className="text-lg font-black text-emerald-700 mt-1">Rp {depositOmset.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LAPORAN TAGIHAN KONSUMEN (PIUTANG) WITH ROW NUMBERING (# NO) */}
      {reportTab === 'unpaid' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Laporan Tagihan Piutang Konsumen</h3>
              <p className="text-xs text-slate-500">Jumlah Piutang: <b className="text-amber-600">{unpaidOrders.length} Baris Data</b></p>
            </div>
            <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-full">
              Total Piutang: Rp {totalPiutang.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-3">
            {unpaidOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                🎉 Tidak ada tagihan piutang konsumen yang tertunggak pada periode ini.
              </div>
            ) : (
              unpaidOrders.map((order, idx) => (
                <div key={order.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {/* ROW NUMBER BADGE (# BARIS) */}
                      <span className="bg-slate-800 text-amber-300 text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-teal-800 text-sm">{order.invoice_number}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-black px-2 py-0.5 rounded">
                        BELUM BAYAR
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-xs mt-1">{order.customer_name} ({order.customer_phone})</p>
                    <p className="text-xs text-slate-500 mt-0.5">Status Pengerjaan: <b className="text-teal-700 uppercase">{order.work_status}</b> | Rak: {order.rack_location}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Tagihan:</p>
                      <p className="text-lg font-black text-amber-600">Rp {(Number(order.total_amount) || 0).toLocaleString('id-ID')}</p>
                    </div>
                    {setActiveReceipt && (
                      <button 
                        onClick={() => setActiveReceipt(order)}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak Struk
                      </button>
                    )}
                    <button 
                      onClick={() => handleMarkAsPaid(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Tandai Lunas
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. LAPORAN PENGELUARAN OPERASIONAL WITH ROW NUMBERING (# NO) */}
      {reportTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Pencatatan Pengeluaran Operasional</h3>
              <p className="text-xs text-slate-500">Total Pengeluaran: <b className="text-red-600">{filteredExpenses.length} Baris Data</b> (Rp {totalPengeluaran.toLocaleString('id-ID')})</p>
            </div>
            <button 
              onClick={() => setShowAddExpense(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-4 h-4" /> Catat Pengeluaran
            </button>
          </div>

          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                Belum ada catatan pengeluaran operasional pada periode ini.
              </div>
            ) : (
              filteredExpenses.map((exp, idx) => (
                <div key={exp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      {/* ROW NUMBER BADGE (# BARIS) */}
                      <span className="bg-slate-800 text-amber-300 text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{exp.title}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{exp.date} | Catatan: {exp.notes}</p>
                  </div>
                  <span className="text-base font-black text-red-600">
                    - Rp {(Number(exp.amount) || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. RIWAYAT TRANSAKSI DENGAN REPRINT */}
      {reportTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Riwayat Semua Transaksi</h3>
              <p className="text-xs text-slate-500">Jumlah: <b className="text-teal-700">{filteredOrders.length} Transaksi</b></p>
            </div>
            <span className="bg-teal-100 text-teal-900 font-extrabold text-xs px-3 py-1 rounded-full">
              Total: Rp {totalOmsetKotor.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs border">
                Belum ada transaksi pada periode ini.
              </div>
            ) : (
              filteredOrders.map((order, idx) => (
                <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-800 text-amber-300 text-xs font-black px-2 py-0.5 rounded-lg">#{idx + 1}</span>
                        <span className="font-extrabold text-teal-800 text-sm">{order.invoice_number}</span>
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                          order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-xs mt-1">{order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ''}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.created_at} | Bayar: <b className="uppercase">{order.payment_type}</b>
                        {order.rack_location ? ` | Rak: ${order.rack_location}` : ''}
                      </p>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          {order.items.map((it, i) => (
                            <span key={i}>{i > 0 ? ', ' : ''}{it.service_name} ({it.qty} {it.unit || 'kg'})</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Total:</p>
                        <p className={`text-lg font-black ${order.payment_status === 'paid' ? 'text-teal-700' : 'text-amber-600'}`}>
                          Rp {(Number(order.total_amount) || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                      {setActiveReceipt && (
                        <button 
                          onClick={() => setActiveReceipt(order)}
                          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" /> Cetak Ulang
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. LAPORAN BUKU KAS & ARUS KAS (CASH LEDGER) */}
      {reportTab === 'cashbook' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-indigo-700/50 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-400/30">
                  📖 Buku Kas & Mutasi Laci Kasir
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1 text-white">Laporan Buku Kas Riil</h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Menampilkan saldo fisik laci kasir (Uang Masuk Tunai Lunas dikurangi Pengeluaran Operasional).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-indigo-800/80">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-emerald-300 uppercase">📥 Uang Masuk (Lunas)</span>
                <p className="text-lg font-black text-emerald-400">Rp {totalOmsetLunas.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-slate-300">{paidOrders.length} Pembayaran Sukses</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-rose-300 uppercase">📤 Uang Keluar (Operasional)</span>
                <p className="text-lg font-black text-rose-400">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-slate-300">{filteredExpenses.length} Pengeluaran Operasional</p>
              </div>
              <div className="bg-amber-400/20 backdrop-blur-md p-3.5 rounded-2xl border border-amber-400/40 space-y-1">
                <span className="text-[10px] font-bold text-amber-300 uppercase">💰 Saldo Kasir Saat Ini</span>
                <p className="text-xl font-black text-amber-300">Rp {labaBersih.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-amber-200 font-medium">Laci Kasir Ready</p>
              </div>
            </div>
          </div>

          {/* Mutasi Transaksi Kas Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
              <Layers className="w-4 h-4 text-indigo-600" /> Rincian Mutasi Arus Kas Tunai
            </h4>

            <div className="space-y-2">
              {filteredOrders.length === 0 && filteredExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada mutasi arus kas pada periode ini.</p>
              ) : (
                [
                  ...paidOrders.map(o => ({
                    type: 'in',
                    date: o.created_at,
                    title: `Penerimaan Kas - Invoice #${o.invoice_number}`,
                    desc: `Pelanggan: ${o.customer_name} (${o.payment_type || 'cash'})`,
                    amount: Number(o.total_amount) || 0
                  })),
                  ...filteredExpenses.map(e => ({
                    type: 'out',
                    date: e.date || e.created_at,
                    title: `Pengeluaran - ${e.title}`,
                    desc: `Kategori: ${e.category || 'Operasional'} | Note: ${e.notes || '-'}`,
                    amount: Number(e.amount) || 0
                  }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).map((mut, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${mut.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {mut.type === 'in' ? '↙' : '↗'}
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-800">{mut.title}</p>
                        <p className="text-[11px] text-slate-500">{mut.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{mut.date}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm ${mut.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {mut.type === 'in' ? '+' : '-'} Rp {mut.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      )}

      {/* MODAL TAMBAH PENGELUARAN */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-800 border-b pb-2">Catat Pengeluaran Operasional</h3>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Judul Pengeluaran *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Misal: Beli Parfum 5 Liter"
                  value={newExpense.title} 
                  onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Kategori</label>
                  <select 
                    value={newExpense.category} 
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full p-2.5 border rounded-xl bg-white font-semibold"
                  >
                    <option value="Operasional">Operasional (Bahan)</option>
                    <option value="Utilitas">Utilitas (Listrik/Air/Wifi)</option>
                    <option value="Gaji Pegawai">Gaji Pegawai</option>
                    <option value="Sewa Tempat">Sewa Tempat</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Jumlah Biaya (Rp) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="50000"
                    value={newExpense.amount} 
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full p-2.5 border rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Catatan Tambahan</label>
                <input 
                  type="text" 
                  placeholder="Keterangan toko / nota pengeluaran"
                  value={newExpense.notes} 
                  onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl">Simpan Pengeluaran</button>
                <button type="button" onClick={() => setShowAddExpense(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
