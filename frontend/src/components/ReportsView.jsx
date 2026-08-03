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
  Search
} from 'lucide-react';
import { showAlertSuccess, showAlertWarning } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

export default function ReportsView({ orders = [], setOrders, expenses = [], setExpenses, customers = [], services = [], storeSettings = {}, receiptFontSize = '80mm', setActiveReceipt }) {
  const [reportTab, setReportTab] = useState('summary');
  const [dateFilterMode, setDateFilterMode] = useState('today'); // 'today' | 'this_month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Expense Form Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', category: 'Operasional', amount: '', notes: '' });

  // Date Filtering Helpers
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const thisMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  const filteredOrders = orders.filter(o => {
    if (!o.created_at) return true;
    let matchDate = true;
    if (dateFilterMode === 'today') {
      matchDate = o.created_at.includes(todayStr) || o.created_at.slice(0, 10) === todayStr;
    } else if (dateFilterMode === 'this_month') {
      matchDate = o.created_at.includes(thisMonthStr) || o.created_at.slice(0, 7) === thisMonthStr;
    }

    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      (o.invoice_number && o.invoice_number.toLowerCase().includes(query)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.customer_phone && o.customer_phone.includes(query));

    return matchDate && matchQuery;
  });

  const filteredExpenses = expenses.filter(e => {
    if (!e.date) return true;
    let matchDate = true;
    if (dateFilterMode === 'today') {
      matchDate = e.date.includes(todayStr) || e.date.slice(0, 10) === todayStr;
    } else if (dateFilterMode === 'this_month') {
      matchDate = e.date.includes(thisMonthStr) || e.date.slice(0, 7) === thisMonthStr;
    }

    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      (e.title && e.title.toLowerCase().includes(query)) ||
      (e.category && e.category.toLowerCase().includes(query)) ||
      (e.notes && e.notes.toLowerCase().includes(query));

    return matchDate && matchQuery;
  });

  // Safe numerical calculations
  const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid');
  const unpaidOrders = filteredOrders.filter(o => o.payment_status === 'unpaid');

  const totalOmsetLunas = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalPiutang = unpaidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOmsetKotor = totalOmsetLunas + totalPiutang;
  const totalPengeluaran = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const labaBersih = totalOmsetLunas - totalPengeluaran;

  // Breakdown Metode Bayar
  const cashOmset = paidOrders.filter(o => o.payment_type === 'cash').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const qrisOmset = paidOrders.filter(o => o.payment_type === 'qris').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const transferOmset = paidOrders.filter(o => o.payment_type === 'transfer').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const depositOmset = paidOrders.filter(o => o.payment_type === 'deposit').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    if (!newExpense.title || !amt || amt <= 0) return showAlertWarning('Form Incomplete', 'Lengkapi judul dan jumlah pengeluaran!');

    const created = {
      id: Date.now(),
      title: newExpense.title,
      category: newExpense.category,
      amount: amt,
      notes: newExpense.notes || '-',
      date: new Date().toLocaleString('id-ID')
    };

    setExpenses([created, ...expenses]);

    // Save to MySQL API
    fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created)
    }).catch(err => console.log('DB Expense error:', err));

    setNewExpense({ title: '', category: 'Operasional', amount: '', notes: '' });
    setShowAddExpense(false);
    showAlertSuccess('Pengeluaran Dicatat', `Biaya "${newExpense.title}" sebesar Rp ${amt.toLocaleString('id-ID')} berhasil disimpan!`);
  };

  const handleMarkAsPaid = (orderId) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: 'paid', paid_amount: o.total_amount } : o));

    fetch(`${API_BASE}/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid' })
    }).catch(err => console.log('DB error:', err));

    showAlertSuccess('Pelunasan Berhasil', 'Status pembayaran pesanan diperbarui menjadi LUNAS!');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Report Tabs */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-teal-600" /> Laporan Keuangan, Omset & Laba Rugi
          </h2>
          <p className="text-xs text-slate-500">Monitor pendapatan omset, pengeluaran operasional, dan tagihan piutang</p>
        </div>

        {/* Filter Periode & Subtab Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Periode Selector */}
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

          {/* Sub Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border">
            <button 
              onClick={() => setReportTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                reportTab === 'summary' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Laba Rugi
            </button>
            <button 
              onClick={() => setReportTab('unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1 ${
                reportTab === 'unpaid' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Piutang</span>
              {unpaidOrders.length > 0 && (
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {unpaidOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setReportTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                reportTab === 'expenses' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pengeluaran
            </button>
            <button 
              onClick={() => setReportTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1 ${
                reportTab === 'history' ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Riwayat
            </button>
          </div>
        </div>
      </div>

      {/* Global Filter Bar for Laporan */}
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
          Periode: <b className="text-teal-800 uppercase">{dateFilterMode}</b>
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
