import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const saleItemSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
  amount: z.number().nonnegative()
});
const saleSchema = z.object({
  partyId: z.string().min(1),
  customerPo: z.string().nullable().optional(),
  salesperson: z.string().nullable().optional(),
  items: z.array(saleItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  dueDate: z.string().datetime().nullable().optional(),
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
    where: { id: req.params.id },
    include: { party: true, items: true }
  });

  if (!sale) throw new AppError('Sale not found', 404);
  res.json(sale);
}));

router.post('/', validateBody(saleSchema), asyncHandler(async (req, res) => {
  const { partyId, customerPo, salesperson, items, subtotal, discount, tax, total, dueDate, remarks } = req.body;
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);

  const lastSale = await prisma.sale.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastSale ? parseInt(lastSale.invoiceNo.split('-')[2]) : 0;
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const sale = await prisma.sale.create({
    data: {
      invoiceNo,
      date: new Date(),
      partyId,
      customerPo,
      salesperson,
      subtotal,
      discount,
      tax,
      total,
      receivedAmount: 0,
      paymentStatus: 'UNPAID',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      remarks,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true }
  });

  res.status(201).json(sale);
}));

router.patch('/:id', validateParams(saleParamsSchema), validateBody(saleSchema.partial()), asyncHandler(async (req, res) => {
  const { customerPo, salesperson, items, subtotal, discount, tax, total, dueDate, remarks } = req.body;
  const updateData: any = {
    customerPo,
    salesperson,
    subtotal,
    discount,
    tax,
    total,
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
    where: { id: req.params.id },
    data: updateData,
    include: { items: true }
  });

  res.json(sale);
}));

export default router;
