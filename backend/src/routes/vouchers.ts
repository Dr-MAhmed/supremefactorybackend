import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody, validateQuery } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const paymentSchema = z.object({
  partyId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'BANK']),
  bankAccount: z.string().nullable().optional(),
  chequeNo: z.string().nullable().optional(),
  chequeDate: z.string().nullable().optional(),
  narration: z.string().min(1)
});
const receiptSchema = z.object({
  partyId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'BANK']),
  narration: z.string().min(1)
});
const journalSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  entries: z.array(
    z.object({
      accountId: z.string().min(1),
      debit: z.number().nonnegative(),
      credit: z.number().nonnegative()
    })
  ).min(1)
});
const voucherListQuerySchema = z.object({
  partyId: z.string().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});
const journalListQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

router.use(authenticate);

// Payment Vouchers (we pay someone)
router.get('/payment', validateQuery(voucherListQuerySchema), asyncHandler(async (req, res) => {
  const { partyId, startDate, endDate } = req.query;
  const where: any = { voucherType: 'PAYMENT' };

  if (partyId) where.partyId = partyId as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true, party: true },
    orderBy: { date: 'desc' }
  });

  res.json(entries);
}));

router.post('/payment', validateBody(paymentSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { partyId, amount, paymentMethod, bankAccount, chequeNo, chequeDate, narration } = req.body;
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create payment vouchers', 403);

  const lastEntry = await prisma.journalEntry.findFirst({
    where: { voucherType: 'PAYMENT' },
    orderBy: { createdAt: 'desc' }
  });
  const lastNum = lastEntry ? parseInt(lastEntry.voucherId.split('-')[2]) : 0;
  const voucherId = `PV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const cashAccount = await prisma.account.findFirst({ where: { name: 'Cash' } });
  const bankAcct = await prisma.account.findFirst({ where: { name: 'Bank' } });
  const apAccount = await prisma.account.findFirst({ where: { name: 'Accounts Payable' } });

  if (!apAccount || (!cashAccount && paymentMethod === 'CASH') || (!bankAcct && paymentMethod === 'BANK')) {
    throw new AppError('Required account not found', 400);
  }

  const targetAccount = paymentMethod === 'CASH' ? cashAccount! : bankAcct!;

  const entries = await prisma.journalEntry.createMany({
    data: [
      {
        voucherType: 'PAYMENT',
        voucherId,
        date: new Date(),
        accountId: apAccount.id,
        partyId,
        description: narration,
        debit: amount,
        credit: 0,
        createdById: user.userId
      },
      {
        voucherType: 'PAYMENT',
        voucherId,
        date: new Date(),
        accountId: targetAccount.id,
        description: `Payment to ${narration}`,
        debit: 0,
        credit: amount,
        createdById: user.userId
      }
    ]
  });

  res.status(201).json({ voucherId, amount, entries });
}));

// Receipt Vouchers (we receive money)
router.get('/receipt', validateQuery(voucherListQuerySchema), asyncHandler(async (req, res) => {
  const { partyId, startDate, endDate } = req.query;
  const where: any = { voucherType: 'RECEIPT' };

  if (partyId) where.partyId = partyId as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true, party: true },
    orderBy: { date: 'desc' }
  });

  res.json(entries);
}));

router.post('/receipt', validateBody(receiptSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { partyId, amount, paymentMethod, narration } = req.body;
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create receipt vouchers', 403);

  const lastEntry = await prisma.journalEntry.findFirst({
    where: { voucherType: 'RECEIPT' },
    orderBy: { createdAt: 'desc' }
  });
  const lastNum = lastEntry ? parseInt(lastEntry.voucherId.split('-')[2]) : 0;
  const voucherId = `RV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const cashAccount = await prisma.account.findFirst({ where: { name: 'Cash' } });
  const bankAcct = await prisma.account.findFirst({ where: { name: 'Bank' } });
  const arAccount = await prisma.account.findFirst({ where: { name: 'Accounts Receivable' } });

  if (!arAccount || (!cashAccount && paymentMethod === 'CASH') || (!bankAcct && paymentMethod === 'BANK')) {
    throw new AppError('Required account not found', 400);
  }

  const targetAccount = paymentMethod === 'CASH' ? cashAccount! : bankAcct!;

  const entries = await prisma.journalEntry.createMany({
    data: [
      {
        voucherType: 'RECEIPT',
        voucherId,
        date: new Date(),
        accountId: targetAccount.id,
        partyId,
        description: narration,
        debit: amount,
        credit: 0,
        createdById: user.userId
      },
      {
        voucherType: 'RECEIPT',
        voucherId,
        date: new Date(),
        accountId: arAccount.id,
        description: `Receipt from ${narration}`,
        debit: 0,
        credit: amount,
        createdById: user.userId
      }
    ]
  });

  res.status(201).json({ voucherId, amount, entries });
}));

// Journal Vouchers (general entries)
router.get('/journal', validateQuery(journalListQuerySchema), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const where: any = { voucherType: 'JOURNAL' };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true },
    orderBy: { date: 'desc' }
  });

  res.json(entries);
}));

router.post('/journal', validateBody(journalSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { date, description, entries: entryLines } = req.body;
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create journal vouchers', 403);

  const totalDebit = entryLines.reduce((sum: number, e: any) => sum + (e.debit || 0), 0);
  const totalCredit = entryLines.reduce((sum: number, e: any) => sum + (e.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError('Debit and credit amounts must be equal', 400);
  }

  const lastEntry = await prisma.journalEntry.findFirst({
    where: { voucherType: 'JOURNAL' },
    orderBy: { createdAt: 'desc' }
  });
  const lastNum = lastEntry ? parseInt(lastEntry.voucherId.split('-')[2]) : 0;
  const voucherId = `JV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const created = await prisma.journalEntry.createMany({
    data: entryLines.map((e: any) => ({
      voucherType: 'JOURNAL',
      voucherId,
      date: new Date(date),
      accountId: e.accountId,
      description,
      debit: e.debit || 0,
      credit: e.credit || 0,
      createdById: user.userId
    }))
  });

  res.status(201).json({ voucherId, count: created.count });
}));

export default router;
