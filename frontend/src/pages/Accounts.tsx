import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../components/ToastProvider';
import { usePermissions } from '../hooks/usePermissions';
import ViewOnlyNotice from '../components/ViewOnlyNotice';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

const accountSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { canEdit } = usePermissions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'ASSET'
    }
  });

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
      showToast('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const editAccount = (account: Account) => {
    setEditingAccount(account);
    setValue('code', account.code);
    setValue('name', account.name);
    setValue('type', account.type as any);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    reset();
    setShowForm(false);
  };

  const onSubmit = async (values: AccountFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, values);
        showToast('Account updated successfully');
      } else {
        await api.post('/accounts', values);
        showToast('Account created successfully');
      }
      reset();
      setEditingAccount(null);
      setShowForm(false);
      await fetchAccounts();
    } catch (error: any) {
      console.error('Failed to save account', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${editingAccount ? 'update' : 'create'} account`;
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all ledger accounts</p>
        </div>
        {canEdit ? (
          <button
            onClick={() => editingAccount ? cancelEdit() : setShowForm(!showForm)}
            className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
          >
            {editingAccount ? 'Cancel Edit' : showForm ? 'Cancel' : 'New Account'}
          </button>
        ) : (
          <ViewOnlyNotice entity="accounts" />
        )}
      </div>

      {canEdit && showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            {editingAccount ? 'Edit Account' : 'Create New Account'}
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Account Code"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  {...register('code')}
                />
                {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code.message}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Account Name"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
              </div>
              <select className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" {...register('type')}>
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="REVENUE">REVENUE</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
            <button
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (editingAccount ? 'Updating Account...' : 'Creating Account...') : (editingAccount ? 'Update Account' : 'Create Account')}
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
                {canEdit && <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Actions</th>}
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
                  {canEdit && (
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => editAccount(a)}
                        className="text-navy hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
