import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Chart of Accounts', path: '/accounts' },
  { label: 'Parties', path: '/parties' },
  { label: 'Purchases', path: '/purchases' },
  { label: 'Sales', path: '/sales' },
  { label: 'Vouchers', path: '/vouchers' },
  { label: 'Ledger', path: '/ledger' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' }
];

const adminNavItems = [
  { label: 'Users', path: '/users' }
];

export default function Layout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayNavItems = user?.role === 'ADMIN' 
    ? [...navItems, ...adminNavItems]
    : navItems;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/80 p-6 backdrop-blur-xl md:flex">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-slate-700 text-white shadow-lg shadow-navy/20">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy">Supreme Cotton</h1>
                <p className="text-xs text-slate-500">Ledger & Accounting</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1.5 text-sm font-medium text-slate-700">
            {displayNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-navy to-slate-700 text-white shadow-lg shadow-navy/20' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`
                }
              >
                <svg className="h-5 w-5 opacity-70 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {item.label === 'Dashboard' && <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                  {item.label === 'Chart of Accounts' && <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                  {item.label === 'Parties' && <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {item.label === 'Purchases' && <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {item.label === 'Sales' && <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {item.label === 'Vouchers' && <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
                  {item.label === 'Ledger' && <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
                  {item.label === 'Reports' && <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                  {item.label === 'Settings' && <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                  {item.label === 'Users' && <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="mt-auto border-t border-slate-200 pt-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-medium text-navy">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <p className="mt-2 inline-block rounded-full bg-navy/10 px-2 py-1 text-xs font-semibold text-navy">
                {user?.role}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Nav Overlay */}
        {isMobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Sidebar - Mobile */}
        <aside
          className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white/95 p-6 backdrop-blur-xl transition-transform duration-300 md:hidden ${
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-slate-700 text-white shadow-lg">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy">Supreme Cotton</h1>
                <p className="text-xs text-slate-500">Ledger & Accounting</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              onClick={() => setIsMobileNavOpen(false)}
            >
              ✕
            </button>
          </div>
          
          <nav className="space-y-1.5 text-sm font-medium text-slate-700">
            {displayNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-navy to-slate-700 text-white shadow-lg' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`
                }
              >
                <svg className="h-5 w-5 opacity-70 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {item.label === 'Dashboard' && <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                  {item.label === 'Chart of Accounts' && <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                  {item.label === 'Parties' && <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {item.label === 'Purchases' && <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
                  {item.label === 'Sales' && <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                  {item.label === 'Vouchers' && <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}
                  {item.label === 'Ledger' && <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
                  {item.label === 'Reports' && <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                  {item.label === 'Settings' && <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
                  {item.label === 'Users' && <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="mt-auto border-t border-slate-200 pt-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-medium text-navy">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <p className="mt-2 inline-block rounded-full bg-navy/10 px-2 py-1 text-xs font-semibold text-navy">
                {user?.role}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-navy md:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-navy md:text-2xl">Dashboard</h1>
                <p className="text-sm text-slate-500">Welcome back, {user?.name} <span className="text-navy">({user?.role})</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-xl bg-slate-50 px-4 py-2 md:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <span className="text-sm font-semibold">{user?.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-all hover:bg-rose-100 hover:shadow-md"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </header>

          {/* Page Content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
