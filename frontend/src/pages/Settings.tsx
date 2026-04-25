import { useEffect, useState } from 'react';

export default function Settings() {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Supreme Cotton',
    address: 'Faisalabad, Pakistan',
    phone: '+92 41 1234567',
    email: 'info@supremecotton.com',
    ntn: '1234567-8'
  });

  const [editMode, setEditMode] = useState(false);

  const handleSave = () => {
    console.log('Company info saved', companyInfo);
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage company information and preferences</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editMode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Address</label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">NTN</label>
              <input
                type="text"
                value={companyInfo.ntn}
                onChange={(e) => setCompanyInfo({ ...companyInfo, ntn: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
              />
            </div>
            <button className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]">
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between rounded-2xl bg-slate-50 p-4">
              <span className="font-medium text-slate-700">Company Name:</span>
              <span className="text-slate-900">{companyInfo.name}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 p-4">
              <span className="font-medium text-slate-700">Address:</span>
              <span className="text-slate-900">{companyInfo.address}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 p-4">
              <span className="font-medium text-slate-700">Phone:</span>
              <span className="text-slate-900">{companyInfo.phone}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 p-4">
              <span className="font-medium text-slate-700">Email:</span>
              <span className="text-slate-900">{companyInfo.email}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 p-4">
              <span className="font-medium text-slate-700">NTN:</span>
              <span className="text-slate-900">{companyInfo.ntn}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Account Settings</h2>
        <div className="space-y-3">
          <button className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Change Password
          </button>
          <button className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Manage Users
          </button>
          <button className="w-full rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
