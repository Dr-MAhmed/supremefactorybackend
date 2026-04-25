export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Sales</div>
          <div className="mt-3 text-3xl font-semibold text-navy">PKR 1,25,000</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Total Purchases</div>
          <div className="mt-3 text-3xl font-semibold text-navy">PKR 72,500</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Receivable</div>
          <div className="mt-3 text-3xl font-semibold text-navy">PKR 35,400</div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span>INV-2025-00010</span>
              <span className="font-semibold text-navy">PKR 24,500</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span>PUR-2025-00008</span>
              <span className="font-semibold text-navy">PKR 18,700</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span>RV-2025-00003</span>
              <span className="font-semibold text-navy">PKR 12,000</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Top Customers</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-50 p-3">Faisal Traders - PKR 54,200</li>
            <li className="rounded-2xl bg-slate-50 p-3">Textile Hub - PKR 32,000</li>
            <li className="rounded-2xl bg-slate-50 p-3">Cotton World - PKR 25,800</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
