import { useState } from 'react';
import api from '../lib/api';

export default function Vouchers() {
  const [activeTab, setActiveTab] = useState<'payment' | 'receipt' | 'journal'>('payment');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreateVoucher = async (type: string, formData: any) => {
    setLoading(true);
    try {
      await api.post(`/vouchers/${type}`, formData);
      setShowForm(false);
      console.log(`${type} voucher created`);
    } catch (error) {
      console.error(`Failed to create ${type} voucher`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Vouchers</h1>
          <p className="mt-1 text-sm text-slate-500">Payment, receipt, and journal vouchers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
        >
          {showForm ? 'Cancel' : 'New Voucher'}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200">
          {['payment', 'receipt', 'journal'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab ? 'border-b-2 border-navy text-navy' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'payment' ? 'Payment' : tab === 'receipt' ? 'Receipt' : 'Journal'}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="border-b border-slate-200 p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateVoucher(activeTab, {});
              }}
              className="space-y-4"
            >
              {activeTab === 'payment' && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Paid To" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                  <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Cheque</option>
                  </select>
                  <input type="number" placeholder="Amount" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                  <input type="text" placeholder="Narration" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                </div>
              )}

              {activeTab === 'receipt' && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Received From" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                  <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Cheque</option>
                  </select>
                  <input type="number" placeholder="Amount" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                  <input type="text" placeholder="Narration" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                </div>
              )}

              {activeTab === 'journal' && (
                <div className="space-y-2">
                  <input type="text" placeholder="Narration" className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm" />
                  <p className="text-xs text-slate-500">Add debit/credit entries below</p>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Voucher'}
              </button>
            </form>
          </div>
        )}

        <div className="p-6">
          <p className="text-center text-sm text-slate-500">No vouchers yet</p>
        </div>
      </div>
    </div>
  );
}
