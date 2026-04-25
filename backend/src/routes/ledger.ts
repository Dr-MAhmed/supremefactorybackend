import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

router.use(authenticate);

router.get('/account/:accountId', async (req, res) => {
  const { startDate, endDate } = req.query;
  const { accountId } = req.params;

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
  const ledger = entries.map((e) => {
    balance += (e.debit || 0) - (e.credit || 0);
    return { ...e, runningBalance: balance };
  });

  res.json({
    account: (await prisma.account.findUnique({ where: { id: accountId } })) || null,
    entries: ledger,
    closingBalance: balance
  });
});

router.get('/party/:partyId', async (req, res) => {
  const { startDate, endDate } = req.query;
  const { partyId } = req.params;

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
  const ledger = entries.map((e) => {
    balance += (e.debit || 0) - (e.credit || 0);
    return { ...e, runningBalance: balance };
  });

  res.json({
    party: (await prisma.party.findUnique({ where: { id: partyId } })) || null,
    entries: ledger,
    closingBalance: balance
  });
});

export default router;
