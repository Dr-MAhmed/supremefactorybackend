import { useEffect, useState } from 'react';
import api from '../lib/api';

interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  party: { name: string };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: string;
  dueDate: string;
  items: SaleItem[];
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales');
      setSales(data);
    } catch (error) {
      console.error('Failed to fetch sales', error);
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
          <h1 className="text-2xl font-semibold text-slate-900">Sales Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage customer invoices</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
        >
          {showForm ? 'Cancel' : 'New Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              console.log('Create sale');
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Customer" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="date" placeholder="Date" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="text" placeholder="Salesperson" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
              <input type="number" placeholder="Amount" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
            </div>
            <button className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]">
              Create Invoice
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading...</p>
        ) : sales.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No sales yet</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-navy">{s.invoiceNo}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{s.party.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(s.date).toLocaleDateString('en-PK')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-PK') : '-'}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(s.total)}</td>
                  <td>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        s.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : s.paymentStatus === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {s.paymentStatus}
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
