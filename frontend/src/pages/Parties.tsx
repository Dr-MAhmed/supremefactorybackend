import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Party {
  id: string;
  type: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  creditLimit: number;
  isActive: boolean;
}

export default function Parties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/parties');
      setParties(data);
    } catch (error) {
      console.error('Failed to fetch parties', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Parties (Customers & Suppliers)</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customers and suppliers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
        >
          {showForm ? 'Cancel' : 'New Party'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              console.log('Create party');
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
                <option>CUSTOMER</option>
                <option>SUPPLIER</option>
                <option>BOTH</option>
              </select>
              <input type="text" placeholder="Party Name" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="email" placeholder="Email" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="phone" placeholder="Phone" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="text" placeholder="City" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="number" placeholder="Credit Limit" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
            </div>
            <button className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]">
              Create Party
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading...</p>
        ) : parties.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No parties yet</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">City</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">Credit Limit</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-navy">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{p.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.city || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.phone || '-'}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(p.creditLimit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
