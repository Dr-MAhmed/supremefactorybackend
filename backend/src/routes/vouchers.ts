import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Payment Vouchers (we pay someone)
router.get('/payment', async (req, res) => {
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
});

router.post('/payment', async (req, res) => {
  const { partyId, amount, paymentMethod, bankAccount, chequeNo, chequeDate, narration } = req.body;
  const user = (req as any).user;

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
    return res.status(400).json({ message: 'Required account not found' });
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
});

// Receipt Vouchers (we receive money)
router.get('/receipt', async (req, res) => {
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
});

router.post('/receipt', async (req, res) => {
  const { partyId, amount, paymentMethod, narration } = req.body;
  const user = (req as any).user;

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
    return res.status(400).json({ message: 'Required account not found' });
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
});

// Journal Vouchers (general entries)
router.get('/journal', async (req, res) => {
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
});

router.post('/journal', async (req, res) => {
  const { narration, entries: entryLines } = req.body;
  const user = (req as any).user;

  const totalDebit = entryLines.reduce((sum: number, e: any) => sum + (e.debit || 0), 0);
  const totalCredit = entryLines.reduce((sum: number, e: any) => sum + (e.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({ message: 'Debit and credit amounts must be equal' });
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
      date: new Date(),
      accountId: e.accountId,
      description: e.description || narration,
      debit: e.debit || 0,
      credit: e.credit || 0,
      createdById: user.userId
    }))
  });

  res.status(201).json({ voucherId, count: created.count });
});

export default router;
