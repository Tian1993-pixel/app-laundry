import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldCheck, X, Sparkles, AlertCircle, LogIn } from 'lucide-react';
import { API_BASE } from '../utils/apiConfig';
import { showAlertSuccess, showAlertError } from '../utils/swalAlert';

export default function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan Password wajib diisi!');
      return;
    }

    setLoading(true);

    try {
      // Try DB Login API first
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLoginSuccess(data.user, data.tenant);
        showAlertSuccess('Login Berhasil', `Selamat bertugas, ${data.user.name}!`);
        onClose();
      } else {
        setErrorMsg(data.message || 'Username atau Password salah! Silakan periksa kembali kredensial Anda.');
      }
    } catch (err) {
      console.log('Login API network error:', err);
      setErrorMsg('Gagal terhubung ke server login. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 px-6 py-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-teal-200 hover:text-white bg-teal-950/40 hover:bg-teal-950/80 p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-teal-950 flex items-center justify-center shadow-lg font-black">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Login POS & System Kasir</h2>
              <p className="text-xs text-teal-200 mt-0.5">Masukkan kredensial staff untuk mengakses POS</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Username Staff / Kasir
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: kasir atau admin" 
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password / PIN
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password (misal: 123)" 
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Memproses Login...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke POS Kasir</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
