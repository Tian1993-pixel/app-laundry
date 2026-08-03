import React, { useState } from 'react';
import { 
  Shirt, 
  Smartphone, 
  Globe, 
  LogOut, 
  Star, 
  User, 
  Menu, 
  X, 
  Home, 
  Calculator, 
  Truck, 
  Search, 
  ChevronRight,
  MessageCircle
} from 'lucide-react';

export default function Navbar({ 
  activeMode, 
  setActiveMode, 
  storeSettings, 
  loggedInMember, 
  onLogoutMember,
  activeWebsiteTab,
  setActiveWebsiteTab
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const whatsappNumber = (storeSettings.phone || '081234567890').replace(/[^0-9]/g, '');
  const targetWa = whatsappNumber.startsWith('0') ? '62' + whatsappNumber.slice(1) : whatsappNumber;

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'packages', label: 'Paket Laundry', icon: Shirt },
    { id: 'calculator', label: 'Kalkulator Biaya', icon: Calculator },
    { id: 'pickup', label: 'Antar-Jemput', icon: Truck },
    { id: 'tracking', label: 'Cek Cucian', icon: Search },
    { id: 'member', label: 'Portal Member', icon: User }
  ];

  const handleTabClick = (tabId) => {
    setActiveMode('promotional');
    if (setActiveWebsiteTab) setActiveWebsiteTab(tabId);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      <nav className="bg-teal-900 text-white sticky top-0 z-50 border-b border-teal-800/80 shadow-lg font-sans">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Hamburger Button (Mobile) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Hamburger Button for Mobile HP */}
            {activeMode === 'promotional' && (
              <button 
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="xl:hidden p-2 text-amber-400 hover:bg-teal-800 rounded-xl transition"
                aria-label="Buka Menu Sidebar"
              >
                {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            <div 
              onClick={() => handleTabClick('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img 
                src={storeSettings.logo_url && storeSettings.logo_url.startsWith('/images/') ? storeSettings.logo_url.slice(1) : (storeSettings.logo_url || 'images/laundry_logo.png')} 
                alt="Logo Toko" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400/80 shadow transform group-hover:scale-105 transition"
                onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
              />
              <div>
                <h1 className="font-black text-sm sm:text-base leading-none text-white tracking-tight">{storeSettings.store_name}</h1>
                <p className="text-[10px] text-teal-200 mt-0.5 font-medium hidden sm:block">{storeSettings.tagline}</p>
              </div>
            </div>
          </div>

          {/* Center Desktop Navbar Links (Sleek Single-Line Pill Design for XL/Desktop) */}
          {activeMode === 'promotional' && (
            <div className="hidden xl:flex items-center gap-1.5 bg-teal-950/70 p-1.5 rounded-2xl border border-teal-800/80 shadow-inner">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeWebsiteTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 ${
                      isActive 
                        ? 'bg-amber-400 text-teal-950 shadow-md font-extrabold transform scale-105' 
                        : 'text-teal-100 hover:text-white hover:bg-teal-800/70'
                    }`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Right Mode Switcher & Member Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mode Switcher */}
            <div className="flex items-center bg-teal-950/80 p-1 rounded-xl border border-teal-800/80">
              <button 
                onClick={() => setActiveMode('promotional')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                  activeMode === 'promotional' 
                    ? 'bg-amber-400 text-teal-950 shadow-sm' 
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Website</span>
              </button>

              <button 
                onClick={() => setActiveMode('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                  activeMode === 'admin' 
                    ? 'bg-teal-700 text-white shadow-sm' 
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kasir (HP)</span>
              </button>
            </div>

            {/* Member Profile Badge */}
            {loggedInMember ? (
              <div className="flex items-center gap-2 bg-teal-800 border border-teal-700 px-3 py-1.5 rounded-xl text-xs shadow-sm">
                <div className="text-right hidden sm:block">
                  <p className="font-extrabold text-white text-xs">{loggedInMember.name}</p>
                  <p className="text-[10px] text-amber-300 font-bold flex items-center gap-1 justify-end">
                    <Star className="w-3 h-3 fill-amber-300" /> {loggedInMember.points} Poin
                  </p>
                </div>
                <button 
                  onClick={onLogoutMember} 
                  title="Logout Member"
                  className="p-1 text-teal-200 hover:text-red-300 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleTabClick('member')}
                className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Portal Member</span>
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE FLEXIBLE SIDEBAR DRAWER (FLEXIBLE MENU HP & TABLET) */}
      {/* ========================================================================= */}
      {isMobileSidebarOpen && activeMode === 'promotional' && (
        <div className="fixed inset-0 z-50 xl:hidden flex">
          
          {/* Dark Overlay */}
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Drawer Content Container */}
          <div className="relative w-4/5 max-w-xs bg-teal-900 text-white min-h-full p-5 shadow-2xl flex flex-col justify-between z-10 border-r border-teal-800">
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-teal-800">
                <div className="flex items-center gap-2">
                  <img 
                    src={storeSettings.logo_url && storeSettings.logo_url.startsWith('/images/') ? storeSettings.logo_url.slice(1) : (storeSettings.logo_url || 'images/laundry_logo.png')} 
                    alt="Logo Toko" 
                    className="w-10 h-10 rounded-xl object-cover border border-amber-400"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'images/laundry_logo.png'; }}
                  />
                  <div>
                    <h2 className="font-extrabold text-sm text-white">{storeSettings.store_name}</h2>
                    <p className="text-[10px] text-teal-200">Menu Navigasi Website</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 text-slate-300 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Logged in member badge inside sidebar */}
              {loggedInMember && (
                <div className="bg-teal-800/80 p-3 rounded-2xl border border-teal-700 space-y-1">
                  <p className="text-xs font-black text-amber-300">Member: {loggedInMember.name}</p>
                  <p className="text-[11px] text-teal-200">No HP: {loggedInMember.phone}</p>
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> Saldo Poin: {loggedInMember.points} Poin
                  </p>
                </div>
              )}

              {/* Sidebar Menu Items */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider px-2 mb-1">Pilih Halaman Menu:</p>
                {navItems.map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeWebsiteTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full p-3 rounded-xl text-xs font-extrabold transition flex items-center justify-between ${
                        isActive 
                          ? 'bg-amber-400 text-teal-950 shadow-md font-black' 
                          : 'text-teal-100 hover:bg-teal-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Sidebar Footer WhatsApp Quick Action */}
            <div className="pt-4 border-t border-teal-800 space-y-2">
              <a 
                href={`https://wa.me/${targetWa}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
              >
                <MessageCircle className="w-4 h-4 fill-white" /> Hubungi WhatsApp Toko
              </a>
              <p className="text-[10px] text-teal-300 text-center">&copy; {storeSettings.store_name}</p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
