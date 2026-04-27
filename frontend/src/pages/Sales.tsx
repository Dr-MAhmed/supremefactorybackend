import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { useToast } from '../components/ToastProvider';
import { usePermissions } from '../hooks/usePermissions';
import ViewOnlyNotice from '../components/ViewOnlyNotice';

const saleSchema = z.object({
  invoiceNo: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Date is required'),
  partyId: z.string().min(1, 'Customer is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  discount: z.number().min(0, 'Discount must be positive'),
  tax: z.number().min(0, 'Tax must be positive'),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    rate: z.number().min(0.01, 'Rate must be positive'),
  })).min(1, 'At least one item is required'),
});

type SaleFormData = z.infer<typeof saleSchema>;

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
  const [parties, setParties] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { canEdit } = usePermissions();

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      invoiceNo: '',
      date: new Date().toISOString().split('T')[0],
      partyId: '',
      dueDate: '',
      discount: 0,
      tax: 0,
      items: [{ description: '', quantity: 1, unit: 'kg', rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');
  const watchedTax = watch('tax');

  const subtotal = watchedItems?.reduce((sum, item) => sum + (item.quantity * item.rate), 0) || 0;
  const discountAmount = (subtotal * (watchedDiscount || 0)) / 100;
  const taxAmount = ((subtotal - discountAmount) * (watchedTax || 0)) / 100;
  const total = subtotal - discountAmount + taxAmount;

  useEffect(() => {
    fetchSales();
    fetchParties();
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

  const fetchParties = async () => {
    try {
      const { data } = await api.get('/parties');
      setParties(data);
    } catch (error) {
      console.error('Failed to fetch parties', error);
    }
  };

  const onSubmit = async (data: SaleFormData) => {
    try {
      const payload = {
        ...data,
        subtotal,
        total,
        items: data.items.map(item => ({
          ...item,
          amount: item.quantity * item.rate,
        })),
      };
      await api.post('/sales', payload);
      showToast('Sale created successfully', 'success');
      setShowForm(false);
      reset();
      fetchSales();
    } catch (error) {
      console.error('Failed to create sale', error);
      showToast('Failed to create sale', 'error');
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
        {canEdit ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
          >
            {showForm ? 'Cancel' : 'New Invoice'}
          </button>
        ) : (
          <ViewOnlyNotice entity="sales invoices" />
        )}
      </div>

      {canEdit && showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Invoice No</label>
                <input
                  {...register('invoiceNo')}
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.invoiceNo && <p className="mt-1 text-sm text-red-600">{errors.invoiceNo.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  {...register('date')}
                  type="date"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Customer</label>
                <select
                  {...register('partyId')}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                >
                  <option value="">Select Customer</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name}
                    </option>
                  ))}
                </select>
                {errors.partyId && <p className="mt-1 text-sm text-red-600">{errors.partyId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Due Date</label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">Items</h3>
                <button
                  type="button"
                  onClick={() => append({ description: '', quantity: 1, unit: 'kg', rate: 0 })}
                  className="rounded-2xl bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Add Item
                </button>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4">
                      <label className="block text-sm font-medium text-slate-700">Description</label>
                      <input
                        {...register(`items.${index}.description`)}
                        type="text"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index].description.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700">Quantity</label>
                      <input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index].quantity.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700">Unit</label>
                      <input
                        {...register(`items.${index}.unit`)}
                        type="text"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                      />
                      {errors.items?.[index]?.unit && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index].unit.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700">Rate</label>
                      <input
                        {...register(`items.${index}.rate`, { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                      />
                      {errors.items?.[index]?.rate && (
                        <p className="mt-1 text-sm text-red-600">{errors.items[index].rate.message}</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.rate || 0))}
                      </p>
                    </div>
                    <div className="col-span-1">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded-2xl bg-red-100 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Discount (%)</label>
                <input
                  {...register('discount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.discount && <p className="mt-1 text-sm text-red-600">{errors.discount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tax (%)</label>
                <input
                  {...register('tax', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                />
                {errors.tax && <p className="mt-1 text-sm text-red-600">{errors.tax.message}</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163752]"
            >
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
