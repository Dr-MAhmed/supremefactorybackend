import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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

export default function Layout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 md:flex">
          <div className="mb-8">
            <div className="text-2xl font-semibold text-navy">Supreme Cotton</div>
            <p className="mt-2 text-sm text-slate-500">Ledger & Accounting Dashboard</p>
          </div>
          <nav className="space-y-2 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition ${isActive ? 'bg-navy text-white' : 'hover:bg-slate-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        {isMobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}
        <aside
          className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white p-6 transition-transform duration-200 md:hidden ${
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="text-2xl font-semibold text-navy">Supreme Cotton</div>
              <p className="mt-2 text-sm text-slate-500">Ledger & Accounting Dashboard</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              onClick={() => setIsMobileNavOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="space-y-2 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 transition ${isActive ? 'bg-navy text-white' : 'hover:bg-slate-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-700 md:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                Menu
              </button>
              <div>
              <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500">Welcome to Supreme Cotton finance management.</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sign Out
            </button>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
