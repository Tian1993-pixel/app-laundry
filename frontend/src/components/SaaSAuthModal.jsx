import React, { useState } from 'react';
import { ShieldCheck, User, Mail, Phone, Lock, Building2, Sparkles, LogIn, UserPlus, X, CheckCircle2 } from 'lucide-react';
import { showAlertSuccess, showAlertWarning, showAlertError } from '../utils/swalAlert';
import { API_BASE } from '../utils/apiConfig';

export default function SaaSAuthModal({ isOpen, onClose, onRegisterSuccess, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [loading, setLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regStoreName || !regPassword) {
      return showAlertWarning('Form Incomplete', 'Lengkapi seluruh data pendaftaran!');
    }

    setLoading(true);
    fetch(`${API_BASE}/saas/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        phone: regPhone,
        store_name: regStoreName,
        password: regPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          const slug = data.tenant?.domain_slug || regStoreName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const adminWa = '6281234567890';
          const waMessage = `Halo Admin RuangSistem,%0A%0ASaya baru saja mendaftar SaaS Laundry Aplikasi:%0A- *Nama Pemilik*: ${encodeURIComponent(regName)}%0A- *Nama Laundry*: ${encodeURIComponent(regStoreName)}%0A- *Request Subdomain*: ${slug}.ruangsistem.my.id%0A- *No. WhatsApp*: ${encodeURIComponent(regPhone)}%0A- *Email*: ${encodeURIComponent(regEmail)}%0A%0AMohon persetujuan & pengaktifan otomatis akun subdomain saya. Terima kasih!`;
          const waUrl = `https://wa.me/${adminWa}?text=${waMessage}`;

          try { window.open(waUrl, '_blank'); } catch (e) {}

          showAlertSuccess(
            '🎉 Pendaftaran Berhasil!',
            `Selamat datang ${regName}! Akun toko "${regStoreName}" (Subdomain: ${slug}.ruangsistem.my.id) telah terdaftar & konfirmasi otomatis diteruskan ke WhatsApp Admin.`
          );
          if (onRegisterSuccess) onRegisterSuccess(data.tenant, data.token, data.user);
          onClose();
        } else {
          showAlertWarning('Pendaftaran Gagal', data.message || 'Email sudah terdaftar!');
        }
      })
      .catch(err => {
        setLoading(false);
        showAlertError('Error Server', err.message);
      });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      return showAlertWarning('Form Incomplete', 'Masukkan Email / Username dan Password!');
    }

    setLoading(true);
    fetch(`${API_BASE}/saas/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          if (data.isSuperAdmin) {
            showAlertSuccess('Login SuperAdmin', 'Selamat datang Master Provider!');
            if (onLoginSuccess) onLoginSuccess({ isSuperAdmin: true, token: data.token });
          } else {
            showAlertSuccess('Login Berhasil!', data.message);
            if (onLoginSuccess) onLoginSuccess({ isSuperAdmin: false, tenant: data.tenant, user: data.user, token: data.token });
          }
          onClose();
        } else {
          showAlertWarning('Login Gagal', data.message || 'Periksa email dan password Anda.');
        }
      })
      .catch(err => {
        setLoading(false);
        showAlertError('Error Server', err.message);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 text-slate-800 relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 p-6 text-white text-center space-y-2 relative overflow-hidden">
          <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Digital SaaS Laundry System
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">Aplikasi Kasir POS Laundry</h2>
          <p className="text-xs text-teal-100">1 Aplikasi untuk Seluruh Operasional Toko Laundry Anda</p>

          {/* Mode Tabs */}
          <div className="flex bg-teal-950/70 p-1 rounded-2xl border border-teal-700/80 mt-4">
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-amber-400 text-teal-950 shadow-md'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Daftar Trial 7 Hari
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-amber-400 text-teal-950 shadow-md'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Login Toko / Admin
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6">
          {authMode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p><b>Coba Gratis 7 Hari!</b> Tanpa kartu kredit. Bebas uji coba semua fitur POS & manajemen outlet.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Pemilik Toko *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Login *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="email" 
                    required
                    placeholder="nama@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">No. WhatsApp *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="tel" 
                      required
                      placeholder="081234567890"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Usaha Laundry *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      required
                      placeholder="Kalam Laundry"
                      value={regStoreName}
                      onChange={(e) => setRegStoreName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="password" 
                    required
                    placeholder="Buat password unik"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? 'Memproses Pendaftaran...' : '🚀 Mulai Coba Gratis 7 Hari Sekarang'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email / Username / No WA *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    required
                    placeholder="email@toko.com atau admin"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="password" 
                    required
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-800 hover:bg-teal-900 text-white font-black py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? 'Memeriksa Akses...' : '🔑 Masuk Ke Aplikasi Kasir POS'}
              </button>

              <div className="bg-slate-50 p-3 rounded-2xl text-[11px] text-slate-500 text-center border">
                Tips SuperAdmin: Gunakan username <b>admin</b> dan password <b>admin123</b> untuk masuk ke Dashboard Provider.
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
