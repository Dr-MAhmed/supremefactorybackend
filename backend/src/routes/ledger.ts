import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateParams, validateQuery } from '../middleware/validate';

const router = Router();
const ledgerParamsSchema = z.object({
  accountId: z.string().min(1).optional(),
  partyId: z.string().min(1).optional()
});
const ledgerQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

router.use(authenticate);

router.get('/account/:accountId', validateParams(ledgerParamsSchema), validateQuery(ledgerQuerySchema), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const accountId = req.params.accountId as string;

  const where: any = { accountId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true },
    orderBy: { date: 'asc' }
  });

  let balance = 0;
  const ledger = entries.map((e: any) => {
    balance += (e.debit || 0) - (e.credit || 0);
    return { ...e, runningBalance: balance };
  });

  res.json({
    account: (await prisma.account.findUnique({ where: { id: accountId } })) || null,
    entries: ledger,
    closingBalance: balance
  });
}));

router.get('/party/:partyId', validateParams(ledgerParamsSchema), validateQuery(ledgerQuerySchema), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const partyId = req.params.partyId as string;

  const where: any = { partyId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true },
    orderBy: { date: 'asc' }
  });

  let balance = 0;
  const ledger = entries.map((e: any) => {
    balance += (e.debit || 0) - (e.credit || 0);
    return { ...e, runningBalance: balance };
  });

  res.json({
    party: (await prisma.party.findUnique({ where: { id: partyId } })) || null,
    entries: ledger,
    closingBalance: balance
  });
}));

export default router;
