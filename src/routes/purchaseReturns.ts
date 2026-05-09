import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const purchaseReturnItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  rate: z.coerce.number().nonnegative(),
  amount: z.coerce.number().nonnegative()
});

const purchaseReturnSchema = z.object({
  partyId: z.string().min(1),
  purchaseId: z.string().nullable().optional(),
  items: z.array(purchaseReturnItemSchema).min(1),
  subtotal: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative(),
  reason: z.string().nullable().optional(),
  remarks: z.string().nullable().optional()
});

const purchaseReturnUpdateSchema = z.object({
  partyId: z.string().min(1).optional(),
  purchaseId: z.string().nullable().optional(),
  items: z.array(purchaseReturnItemSchema).min(1).optional(),
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
  purchaseId: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

router.use(authenticate);

// List all purchase returns
router.get('/', validateQuery(returnListQuerySchema), asyncHandler(async (req, res) => {
  const { partyId, purchaseId, startDate, endDate } = req.query;
  const where: any = {};

  if (partyId) where.partyId = partyId as string;
  if (purchaseId) where.purchaseId = purchaseId as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const returns = await prisma.purchaseReturn.findMany({
    where,
    include: { party: true, purchase: true, items: true },
    orderBy: { date: 'desc' }
  });

  res.json(returns);
}));

// Get single purchase return
router.get('/:id', validateParams(returnParamsSchema), asyncHandler(async (req, res) => {
  const purchaseReturn = await prisma.purchaseReturn.findUnique({
    where: { id: req.params.id as string },
    include: { party: true, purchase: true, items: true }
  });

  if (!purchaseReturn) throw new AppError('Purchase return not found', 404);
  res.json(purchaseReturn);
}));

// Create purchase return
router.post('/', validateBody(purchaseReturnSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create purchase returns', 403);

  const { partyId, purchaseId, items, subtotal, discount, tax, total, reason, remarks } = req.body;

  // Auto-generate voucher number
  const lastReturn = await prisma.purchaseReturn.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastReturn ? parseInt(lastReturn.voucherNo.split('-')[2]) : 0;
  const voucherNo = `PR-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const purchaseReturn = await prisma.purchaseReturn.create({
    data: {
      voucherNo,
      date: new Date(),
      partyId,
      purchaseId: purchaseId || null,
      subtotal,
      discount,
      tax,
      total,
      reason,
      remarks,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true, party: true, purchase: true }
  });

  // Create journal entries for the purchase return (reverse purchase effect)
  // Debit: Accounts Payable (or Cash if paid), Credit: Purchase Cost (or Inventory)
  const purchaseAccount = await prisma.account.findFirst({ where: { code: '5001' } }); // Purchase Cost
  const apAccount = await prisma.account.findFirst({ where: { code: '2001' } }); // Accounts Payable

  if (purchaseAccount && apAccount) {
    const journalEntries = [
      {
        voucherType: 'PURCHASE_RETURN',
        voucherId: purchaseReturn.id,
        date: new Date(),
        accountId: apAccount.id,
        partyId,
        description: `Purchase return: ${voucherNo}`,
        debit: 0,
        credit: total,
        createdById: user.userId
      },
      {
        voucherType: 'PURCHASE_RETURN',
        voucherId: purchaseReturn.id,
        date: new Date(),
        accountId: purchaseAccount.id,
        partyId,
        description: `Purchase return: ${voucherNo}`,
        debit: total,
        credit: 0,
        createdById: user.userId
      }
    ];

    await prisma.journalEntry.createMany({ data: journalEntries });
  }

  res.status(201).json(purchaseReturn);
}));

// Update purchase return
router.put('/:id', validateParams(returnParamsSchema), validateBody(purchaseReturnUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update purchase returns', 403);

  const { partyId, purchaseId, items, subtotal, discount, tax, total, reason, remarks } = req.body;
  const updateData: any = {
    partyId,
    purchaseId: purchaseId || null,
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

  const purchaseReturn = await prisma.purchaseReturn.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { items: true, party: true, purchase: true }
  });

  // Update journal entries if total changed
  if (total !== undefined) {
    await prisma.journalEntry.deleteMany({
      where: { voucherType: 'PURCHASE_RETURN', voucherId: req.params.id }
    });

    const purchaseAccount = await prisma.account.findFirst({ where: { code: '5001' } });
    const apAccount = await prisma.account.findFirst({ where: { code: '2001' } });

    if (purchaseAccount && apAccount) {
      const journalEntries = [
        {
          voucherType: 'PURCHASE_RETURN',
          voucherId: req.params.id,
          date: new Date(),
          accountId: apAccount.id,
          partyId,
          description: `Purchase return: ${purchaseReturn.voucherNo}`,
          debit: 0,
          credit: total,
          createdById: user.userId
        },
        {
          voucherType: 'PURCHASE_RETURN',
          voucherId: req.params.id,
          date: new Date(),
          accountId: purchaseAccount.id,
          partyId,
          description: `Purchase return: ${purchaseReturn.voucherNo}`,
          debit: total,
          credit: 0,
          createdById: user.userId
        }
      ];

      await prisma.journalEntry.createMany({ data: journalEntries });
    }
  }

  res.json(purchaseReturn);
}));

// Patch (partial update) purchase return
router.patch('/:id', validateParams(returnParamsSchema), validateBody(purchaseReturnSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update purchase returns', 403);

  const { purchaseId, items, subtotal, discount, tax, total, reason, remarks } = req.body;
  const updateData: any = {
    purchaseId: purchaseId !== undefined ? (purchaseId || null) : undefined,
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

  const purchaseReturn = await prisma.purchaseReturn.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { items: true }
  });

  res.json(purchaseReturn);
}));

export default router;