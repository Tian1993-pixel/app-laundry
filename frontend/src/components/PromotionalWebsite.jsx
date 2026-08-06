import React, { useState } from 'react';
import { 
  Sparkles, 
  Truck, 
  Clock, 
  ShieldCheck, 
  Search, 
  Calculator, 
  MessageCircle, 
  ChevronRight, 
  Check, 
  Phone, 
  MapPin, 
  Star, 
  Shirt, 
  Award,
  Zap,
  Tag,
  Gift,
  User,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  Package,
  Wallet,
  CheckCircle2,
  Home,
  Building2,
  Heart,
  Calendar,
  Layers,
  ArrowRight,
  ThumbsUp,
  Send,
  Quote,
  Image,
  Globe,
  Share2
} from 'lucide-react';
import { showAlertSuccess, showAlertWarning, showAlertError } from '../utils/swalAlert';

export default function PromotionalWebsite({ 
  storeSettings, 
  services, 
  orders,
  reviews = [],
  onAddReview,
  onTrackOrder, 
  trackResults, 
  trackKeyword, 
  setTrackKeyword,
  loggedInMember,
  onRegisterMember,
  onLoginMember,
  onLogoutMember,
  onAddPickupOrder,
  activeTab,
  setActiveTab,
  onOpenSaaSAuth
}) {
  const [calcService, setCalcService] = useState(services[0] || null);
  const [calcQty, setCalcQty] = useState(3.0);

  // Auth Form State
  const [authTab, setAuthTab] = useState('login');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // Form Pemesanan Antar Jemput WA
  const [orderForm, setOrderForm] = useState({
    name: loggedInMember ? loggedInMember.name : '',
    phone: loggedInMember ? loggedInMember.phone : '',
    address: loggedInMember ? loggedInMember.address : '',
    package: 'Paket Kiloan Reguler',
    pickupDate: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  // Form Tambah Review Pelanggan
  const [newReview, setNewReview] = useState({
    customer_name: loggedInMember ? loggedInMember.name : '',
    rating: 5,
    package_used: 'Paket Kiloan Reguler',
    comment: ''
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const whatsappNumber = (storeSettings.phone || '081234567890').replace(/[^0-9]/g, '');
  const targetWa = whatsappNumber.startsWith('0') ? '62' + whatsappNumber.slice(1) : whatsappNumber;

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authTab === 'login') {
      if (!loginPhone || !loginPassword) return showAlertWarning('Form Incomplete', 'Lengkapi No. HP dan Password!');
      onLoginMember(loginPhone, loginPassword);
    } else {
      if (!regName || !regPhone || !regPassword) return showAlertWarning('Form Incomplete', 'Lengkapi Nama, No. HP, dan Password!');
      onRegisterMember(regName, regPhone, regPassword, regAddress);
    }
  };

  const handleSendWhatsAppOrder = (e) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      showAlertWarning('Data Belum Lengkap', 'Mohon lengkapi Nama, No. WhatsApp, dan Alamat penjemputan!');
      return;
    }

    const pkgService = services.find(s => s.service_name.toLowerCase().includes(orderForm.package.toLowerCase())) || services[0];
    const estimatedTotal = pkgService ? pkgService.price * 3 : 21000;

    onAddPickupOrder({
      name: orderForm.name,
      phone: orderForm.phone,
      address: orderForm.address,
      package: orderForm.package,
      pickupDate: orderForm.pickupDate,
      notes: orderForm.notes,
      estimatedTotal
    });

    const message = 
`Halo Kak! Saya ingin pesan *Jasa Antar-Jemput Laundry* 🧺✨

📌 *Detail Pemesan:*
- *Nama:* ${orderForm.name}
- *No. HP:* ${orderForm.phone}
- *Alamat Jemput:* ${orderForm.address}
- *Pilihan Paket:* ${orderForm.package}
- *Tgl Penjemputan:* ${orderForm.pickupDate}
- *Catatan Khusus:* ${orderForm.notes || '-'}

Mohon konfirmasi penjemputan cucian saya & klaim promo member. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${targetWa}?text=${encodedMessage}`, '_blank');

    showAlertSuccess('Pesanan Dikirim!', 'Pesanan penjemputan Anda telah dikirim & otomatis masuk ke daftar pengerjaan staf kasir!');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.customer_name || !newReview.comment) {
      return showAlertWarning('Form Incomplete', 'Masukkan nama Anda dan ulasan pengalaman mencuci!');
    }

    if (onAddReview) {
      onAddReview(newReview);
    }

    setNewReview({
      customer_name: loggedInMember ? loggedInMember.name : '',
      rating: 5,
      package_used: 'Paket Kiloan Reguler',
      comment: ''
    });
    setShowReviewForm(false);
    showAlertSuccess('Ulasan Diterima', 'Terima kasih atas ulasan & masukan positif Anda!');
  };

  const calculatedTotal = calcService ? Math.round(calcService.price * calcQty) : 0;

  const handleOrderCalcViaWA = () => {
    if (!calcService) return;
    const message = `Halo Kak! Saya mau order laundry paket *${calcService.service_name}* estimasi *${calcQty} ${calcService.unit}* dengan perkiraan total *Rp ${calculatedTotal.toLocaleString('id-ID')}*. Mohon info penjemputan!`;
    window.open(`https://wa.me/${targetWa}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const firstDiscountText = (storeSettings.first_member_discount || 10000).toLocaleString('id-ID');
  const redeemDiscountText = (storeSettings.point_redeem_discount || 10000).toLocaleString('id-ID');

  const memberOrders = loggedInMember 
    ? orders.filter(o => o.customer_phone === loggedInMember.phone)
    : [];

  const getWorkStatusStep = (status) => {
    switch(status) {
      case 'butuh_penjemputan': return 1;
      case 'diterima': return 2;
      case 'dicuci': return 3;
      case 'disetrika': return 4;
      case 'selesai': return 5;
      case 'diambil': return 5;
      default: return 2;
    }
  };

  const formatRelativeImg = (url, fallback) => {
    if (!url) return fallback;
    if (url.startsWith('/images/')) return url.slice(1);
    return url;
  };

  const bannerImgSrc = formatRelativeImg(storeSettings.banner_url, 'images/laundry_hero_banner.png');
  const logoImgSrc = formatRelativeImg(storeSettings.logo_url, 'images/laundry_logo.png');

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 flex flex-col justify-between relative">
      
      <div>
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-sm flex-wrap">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span><b>PROMO MEMBER BARU:</b> Diskon Langsung Rp {firstDiscountText} Transaksi Pertama & Reward 1 Kg = 1 Poin!</span>
          {onOpenSaaSAuth && (
            <button onClick={onOpenSaaSAuth} className="bg-amber-400 text-teal-950 font-black px-3 py-1 rounded-full text-[11px] hover:bg-amber-300 transition shadow-sm ml-2 cursor-pointer">
              Coba Gratis 7 Hari Toko &rarr;
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 1. TAB BERANDA UTAMA (HOME WITH HERO BANNER IMAGE & CUSTOMER REVIEWS) */}
        {/* ========================================================================= */}
        {activeTab === 'home' && (
          <div>
            {/* HERO HEADER WITH CUSTOM BACKGROUND BANNER IMAGE */}
            <header className="relative bg-teal-950 text-white py-16 px-4 overflow-hidden border-b border-teal-800">
              
              {/* Background Image Layer with Vivid Visibility */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={bannerImgSrc} 
                  alt="Banner Laundry Hero" 
                  className="w-full h-full object-cover opacity-50 scale-105"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_hero_banner.png'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-teal-950/80 via-teal-950/70 to-teal-950"></div>
              </div>

              <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center">
                <div className="inline-flex items-center gap-2 bg-teal-900/90 border border-amber-400/60 text-amber-300 text-xs px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                  <img 
                    src={logoImgSrc} 
                    alt="Logo Toko" 
                    className="w-6 h-6 rounded-full object-cover border border-amber-400 shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
                  />
                  <span className="font-extrabold">{storeSettings.store_name} - Clean & Fresh</span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                  Pakaian Bersih, Rapi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-200 to-amber-200">Harum Premium</span>
                </h1>
                
                <p className="text-teal-100 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto drop-shadow-sm font-medium">
                  Nikmati kemudahan laundry higienis tanpa keluar rumah. Penjemputan cepat, parfum impor tahan lama, & program poin <b>1 kg = 1 Poin</b>!
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button 
                    onClick={() => setActiveTab('pickup')}
                    className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-black px-6 py-3.5 rounded-2xl shadow-xl transition flex items-center gap-2 text-xs transform hover:scale-105 cursor-pointer"
                  >
                    <Truck className="w-4.5 h-4.5" /> Pesan Antar-Jemput WA
                  </button>

                  {onOpenSaaSAuth && (
                    <button 
                      onClick={onOpenSaaSAuth}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl transition flex items-center gap-2 text-xs transform hover:scale-105 cursor-pointer"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-amber-300" /> Pemilik Toko: Coba Gratis 7 Hari
                    </button>
                  )}

                  <button 
                    onClick={() => setActiveTab('packages')}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/20 backdrop-blur-sm transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Shirt className="w-4.5 h-4.5 text-teal-300" /> Lihat Paket Laundry
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-6 border-t border-teal-700/50 max-w-md mx-auto text-center">
                  <div>
                    <p className="text-amber-300 font-black text-lg">Rp {firstDiscountText}</p>
                    <p className="text-[10px] text-teal-200">Diskon Member Baru</p>
                  </div>
                  <div>
                    <p className="text-amber-300 font-black text-lg">1 kg = 1 Poin</p>
                    <p className="text-[10px] text-teal-200">Reward Poin</p>
                  </div>
                  <div>
                    <p className="text-amber-300 font-black text-lg">10 Poin</p>
                    <p className="text-[10px] text-teal-200">Gratis Rp {redeemDiscountText}</p>
                  </div>
                </div>
              </div>
            </header>

            {/* DEDICATED PROMINENT HERO BANNER SHOWCASE CARD */}
            <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
              <div className="bg-white p-2 md:p-3 rounded-3xl border-2 border-amber-400 shadow-2xl overflow-hidden">
                <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden group">
                  <img 
                    src={bannerImgSrc} 
                    alt="Spanduk Banner Depan Website" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_hero_banner.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-4 md:p-6 flex flex-col justify-end text-white">
                    <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-3 py-1 rounded-full uppercase w-max mb-1">
                      ⭐ Spanduk Resmi {storeSettings.store_name}
                    </span>
                    <h3 className="font-black text-lg md:text-2xl text-white">Layanan Laundry Standar Hotel & Higienis 100%</h3>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK FEATURES */}
            <section className="py-10 px-4 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Antar Jemput WA Gratis</h3>
                    <p className="text-xs text-slate-500 mt-1">Layanan kurir cepat langsung ke lokasi rumah atau apartemen Anda.</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Parfum Premium 4 Varian</h3>
                    <p className="text-xs text-slate-500 mt-1">Parfum grade A tahan lama, pakaian harum dan anti bau apek.</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">1 Mesin 1 Pelanggan</h3>
                    <p className="text-xs text-slate-500 mt-1">Pakaian tidak dicampur dengan pelanggan lain, higienis & suci.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SAAS PLATFORM BENEFIT SHOWCASE FOR LAUNDRY OWNERS */}
            {onOpenSaaSAuth && (
              <section className="py-12 px-4 max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl my-8 border border-amber-400/40 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="text-center space-y-3 relative z-10">
                  <span className="bg-amber-400 text-teal-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Khusus Pemilik Usaha Laundry
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white">
                    Miliki Aplikasi Kasir POS & Website Promosi Toko Sendiri!
                  </h2>
                  <p className="text-teal-200 text-xs sm:text-sm max-w-2xl mx-auto">
                    Dapatkan sistem digital lengkap 1 paket siap pakai untuk meningkatkan omset & mengelola cabang laundry Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                      1
                    </div>
                    <h3 className="font-extrabold text-base text-white">🌐 Website Promosi Toko (Subdomain/Custom)</h3>
                    <p className="text-xs text-slate-300">
                      Toko Anda memiliki landing page promosi sendiri. Pelanggan bisa order antar-jemput WA & cek history poin secara online.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center font-black">
                      2
                    </div>
                    <h3 className="font-extrabold text-base text-white">📱 Aplikasi POS Kasir Web & Android APK</h3>
                    <p className="text-xs text-slate-300">
                      Sistem kasir cepat, cetak nota thermal Bluetooth, hitung sisa rak/lemari, & kelola shift kasir tanpa ribet.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-black">
                      3
                    </div>
                    <h3 className="font-extrabold text-base text-white">💬 Nota Digital WhatsApp Auto-Send</h3>
                    <p className="text-xs text-slate-300">
                      Kirim rincian nota & status cucian siap ambil secara otomatis ke WhatsApp pelanggan dengan 1 kali klik.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-400/20 text-indigo-300 flex items-center justify-center font-black">
                      4
                    </div>
                    <h3 className="font-extrabold text-base text-white">📊 Laporan Keuangan & Laba/Rugi</h3>
                    <p className="text-xs text-slate-300">
                      Rekap omset harian, pengeluaran operasional, metode pembayaran (Cash/QRIS), dan analisis cabang otomatis.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-400/20 text-rose-300 flex items-center justify-center font-black">
                      5
                    </div>
                    <h3 className="font-extrabold text-base text-white">🎁 Program Poin & Diskon Member</h3>
                    <p className="text-xs text-slate-300">
                      Ikat loyalitas pelanggan dengan reward 1 Kg = 1 Poin, voucher diskon transaksi pertama, & klaim deposit.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                      6
                    </div>
                    <h3 className="font-extrabold text-base text-white">🔒 Isolasi Data 100% Aman & Terpisah</h3>
                    <p className="text-xs text-slate-300">
                      Data toko, transaksi, & pelanggan tersimpan aman khusus untuk akun Anda. Tidak bisa diakses oleh owner lain.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-4 relative z-10">
                  <button 
                    onClick={onOpenSaaSAuth}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm shadow-xl transition transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" /> Mulai Coba Gratis 7 Hari Sekarang &rarr;
                  </button>
                </div>
              </section>
            )}

            {/* QUICK FEATURES NAVIGATORS */}
            <section className="py-10 px-4 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setActiveTab('packages')}
                  className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    🧺
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Paket Kiloan & Satuan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Mulai Rp 7.000/kg cuci komplit bersih rapi.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('calculator')}
                  className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    🧮
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Kalkulator Biaya</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Simulasi total harga cucian sebelum order.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('member')}
                  className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    ⭐
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Member & Poin Reward</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tukar 10 poin dengan diskon Rp {redeemDiscountText}.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CUSTOMER REVIEWS & TESTIMONIALS SECTION */}
            <section className="py-12 px-4 max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full uppercase flex items-center justify-center gap-1 w-max mx-auto">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Ulasan Kepuasan Pelanggan
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">Apa Kata Pelanggan Kami?</h2>
                <p className="text-xs text-slate-500">Pengalaman nyata ribuan pelanggan yang mempercayakan cucian pakaian & bedcover mereka kepada kami.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition relative">
                    <Quote className="w-8 h-8 text-teal-100 absolute top-4 right-4" />
                    
                    <div className="space-y-3 relative z-10">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-extrabold text-slate-900">{rev.customer_name}</p>
                        <p className="text-[10px] text-teal-700 font-semibold">{rev.package_used}</p>
                      </div>
                      <span className="bg-teal-50 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded">Terverifikasi</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* FORM TAMBAH ULASAN */}
              <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-4 max-w-2xl mx-auto">
                <h3 className="font-black text-xl">Sudah Pernah Cuci Di Tempat Kami?</h3>
                <p className="text-xs text-teal-100">Bagikan pengalaman Anda dan dapatkan poin bonus kejutan!</p>
                
                {!showReviewForm ? (
                  <button 
                    onClick={() => setShowReviewForm(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-black px-6 py-3 rounded-xl text-xs transition shadow"
                  >
                    + Tulis Ulasan / Review Anda
                  </button>
                ) : (
                  <form onSubmit={handleSubmitReview} className="bg-white text-slate-800 p-6 rounded-2xl text-left space-y-3 text-xs shadow-lg">
                    <h4 className="font-black text-sm border-b pb-2 text-slate-900">Form Ulasan Pelanggan</h4>
                    
                    <div>
                      <label className="font-bold block mb-1">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Nama Anda"
                        value={newReview.customer_name}
                        onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold block mb-1">Rating Bintang</label>
                        <select 
                          value={newReview.rating}
                          onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                          className="w-full p-2.5 border rounded-xl bg-white font-bold text-amber-600"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ 5 Bintang (Sangat Puas)</option>
                          <option value="4">⭐⭐⭐⭐ 4 Bintang (Puas)</option>
                          <option value="3">⭐⭐⭐ 3 Bintang (Cukup)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold block mb-1">Paket Yang Digunakan</label>
                        <select 
                          value={newReview.package_used}
                          onChange={(e) => setNewReview({ ...newReview, package_used: e.target.value })}
                          className="w-full p-2.5 border rounded-xl bg-white font-semibold"
                        >
                          <option value="Paket Kiloan Reguler">Paket Kiloan Reguler</option>
                          <option value="Paket Express Kilat">Paket Express Kilat</option>
                          <option value="Paket Satuan Bed Cover">Paket Satuan Bed Cover</option>
                          <option value="Cuci Sepatu Sneaker">Cuci Sepatu Sneaker</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Komentar / Pengalaman Cuci *</label>
                      <textarea 
                        required 
                        rows="3" 
                        placeholder="Tulis ulasan jujur Anda tentang kebersihan, keharuman parfum, atau layanan..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        className="w-full p-2.5 border rounded-xl text-xs"
                      ></textarea>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 bg-teal-700 text-white font-bold py-2.5 rounded-xl">Kirim Ulasan</button>
                      <button type="button" onClick={() => setShowReviewForm(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl">Batal</button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAB PAKET LAUNDRY */}
        {/* ========================================================================= */}
        {activeTab === 'packages' && (
          <section className="py-10 px-4 max-w-6xl mx-auto space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-xs font-black text-teal-700 uppercase bg-teal-100 px-3 py-1 rounded-full">Katalog Lengkap</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Pilihan Paket Laundry Terbaik</h2>
              <p className="text-xs text-slate-600">Disesuaikan dengan kebutuhan harian, pakaian kerja, hingga perawatan bedcover & sepatu.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm space-y-4">
                <div>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Paling Laris</span>
                  <h3 className="font-extrabold text-base text-slate-800 mt-2">Paket Kiloan Reguler</h3>
                  <p className="text-xs text-slate-500 mt-1">Cuci bersih, kering 100%, setrika rapi & parfum pilihan.</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600 border-t pt-2">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Selesai 2 Hari (48 Jam)</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Pilihan 4 Aroma Parfum</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Packing Plastik Rapi</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xl font-black text-teal-700">Rp 7.000 <span className="text-xs font-normal text-slate-400">/ kg</span></p>
                  <button 
                    onClick={() => {
                      setOrderForm({ ...orderForm, package: 'Paket Kiloan Reguler' });
                      setActiveTab('pickup');
                    }}
                    className="mt-2 w-full bg-teal-700 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Pesan Paket Ini
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-amber-400 p-5 flex flex-col justify-between shadow-md space-y-4">
                <div>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Express 24h</span>
                  <h3 className="font-extrabold text-base text-slate-800 mt-2">Paket Express Kilat</h3>
                  <p className="text-xs text-slate-500 mt-1">Butuh cepat? Selesai dalam hitungan jam untuk acara Anda.</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600 border-t pt-2">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /> Selesai 6-24 Jam</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /> Mesin Terpisah</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /> Bebas Ongkir Antar Jemput</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xl font-black text-amber-600">Rp 12.000 <span className="text-xs font-normal text-slate-400">/ kg</span></p>
                  <button 
                    onClick={() => {
                      setOrderForm({ ...orderForm, package: 'Paket Express Kilat' });
                      setActiveTab('pickup');
                    }}
                    className="mt-2 w-full bg-amber-500 text-slate-950 font-black py-2 rounded-xl text-xs"
                  >
                    Pesan Express Kilat
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm space-y-4">
                <div>
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Dry Clean</span>
                  <h3 className="font-extrabold text-base text-slate-800 mt-2">Paket Satuan & Dry Clean</h3>
                  <p className="text-xs text-slate-500 mt-1">Perawatan khusus jas, gaun pesta, bed cover & sepatu.</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600 border-t pt-2">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Bahan Halus & Hanger</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Anti Jamur & Apek</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Plastik Cover Pelindung</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xl font-black text-slate-800">Mulai Rp 30.000 <span className="text-xs font-normal text-slate-400">/ pcs</span></p>
                  <button 
                    onClick={() => {
                      setOrderForm({ ...orderForm, package: 'Paket Satuan & Dry Clean' });
                      setActiveTab('pickup');
                    }}
                    className="mt-2 w-full bg-slate-800 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Pesan Satuan
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-b from-teal-900 to-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg space-y-4">
                <div>
                  <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Member Sultan</span>
                  <h3 className="font-extrabold text-base text-white mt-2">Paket Langganan Sultan</h3>
                  <p className="text-xs text-teal-200 mt-1">Deposit saldo dapat bonus +15% & bebas ongkir antar jemput.</p>
                  <ul className="mt-3 space-y-1 text-xs text-teal-100 border-t border-teal-800 pt-2">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Saldo Tanpa Kadaluwarsa</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Bebas Ongkir Jemput</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Double Poin Reward</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xl font-black text-amber-300">Topup Rp 150.000</p>
                  <button 
                    onClick={() => {
                      setOrderForm({ ...orderForm, package: 'Paket Member Sultan' });
                      setActiveTab('pickup');
                    }}
                    className="mt-2 w-full bg-amber-400 text-teal-950 font-black py-2 rounded-xl text-xs"
                  >
                    Daftar Member Sultan
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 3. TAB KALKULATOR BIAYA */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <section className="py-10 px-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border space-y-6">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full uppercase">Simulasi Biaya</span>
                <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                  <Calculator className="w-6 h-6 text-teal-600" /> Kalkulator Biaya Laundry
                </h2>
                <p className="text-xs text-slate-500">Hitung estimasi total tagihan sebelum penjemputan</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Jenis Layanan Laundry</label>
                    <select 
                      className="w-full p-2.5 border rounded-xl text-xs bg-white font-medium outline-none focus:ring-2 focus:ring-teal-500"
                      value={calcService ? calcService.id : ''}
                      onChange={(e) => {
                        const s = services.find(srv => srv.id === Number(e.target.value));
                        if (s) setCalcService(s);
                      }}
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.service_name} (Rp {s.price.toLocaleString('id-ID')} / {s.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Estimasi Jumlah ({calcService?.unit || 'kg'})</label>
                      <span className="text-xs font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded">{calcQty} {calcService?.unit}</span>
                    </div>
                    <input 
                      type="range" 
                      min={calcService?.unit === 'pcs' || calcService?.unit === 'pasang' ? "1" : "1.0"} 
                      max="20" 
                      step={calcService?.unit === 'pcs' || calcService?.unit === 'pasang' ? "1" : "0.5"}
                      value={calcQty}
                      onChange={(e) => setCalcQty(parseFloat(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-teal-800 text-white p-6 rounded-2xl text-center space-y-3 shadow-inner">
                  <p className="text-xs text-teal-200 font-semibold uppercase">Estimasi Total Biaya</p>
                  <p className="text-4xl font-black text-amber-300">
                    Rp {calculatedTotal.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-teal-100">
                    *Dapatkan +{Math.floor(calcQty)} Poin Reward untuk transaksi ini!
                  </p>
                  <button 
                    onClick={handleOrderCalcViaWA}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 fill-slate-950" /> Order via WhatsApp Dengan Hasil Ini
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 4. TAB FORMULIR ANTAR-JEMPUT */}
        {/* ========================================================================= */}
        {activeTab === 'pickup' && (
          <section className="py-10 px-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border overflow-hidden p-6 md:p-8 space-y-6">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full uppercase">Penjemputan Gratis</span>
                <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                  <Truck className="w-6 h-6 text-teal-600" /> Formulir Pesan Antar-Jemput
                </h2>
                <p className="text-xs text-slate-500">Tim kurir kami akan segera menuju lokasi Anda</p>
              </div>

              <form onSubmit={handleSendWhatsAppOrder} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={orderForm.name}
                    onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">No. WhatsApp *</label>
                    <input 
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Penjemputan</label>
                    <input 
                      type="date"
                      value={orderForm.pickupDate}
                      onChange={(e) => setOrderForm({ ...orderForm, pickupDate: e.target.value })}
                      className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pilihan Paket Laundry</label>
                  <select 
                    value={orderForm.package}
                    onChange={(e) => setOrderForm({ ...orderForm, package: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="Paket Kiloan Reguler">Paket Kiloan Reguler (Rp 7.000/kg)</option>
                    <option value="Paket Express Kilat">Paket Express Kilat 24 Jam (Rp 12.000/kg)</option>
                    <option value="Paket Satuan & Dry Clean">Paket Satuan / Dry Clean (Bedcover, Jas, Sepatu)</option>
                    <option value="Paket Member Sultan">Paket Langganan Member Sultan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Penjemputan Lengkap *</label>
                  <textarea 
                    required
                    rows="3"
                    placeholder="Nama jalan, nomor rumah, patokan..."
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  ></textarea>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                  <input 
                    type="text"
                    placeholder="Misal: Harap pakai parfum Lily, kemeja di-hanger"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 fill-white" /> Kirim Pesanan Penjemputan (Otomatis Ke Admin)
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB CEK STATUS CUCIAN (TRACKING) */}
        {/* ========================================================================= */}
        {activeTab === 'tracking' && (
          <section className="py-10 px-4 max-w-xl mx-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full uppercase">Realtime API</span>
                <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                  <Search className="w-6 h-6 text-teal-600" /> Cek Status Cucian Anda
                </h2>
                <p className="text-xs text-slate-500">Masukkan Nomor Nota (contoh: <b>LD-2026...</b>) atau No. HP Anda</p>
              </div>

              <form onSubmit={onTrackOrder} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="LD-20260801-001 atau 0812..." 
                  value={trackKeyword}
                  onChange={(e) => setTrackKeyword(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <button 
                  type="submit" 
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" /> Cari Status Cucian
                </button>
              </form>

              {trackResults && (
                <div className="mt-4 pt-3 border-t space-y-2">
                  {trackResults.length === 0 ? (
                    <p className="text-xs text-red-500 text-center py-2 bg-red-50 rounded-lg">Data cucian tidak ditemukan.</p>
                  ) : (
                    trackResults.map((item, idx) => (
                      <div key={idx} className="bg-teal-50 p-4 rounded-2xl border border-teal-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-teal-800">{item.invoice_number}</span>
                          <span className="bg-teal-700 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
                            {item.work_status}
                          </span>
                        </div>
                        <p className="text-slate-800 font-bold">{item.customer_name}</p>
                        <p className="text-[11px] text-slate-500">Rak Simpan: <b className="text-teal-700">{item.rack_location}</b> | Parfum: {item.perfume_variant}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB PORTAL MEMBER & RIWAYAT CUCIAN */}
        {/* ========================================================================= */}
        {activeTab === 'member' && (
          <section className="py-10 px-4 max-w-5xl mx-auto space-y-8">
            {loggedInMember ? (
              <div className="space-y-6">
                {/* Member Profile Dashboard Header */}
                <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                        <span>🧺</span> Member Portal Pelanggan
                      </span>
                      <h2 className="text-2xl font-black mt-2">{loggedInMember.name}</h2>
                      <p className="text-xs text-teal-100 mt-0.5">{loggedInMember.phone} | {loggedInMember.address}</p>
                    </div>
                    <button 
                      onClick={onLogoutMember}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs border border-white/20 flex items-center gap-1.5 transition"
                    >
                      <LogOut className="w-4 h-4" /> Logout Member
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-2">
                      <div className="flex justify-between items-center text-amber-900">
                        <span className="text-xs font-black uppercase">Saldo Poin Reward</span>
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      </div>
                      <p className="text-3xl font-black text-amber-900">{loggedInMember.points} <span className="text-xs font-semibold">Poin</span></p>
                      <p className="text-[11px] text-amber-800">1 kg = 1 Poin. Kumpul 10 Poin = Diskon Rp {redeemDiscountText}!</p>
                      
                      <div className="w-full bg-amber-200 rounded-full h-2 mt-2 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (loggedInMember.points / 10) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200 space-y-2">
                      <div className="flex justify-between items-center text-teal-900">
                        <span className="text-xs font-black uppercase">Saldo Deposit Member</span>
                        <Wallet className="w-5 h-5 text-teal-700" />
                      </div>
                      <p className="text-3xl font-black text-teal-950">Rp {loggedInMember.deposit_balance.toLocaleString('id-ID')}</p>
                      <p className="text-[11px] text-teal-700">Dapat digunakan pembayaran non-tunai langsung saat kasir POS.</p>
                    </div>

                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-2">
                      <div className="flex justify-between items-center text-emerald-900">
                        <span className="text-xs font-black uppercase">Voucher Diskon</span>
                        <Gift className="w-5 h-5 text-emerald-700" />
                      </div>
                      <p className="text-lg font-extrabold text-emerald-900">
                        {loggedInMember.is_first_order ? `Diskon Rp ${firstDiscountText}` : 'Program Loyalitas Aktif'}
                      </p>
                      <p className="text-[11px] text-emerald-700">Otomatis terpotong saat transaksi pertama di kasir POS.</p>
                    </div>
                  </div>
                </div>

                {/* DETAILED ORDER HISTORY & WORK STATUS */}
                <div className="bg-white rounded-3xl shadow-xl border p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-2">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                        <Package className="w-5 h-5 text-teal-600" /> Riwayat Cucian & Status Live Pengerjaan
                      </h3>
                      <p className="text-xs text-slate-500">Daftar transaksi cucian Anda atas nama nomor HP {loggedInMember.phone}</p>
                    </div>
                    <span className="bg-teal-100 text-teal-800 text-xs font-extrabold px-3 py-1 rounded-full">
                      Total: {memberOrders.length} Pesanan
                    </span>
                  </div>

                  {memberOrders.length === 0 ? (
                    <div className="bg-slate-50 p-10 rounded-2xl text-center space-y-3 border">
                      <span className="text-3xl">🧺</span>
                      <p className="text-xs text-slate-500 font-medium">Belum ada riwayat transaksi cucian atas nama nomor HP Anda ({loggedInMember.phone}).</p>
                      <button 
                        onClick={() => setActiveTab('pickup')}
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition inline-flex items-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" /> Pesan Laundry Antar-Jemput Sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {memberOrders.map(ord => {
                        const currentStep = getWorkStatusStep(ord.work_status);
                        return (
                          <div key={ord.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
                            
                            {/* Header Order */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-teal-800 text-base">{ord.invoice_number}</span>
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {ord.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {ord.created_at} | 
                                  <span>Rak: <b className="text-teal-700">{ord.rack_location}</b></span> | 
                                  <span>Parfum: <b className="text-teal-700">{ord.perfume_variant}</b></span>
                                </p>
                              </div>

                              <div className="text-left sm:text-right">
                                <p className="text-xs text-slate-400">Total Tagihan:</p>
                                <p className="text-lg font-black text-teal-800">Rp {ord.total_amount.toLocaleString('id-ID')}</p>
                              </div>
                            </div>

                            {/* WORK STATUS STEPPER PROGRESS BAR */}
                            <div className="space-y-2 pt-1">
                              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status Live Pengerjaan Cucian:</p>
                              
                              <div className="grid grid-cols-5 gap-1 text-center">
                                {[
                                  { step: 1, label: 'Perlu Jemput', icon: '🚛' },
                                  { step: 2, label: 'Diterima', icon: '🧺' },
                                  { step: 3, label: 'Dicuci', icon: '🧼' },
                                  { step: 4, label: 'Disetrika', icon: '👔' },
                                  { step: 5, label: 'Selesai', icon: '✨' }
                                ].map((st) => (
                                  <div 
                                    key={st.step} 
                                    className={`p-2 rounded-xl border text-[10px] font-bold transition flex flex-col items-center gap-1 ${
                                      currentStep >= st.step 
                                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm' 
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    <span className="text-xs">{st.icon}</span>
                                    <span className="hidden sm:inline">{st.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Items Breakdown */}
                            <div className="bg-white p-3 rounded-xl border space-y-1.5 text-xs">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Rincian Item Cucian:</p>
                              {ord.items && ord.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-700 font-semibold">
                                  <span>{it.service_name} ({it.qty} {it.unit || 'kg'})</span>
                                  <span>Rp {it.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                              ))}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              /* AUTH FORM LOGIN/REGISTER */
              <div className="bg-white rounded-3xl shadow-xl border overflow-hidden max-w-md mx-auto">
                <div className="flex border-b">
                  <button 
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 py-3.5 text-xs font-black transition flex items-center justify-center gap-2 ${
                      authTab === 'login' ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <LogIn className="w-4 h-4" /> Login Member
                  </button>
                  <button 
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-3.5 text-xs font-black transition flex items-center justify-center gap-2 ${
                      authTab === 'register' ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" /> Daftar Member Baru
                  </button>
                </div>

                <div className="p-6">
                  {authTab === 'login' ? (
                    <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                      <div className="text-center space-y-1">
                        <h3 className="font-extrabold text-base text-slate-800">Login Member Laundry</h3>
                        <p className="text-slate-500">Masukkan No. HP dan Password terdaftar Anda.</p>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">No. WhatsApp / HP *</label>
                        <input 
                          type="tel" required placeholder="081234567890" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full p-2.5 border rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Password *</label>
                        <input 
                          type="password" required placeholder="Masukkan password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full p-2.5 border rounded-xl"
                        />
                      </div>

                      <button type="submit" className="w-full bg-teal-700 text-white font-extrabold py-3 rounded-xl shadow">
                        Masuk Ke Member Portal
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                      <div className="text-center space-y-1">
                        <h3 className="font-extrabold text-base text-slate-800">Daftar Member Baru</h3>
                        <p className="text-emerald-600 font-bold">🎉 Diskon Transaksi Pertama Rp {firstDiscountText}!</p>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Nama Lengkap *</label>
                        <input type="text" required placeholder="Rina Permata" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full p-2 border rounded-xl" />
                      </div>

                      <div>
                        <label className="font-bold block mb-1">No. WhatsApp (ID Login) *</label>
                        <input type="tel" required placeholder="0813..." value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full p-2 border rounded-xl" />
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Buat Password *</label>
                        <input type="password" required placeholder="Minimal 3 karakter" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full p-2 border rounded-xl" />
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Alamat Penjemputan</label>
                        <textarea rows="2" placeholder="Nama jalan..." value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="w-full p-2 border rounded-xl"></textarea>
                      </div>

                      <button type="submit" className="w-full bg-emerald-600 text-white font-extrabold py-3 rounded-xl shadow">
                        Daftar Member & Dapatkan Diskon
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING WHATSAPP CHAT BUTTON (STICKY SISI KANAN BAWAH) (USER REQUEST) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
        <div className="hidden sm:block bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          💬 Chat WhatsApp CS Toko
        </div>
        <a 
          href={`https://wa.me/${targetWa}?text=${encodeURIComponent('Halo Kak, saya mau tanya seputar jasa laundry...')}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl transition transform hover:scale-110 flex items-center justify-center border-2 border-white ring-4 ring-emerald-500/30 animate-bounce"
          title="Chat CS WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-white" />
        </a>
      </div>

      {/* ========================================================================= */}
      {/* SECTION LOKASI & PETA GOOGLE MAPS OUTLET (HANYA TAMPIL DI BERANDA UTAMA) */}
      {/* ========================================================================= */}
      {activeTab === 'home' && (
        <section className="bg-slate-900 text-white py-14 px-4 border-t border-slate-800">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="bg-teal-900/80 text-teal-300 font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-teal-700 uppercase tracking-widest inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" /> Lokasi & Peta Outlet
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Kunjungi & Temukan Outlet Terdekat Kami</h2>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Lokasi strategis, mudah dijangkau, dan siap melayani kebutuhan laundry pakaian Anda setiap hari.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Outlets Info Box (Lg: 4) */}
              <div className="lg:col-span-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-amber-300 text-base flex items-center gap-2 border-b border-slate-700 pb-3">
                    <Building2 className="w-5 h-5 text-amber-400" /> {storeSettings.store_name}
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white mb-0.5">Alamat Utama Toko:</p>
                        <p className="text-slate-300">{storeSettings.address || 'Jl. Raya Utama No. 12, Bandung'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white">Hotline WhatsApp CS:</p>
                        <p className="text-slate-300">{storeSettings.phone || '081234567890'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white">Jam Buka Laundry:</p>
                        <p className="text-slate-300">{storeSettings.operating_hours || 'Senin - Minggu: 07:00 - 21:00 WIB'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(storeSettings.address || storeSettings.store_name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MapPin className="w-4 h-4" /> Buka Di Google Maps App
                  </a>
                </div>
              </div>

              {/* Google Maps Interactive iFrame (Lg: 8) */}
              <div className="lg:col-span-8 bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl h-80 lg:h-auto min-h-[320px] relative">
                <iframe 
                  title="Google Maps Lokasi Laundry"
                  src={
                    storeSettings.maps_embed_url && storeSettings.maps_embed_url.includes('google.com/maps')
                      ? (storeSettings.maps_embed_url.includes('<iframe') 
                          ? storeSettings.maps_embed_url.match(/src="([^"]+)"/)?.[1] || storeSettings.maps_embed_url 
                          : storeSettings.maps_embed_url)
                      : 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.898863678077!2d107.608316!3d-6.902677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTQnMDkuNiJTIDEwN8KwMzYnMjkuOSJF!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid'
                  } 
                  className="w-full h-full border-0" 
                  allowFullScreen="" 
                  loading="lazy" 
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GLOBAL FOOTER WITH SOCIAL MEDIA FOLLOW (USER REQUEST - LINK MENU DIHILANGKAN) */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 px-4 border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-3">
            <img 
              src={logoImgSrc} 
              alt="Logo Toko" 
              className="w-10 h-10 rounded-xl object-cover border border-amber-400"
              onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
            />
            <div>
              <p className="font-extrabold text-white text-base">{storeSettings.store_name}</p>
              <p className="text-slate-400 mt-0.5">{storeSettings.tagline}</p>
              <p className="text-[11px] text-teal-400 font-semibold mt-1">📍 {storeSettings.address} | 📞 {storeSettings.phone}</p>
              <p className="text-[11px] text-amber-300 font-semibold mt-0.5 flex items-center gap-1 justify-center md:justify-start">
                <Clock className="w-3.5 h-3.5 text-amber-400 inline" /> Jam Operasional: {storeSettings.operating_hours || 'Senin - Minggu: 07:00 - 21:00 WIB'}
              </p>
            </div>
          </div>

          {/* Center Social Media Follow Links (USER REQUEST) */}
          <div className="space-y-2">
            <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Ikuti Media Sosial Kami:</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {/* Instagram */}
              <a 
                href={storeSettings.social_instagram || 'https://instagram.com'} 
                target="_blank" 
                rel="noreferrer"
                className="bg-slate-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-slate-200 hover:text-white p-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-pink-400" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>

              {/* Facebook */}
              <a 
                href={storeSettings.social_facebook || 'https://facebook.com'} 
                target="_blank" 
                rel="noreferrer"
                className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white p-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>

              {/* TikTok */}
              <a 
                href={storeSettings.social_tiktok || 'https://tiktok.com'} 
                target="_blank" 
                rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-950 text-slate-200 hover:text-white p-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-teal-400" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.96-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.33 1.55-1.3 2.55.01.8.42 1.57 1.07 2.02.73.52 1.68.68 2.56.44.97-.24 1.78-1 2.05-1.96.16-.54.19-1.12.18-1.68.03-4.88.01-9.77.02-14.65z"/>
                </svg>
                <span>TikTok</span>
              </a>

              {/* WhatsApp Hotline */}
              <a 
                href={
                  storeSettings.social_whatsapp 
                    ? (storeSettings.social_whatsapp.startsWith('http') 
                        ? storeSettings.social_whatsapp 
                        : `https://wa.me/${storeSettings.social_whatsapp.replace(/[^0-9]/g, '')}`) 
                    : `https://wa.me/${targetWa}`
                } 
                target="_blank" 
                rel="noreferrer"
                className="bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white p-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>WhatsApp Hotline</span>
              </a>
            </div>
          </div>

          {/* Right Copyright Notice */}
          <div className="text-slate-500 text-[11px] border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
            &copy; {new Date().getFullYear()} {storeSettings.store_name}. All Rights Reserved.
          </div>

        </div>
      </footer>

    </div>
  );
}
