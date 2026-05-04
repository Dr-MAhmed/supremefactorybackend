import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../components/ToastProvider';
import { usePermissions } from '../hooks/usePermissions';
import ViewOnlyNotice from '../components/ViewOnlyNotice';

interface PurchaseItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Purchase {
  id: string;
  voucherNo: string;
  date: string;
  party: { id: string; name: string };
  supplierInvoiceNo: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: string;
  items: PurchaseItem[];
}

interface Party {
  id: string;
  name: string;
  type: string;
}

const purchaseItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.coerce.number().nonnegative('Rate must be non-negative'),
  amount: z.coerce.number().nonnegative('Amount must be non-negative')
});

const purchaseSchema = z.object({
  partyId: z.string().min(1, 'Supplier is required'),
  supplierInvoiceNo: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  discount: z.coerce.number().min(0, 'Discount must be 0 or greater'),
  tax: z.coerce.number().min(0, 'Tax must be 0 or greater'),
  subtotal: z.coerce.number().optional(),
  total: z.coerce.number().optional()
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const { showToast } = useToast();
  const { canEdit } = usePermissions();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      partyId: '',
      supplierInvoiceNo: '',
      items: [{ description: '', quantity: 1, unit: '', rate: 0, amount: 0 }],
      discount: 0,
      tax: 0
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');
  const watchedTax = watch('tax');

  useEffect(() => {
    fetchPurchases();
    fetchParties();
  }, []);

  useEffect(() => {
    const subtotal = watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = subtotal - (watchedDiscount || 0) + (watchedTax || 0);
    setValue('subtotal', subtotal);
    setValue('total', total);
  }, [watchedItems, watchedDiscount, watchedTax, setValue]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/purchases');
      setPurchases(data);
    } catch (error) {
      console.error('Failed to fetch purchases', error);
      showToast('Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const { data } = await api.get('/parties');
      setParties(data.filter((p: Party) => p.type === 'SUPPLIER' || p.type === 'BOTH'));
    } catch (error) {
      console.error('Failed to fetch parties', error);
    }
  };

  const editPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setValue('partyId', purchase.party.id);
    setValue('supplierInvoiceNo', purchase.supplierInvoiceNo || '');
    setValue('items', purchase.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      amount: item.amount
    })));
    setValue('discount', purchase.discount);
    setValue('tax', purchase.tax);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingPurchase(null);
    reset();
    setShowForm(false);
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    setIsSubmitting(true);
    try {
      // Recalculate item amounts and totals based on submitted values
      const itemsWithAmount = values.items.map((item) => ({
        ...item,
        amount: (item.quantity || 0) * (item.rate || 0)
      }));
      const subtotal = itemsWithAmount.reduce((sum, item) => sum + (item.amount || 0), 0);
      const total = subtotal - (values.discount || 0) + (values.tax || 0);
      // Build payload for create or update
      const basePayload = {
        ...values,
        items: itemsWithAmount,
        subtotal,
        total
      };
      const payload = editingPurchase
        ? {
            ...basePayload,
            // Preserve fields that aren't edited via the form but required by the API
            voucherNo: editingPurchase.voucherNo,
            date: editingPurchase.date,
            paymentStatus: editingPurchase.paymentStatus
          }
        : basePayload;
      if (editingPurchase) {
        await api.put(`/purchases/${editingPurchase.id}`, payload);
        showToast('Purchase updated successfully');
      } else {
        await api.post('/purchases', payload);
        showToast('Purchase created successfully');
      }
      reset();
      setEditingPurchase(null);
      setShowForm(false);
      await fetchPurchases();
    } catch (error: any) {
      console.error('Failed to save purchase', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${editingPurchase ? 'update' : 'create'} purchase`;
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `PKR ${value.toLocaleString('en-PK')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Purchase Vouchers</h1>
          <p className="mt-1 text-sm text-slate-500">Record and manage supplier purchases</p>
        </div>
        {canEdit ? (
          <button
            onClick={() => editingPurchase ? cancelEdit() : setShowForm(!showForm)}
            className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
          >
            {editingPurchase ? 'Cancel Edit' : showForm ? 'Cancel' : 'New Purchase'}
          </button>
        ) : (
          <ViewOnlyNotice entity="purchases" />
        )}
      </div>

      {canEdit && showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            {editingPurchase ? 'Edit Purchase' : 'Create New Purchase'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select {...register('partyId')} className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm">
                  <option value="">Select Supplier</option>
                  {parties.map(party => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
                {errors.partyId && <p className="mt-1 text-xs text-rose-600">{errors.partyId.message}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Supplier Invoice #"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                  {...register('supplierInvoiceNo')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Items</h3>
                <button
                  type="button"
                  onClick={() => append({ description: '', quantity: 1, unit: '', rate: 0, amount: 0 })}
                  className="text-xs text-navy hover:underline"
                >
                  + Add Item
                </button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    <input
                      {...register(`items.${index}.description`)}
                      placeholder="Description"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      onChange={(e) => {
                        const qty = parseFloat(e.target.value) || 0;
                        const rate = watchedItems[index]?.rate || 0;
                        setValue(`items.${index}.amount`, qty * rate);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`items.${index}.unit`)}
                      placeholder="Unit"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`items.${index}.rate`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        const qty = watchedItems[index]?.quantity || 0;
                        setValue(`items.${index}.amount`, qty * rate);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`items.${index}.amount`)}
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                      readOnly
                    />
                  </div>
                  <div className="col-span-1">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Discount</label>
                <input
                  {...register('discount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tax (GST)</label>
                <input
                  {...register('tax', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Total</label>
                <input
                  value={formatCurrency(watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0) - (watchedDiscount || 0) + (watchedTax || 0))}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm bg-slate-50"
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (editingPurchase ? 'Updating Purchase...' : 'Creating Purchase...') : (editingPurchase ? 'Update Purchase' : 'Create Purchase')}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading...</p>
        ) : purchases.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No purchases yet</p>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Voucher #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                {canEdit && <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-navy">{p.voucherNo}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{p.party.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(p.date).toLocaleDateString('en-PK')}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">{formatCurrency(p.total)}</td>
                  <td>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        p.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : p.paymentStatus === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.paymentStatus}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => editPurchase(p)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
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
