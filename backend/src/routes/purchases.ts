import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const purchaseItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  rate: z.coerce.number().nonnegative(),
  amount: z.coerce.number().nonnegative()
});
const purchaseSchema = z.object({
  partyId: z.string().min(1),
  supplierInvoiceNo: z.string().nullable().optional(),
  items: z.array(purchaseItemSchema).min(1),
  subtotal: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative(),
  remarks: z.string().nullable().optional()
});

const purchaseUpdateSchema = z.object({
  partyId: z.string().min(1).optional(),
  supplierInvoiceNo: z.string().nullable().optional(),
  items: z.array(purchaseItemSchema).min(1).optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().optional(),
  tax: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative().optional(),
  remarks: z.string().nullable().optional()
});
const purchaseParamsSchema = z.object({
  id: z.string().min(1)
});
const purchaseListQuerySchema = z.object({
  partyId: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

const purchaseStatusSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']),
  paidAmount: z.coerce.number().nonnegative().optional()
});

router.use(authenticate);

router.get('/', validateQuery(purchaseListQuerySchema), asyncHandler(async (req, res) => {
  const { partyId, status, startDate, endDate } = req.query;
  const where: any = {};

  if (partyId) where.partyId = partyId as string;
  if (status) where.paymentStatus = status as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { party: true, items: true },
    orderBy: { date: 'desc' }
  });

  res.json(purchases);
}));

router.get('/:id', validateParams(purchaseParamsSchema), asyncHandler(async (req, res) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: req.params.id as string },
    include: { party: true, items: true }
  });

  if (!purchase) throw new AppError('Purchase not found', 404);
  res.json(purchase);
}));

router.post('/', validateBody(purchaseSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { partyId, supplierInvoiceNo, items, subtotal, discount, tax, remarks } = req.body;
  const calculatedTotal = Number(subtotal) - Number(discount) + Number(tax);
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create purchases', 403);

  let finalSupplierInvoiceNo = supplierInvoiceNo;
  if (!finalSupplierInvoiceNo) {
    const lastPurchase = await prisma.purchase.findFirst({ orderBy: { createdAt: 'desc' } });
    const lastNum = lastPurchase && lastPurchase.supplierInvoiceNo ? parseInt(lastPurchase.supplierInvoiceNo.split('-')[2]) : 0;
    finalSupplierInvoiceNo = `SUP-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;
  }

  const lastPurchaseVoucher = await prisma.purchase.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNumVoucher = lastPurchaseVoucher ? parseInt(lastPurchaseVoucher.voucherNo.split('-')[2]) : 0;
  const voucherNo = `PUR-${new Date().getFullYear()}-${String(lastNumVoucher + 1).padStart(5, '0')}`;

  const purchase = await prisma.purchase.create({
    data: {
      voucherNo,
      date: new Date(),
      partyId,
      supplierInvoiceNo: finalSupplierInvoiceNo,
      subtotal,
      discount,
      tax,
      total: calculatedTotal,
      paidAmount: 0,
      paymentStatus: 'UNPAID',
      remarks,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true }
  });

  res.status(201).json(purchase);
}));

router.put('/:id', validateParams(purchaseParamsSchema), validateBody(purchaseUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update purchases', 403);
  
  const { partyId, supplierInvoiceNo, items, subtotal, discount, tax, remarks } = req.body;
  const calculatedTotal = Number(subtotal) - Number(discount) + Number(tax);
  const updateData: any = {
    partyId,
    supplierInvoiceNo,
    subtotal,
    discount,
    tax,
    total: calculatedTotal,
    remarks
  };
  if (items) {
    updateData.items = {
      deleteMany: {},
      create: items
    };
  }

  const purchase = await prisma.purchase.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { items: true, party: true }
  });

  res.json(purchase);
}));

router.patch('/:id', validateParams(purchaseParamsSchema), validateBody(purchaseSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update purchases', 403);
  
  const { supplierInvoiceNo, items, subtotal, discount, tax, remarks } = req.body;
  const calculatedTotal = Number(subtotal) - Number(discount) + Number(tax);
  const updateData: any = {
    supplierInvoiceNo,
    subtotal,
    discount,
    tax,
    total: calculatedTotal,
    remarks
  };
  if (items) {
    updateData.items = {
      deleteMany: {},
      create: items
    };
  }

  const purchase = await prisma.purchase.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { items: true }
  });

  res.json(purchase);
}));

router.patch('/:id/status', validateParams(purchaseParamsSchema), validateBody(purchaseStatusSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update purchase status', 403);
  
  const { paymentStatus, paidAmount } = req.body;
  
  const purchase = await prisma.purchase.findUnique({
    where: { id: req.params.id as string }
  });

  if (!purchase) throw new AppError('Purchase not found', 404);

  let finalPaidAmount = paidAmount !== undefined ? paidAmount : purchase.paidAmount;
  if (paymentStatus === 'PAID') {
    finalPaidAmount = purchase.total;
  } else if (paymentStatus === 'UNPAID') {
    finalPaidAmount = 0;
  }
  
  const updatedPurchase = await prisma.purchase.update({
    where: { id: req.params.id },
    data: {
      paymentStatus,
      paidAmount: finalPaidAmount
    },
    include: { party: true, items: true }
  });
  
  res.json(updatedPurchase);
}));

export default router;
