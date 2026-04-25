import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all ledger accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
        >
          {showForm ? 'Cancel' : 'New Account'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              console.log('Create account');
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Account Code" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="text" placeholder="Account Name" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
                <option>ASSET</option>
                <option>LIABILITY</option>
                <option>EQUITY</option>
                <option>REVENUE</option>
                <option>EXPENSE</option>
              </select>
            </div>
            <button className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]">
              Create Account
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No accounts yet</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-navy">{a.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.type}</td>
                  <td>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
