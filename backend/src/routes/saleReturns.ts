import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const saleReturnItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  rate: z.coerce.number().nonnegative(),
  amount: z.coerce.number().nonnegative()
});

const saleReturnSchema = z.object({
  partyId: z.string().min(1),
  saleId: z.string().nullable().optional(),
  items: z.array(saleReturnItemSchema).min(1),
  subtotal: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative(),
  reason: z.string().nullable().optional(),
  remarks: z.string().nullable().optional()
});

const saleReturnUpdateSchema = z.object({
  partyId: z.string().min(1).optional(),
  saleId: z.string().nullable().optional(),
  items: z.array(saleReturnItemSchema).min(1).optional(),
  subtotal: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().optional(),
  tax: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative().optional(),
  reason: z.string().nullable().optional(),
  remarks: z.string().nullable().optional()
});

const returnParamsSchema = z.object({
  id: z.string().min(1)
});

const returnListQuerySchema = z.object({
  partyId: z.string().min(1).optional(),
  saleId: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

router.use(authenticate);

// List all sale returns
router.get('/', validateQuery(returnListQuerySchema), asyncHandler(async (req, res) => {
  const { partyId, saleId, startDate, endDate } = req.query;
  const where: any = {};

  if (partyId) where.partyId = partyId as string;
  if (saleId) where.saleId = saleId as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const returns = await prisma.saleReturn.findMany({
    where,
    include: { party: true, sale: true, items: true },
    orderBy: { date: 'desc' }
  });

  res.json(returns);
}));

// Get single sale return
router.get('/:id', validateParams(returnParamsSchema), asyncHandler(async (req, res) => {
  const saleReturn = await prisma.saleReturn.findUnique({
    where: { id: req.params.id },
    include: { party: true, sale: true, items: true }
  });

  if (!saleReturn) throw new AppError('Sale return not found', 404);
  res.json(saleReturn);
}));

// Create sale return
router.post('/', validateBody(saleReturnSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create sale returns', 403);

  const { partyId, saleId, items, subtotal, discount, tax, total, reason, remarks } = req.body;

  // Auto-generate voucher number
  const lastReturn = await prisma.saleReturn.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastReturn ? parseInt(lastReturn.voucherNo.split('-')[2]) : 0;
  const voucherNo = `SR-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const saleReturn = await prisma.saleReturn.create({
    data: {
      voucherNo,
      date: new Date(),
      partyId,
      saleId: saleId || null,
      subtotal,
      discount,
      tax,
      total,
      reason,
      remarks,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true, party: true, sale: true }
  });

  // Create journal entries for the sale return (reverse sale effect)
  // Debit: Sales Revenue (or Inventory), Credit: Accounts Receivable
  const salesRevenueAccount = await prisma.account.findFirst({ where: { code: '4001' } }); // Sales Revenue
  const arAccount = await prisma.account.findFirst({ where: { code: '1001' } }); // Accounts Receivable

  if (salesRevenueAccount && arAccount) {
    const journalEntries = [
      {
        voucherType: 'SALE_RETURN',
        voucherId: saleReturn.id,
        date: new Date(),
        accountId: salesRevenueAccount.id,
        partyId,
        description: `Sale return: ${voucherNo}`,
        debit: total,
        credit: 0,
        createdById: user.userId
      },
      {
        voucherType: 'SALE_RETURN',
        voucherId: saleReturn.id,
        date: new Date(),
        accountId: arAccount.id,
        partyId,
        description: `Sale return: ${voucherNo}`,
        debit: 0,
        credit: total,
        createdById: user.userId
      }
    ];

    await prisma.journalEntry.createMany({ data: journalEntries });
  }

  res.status(201).json(saleReturn);
}));

// Update sale return
router.put('/:id', validateParams(returnParamsSchema), validateBody(saleReturnUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update sale returns', 403);

  const { partyId, saleId, items, subtotal, discount, tax, total, reason, remarks } = req.body;
  const updateData: any = {
    partyId,
    saleId: saleId || null,
    subtotal,
    discount,
    tax,
    total,
    reason,
    remarks
  };
  if (items) {
    updateData.items = {
      deleteMany: {},
      create: items
    };
  }

  const saleReturn = await prisma.saleReturn.update({
    where: { id: req.params.id },
    data: updateData,
    include: { items: true, party: true, sale: true }
  });

  // Update journal entries if total changed
  if (total !== undefined) {
    await prisma.journalEntry.deleteMany({
      where: { voucherType: 'SALE_RETURN', voucherId: req.params.id }
    });

    const salesRevenueAccount = await prisma.account.findFirst({ where: { code: '4001' } });
    const arAccount = await prisma.account.findFirst({ where: { code: '1001' } });

    if (salesRevenueAccount && arAccount) {
      const journalEntries = [
        {
          voucherType: 'SALE_RETURN',
          voucherId: req.params.id,
          date: new Date(),
          accountId: salesRevenueAccount.id,
          partyId,
          description: `Sale return: ${saleReturn.voucherNo}`,
          debit: total,
          credit: 0,
          createdById: user.userId
        },
        {
          voucherType: 'SALE_RETURN',
          voucherId: req.params.id,
          date: new Date(),
          accountId: arAccount.id,
          partyId,
          description: `Sale return: ${saleReturn.voucherNo}`,
          debit: 0,
          credit: total,
          createdById: user.userId
        }
      ];

      await prisma.journalEntry.createMany({ data: journalEntries });
    }
  }

  res.json(saleReturn);
}));

// Patch (partial update) sale return
router.patch('/:id', validateParams(returnParamsSchema), validateBody(saleReturnSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update sale returns', 403);

  const { saleId, items, subtotal, discount, tax, total, reason, remarks } = req.body;
  const updateData: any = {
    saleId: saleId !== undefined ? (saleId || null) : undefined,
    subtotal,
    discount,
    tax,
    total,
    reason,
    remarks
  };
  if (items) {
    updateData.items = {
      deleteMany: {},
      create: items
    };
  }

  const saleReturn = await prisma.saleReturn.update({
    where: { id: req.params.id },
    data: updateData,
    include: { items: true }
  });

  res.json(saleReturn);
}));

export default router;