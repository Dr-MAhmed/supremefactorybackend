import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const saleItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  rate: z.number().nonnegative(),
  amount: z.number().nonnegative()
});
const saleSchema = z.object({
  invoiceNo: z.string().optional(),
  date: z.string().min(1),
  partyId: z.string().min(1),
  dueDate: z.string().min(1),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  subtotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  items: z.array(saleItemSchema).min(1)
});

const saleUpdateSchema = z.object({
  invoiceNo: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  partyId: z.string().min(1).optional(),
  dueDate: z.string().min(1).optional(),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  items: z.array(saleItemSchema).min(1).optional(),
  customerPo: z.string().nullable().optional(),
  salesperson: z.string().nullable().optional(),
  remarks: z.string().nullable().optional()
});
const saleParamsSchema = z.object({
  id: z.string().min(1)
});
const saleListQuerySchema = z.object({
  partyId: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

const saleStatusSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']),
  receivedAmount: z.coerce.number().nonnegative().optional()
});

router.use(authenticate);

router.get('/', validateQuery(saleListQuerySchema), asyncHandler(async (req, res) => {
  const { partyId, status, startDate, endDate } = req.query;
  const where: any = {};

  if (partyId) where.partyId = partyId as string;
  if (status) where.paymentStatus = status as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { party: true, items: true },
    orderBy: { date: 'desc' }
  });

  res.json(sales);
}));

router.get('/:id', validateParams(saleParamsSchema), asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id as string },
    include: { party: true, items: true }
  });

  if (!sale) throw new AppError('Sale not found', 404);
  res.json(sale);
}));

router.post('/', validateBody(saleSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { invoiceNo, date, partyId, dueDate, discount, tax, subtotal, items } = req.body;
  const calculatedTotal = Number(subtotal) - Number(discount) + Number(tax);
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create sales', 403);

  let finalInvoiceNo = invoiceNo;
  if (!finalInvoiceNo) {
    const lastSale = await prisma.sale.findFirst({ orderBy: { createdAt: 'desc' } });
    const lastNum = lastSale ? parseInt(lastSale.invoiceNo.split('-')[2]) : 0;
    finalInvoiceNo = `SALE-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;
  }

  const sale = await prisma.sale.create({
    data: {
      invoiceNo: finalInvoiceNo,
      date: new Date(date),
      partyId,
      subtotal,
      discount,
      tax,
      total: calculatedTotal,
      receivedAmount: 0,
      paymentStatus: 'UNPAID',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true, party: true }
  });

  res.status(201).json(sale);
})); 

router.put('/:id', validateParams(saleParamsSchema), validateBody(saleUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update sales', 403);
  
  const { invoiceNo, date, partyId, dueDate, customerPo, salesperson, items, subtotal, discount, tax, remarks } = req.body;
  const calculatedTotal = Number(subtotal) - Number(discount) + Number(tax);
  const updateData: any = {
    invoiceNo,
    date: date ? new Date(date) : undefined,
    partyId,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    customerPo,
    salesperson,
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

  const sale = await prisma.sale.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { items: true, party: true }
  });

  res.json(sale);
}));

router.patch('/:id', validateParams(saleParamsSchema), validateBody(saleSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update sales', 403);
  
  const { customerPo, salesperson, items, subtotal, discount, tax, dueDate, remarks } = req.body;
  const calculatedTotal = Number(subtotal) - Number(discount) + Number(tax);
  const updateData: any = {
    customerPo,
    salesperson,
    subtotal,
    discount,
    tax,
    total: calculatedTotal,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    remarks
  };
  if (items) {
    updateData.items = {
      deleteMany: {},
      create: items
    };
  }

  const sale = await prisma.sale.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { items: true }
  });

  res.json(sale);
}));

router.patch('/:id/status', validateParams(saleParamsSchema), validateBody(saleStatusSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update sale status', 403);
  
  const { paymentStatus, receivedAmount } = req.body;
  
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id }
  });
  
  if (!sale) throw new AppError('Sale not found', 404);
  
  let finalReceivedAmount = receivedAmount !== undefined ? receivedAmount : sale.receivedAmount;
  if (paymentStatus === 'PAID') {
    finalReceivedAmount = sale.total;
  } else if (paymentStatus === 'UNPAID') {
    finalReceivedAmount = 0;
  }
  
  const updatedSale = await prisma.sale.update({
    where: { id: req.params.id },
    data: {
      paymentStatus,
      receivedAmount: finalReceivedAmount
    },
    include: { party: true, items: true }
  });
  
  res.json(updatedSale);
}));

export default router;
