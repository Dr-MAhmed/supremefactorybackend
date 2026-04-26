import { useEffect, useState } from 'react';
import api from '../lib/api';

interface DashboardData {
  totalSales: number;
  totalPurchases: number;
  totalReceivable: number;
  totalPayable: number;
  netProfit: number;
  cashInHand: number;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    account: string;
    party?: string;
  }>;
  topCustomers: Array<{
    name: string;
    total: number;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-64">Failed to load data</div>;
  }

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString('en-PK')}`;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Sales</div>
          <div className="mt-3 text-3xl font-semibold text-navy">{formatCurrency(data.totalSales)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Purchases</div>
          <div className="mt-3 text-3xl font-semibold text-navy">{formatCurrency(data.totalPurchases)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Receivable</div>
          <div className="mt-3 text-3xl font-semibold text-navy">{formatCurrency(data.totalReceivable)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Payable</div>
          <div className="mt-3 text-3xl font-semibold text-navy">{formatCurrency(data.totalPayable)}</div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Net Profit</div>
          <div className="mt-3 text-3xl font-semibold text-navy">{formatCurrency(data.netProfit)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Cash in Hand</div>
          <div className="mt-3 text-3xl font-semibold text-navy">{formatCurrency(data.cashInHand)}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Top Customers</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            {data.topCustomers.slice(0, 3).map((customer, index) => (
              <li key={index} className="rounded-2xl bg-slate-50 p-3">
                {customer.name} - {formatCurrency(customer.total)}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {data.recentTransactions.map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <div>
                <span className="font-medium">{transaction.description || 'Transaction'}</span>
                <div className="text-xs text-slate-500">
                  {new Date(transaction.date).toLocaleDateString()} - {transaction.account}
                  {transaction.party && ` (${transaction.party})`}
                </div>
              </div>
              <div className="text-right">
                {transaction.debit > 0 && <span className="font-semibold text-red-600">Dr {formatCurrency(transaction.debit)}</span>}
                {transaction.credit > 0 && <span className="font-semibold text-green-600">Cr {formatCurrency(transaction.credit)}</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
