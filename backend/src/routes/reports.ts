import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Trial Balance
router.get('/trial-balance', async (req, res) => {
  const { startDate, endDate } = req.query;

  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true }
  });

  const accountMap = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();

  entries.forEach((e) => {
    if (!accountMap.has(e.accountId)) {
      accountMap.set(e.accountId, {
        code: e.account.code,
        name: e.account.name,
        type: e.account.type,
        debit: 0,
        credit: 0
      });
    }
    const acc = accountMap.get(e.accountId)!;
    acc.debit += e.debit || 0;
    acc.credit += e.credit || 0;
  });

  const trialBalance = Array.from(accountMap.values());
  const totalDebit = trialBalance.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = trialBalance.reduce((sum, a) => sum + a.credit, 0);

  res.json({ accounts: trialBalance, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 });
});

// Profit & Loss
router.get('/profit-loss', async (req, res) => {
  const { startDate, endDate } = req.query;

  const where: any = { account: { type: { in: ['REVENUE', 'EXPENSE'] } } };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true }
  });

  let totalRevenue = 0;
  let totalExpense = 0;

  entries.forEach((e) => {
    if (e.account.type === 'REVENUE') {
      totalRevenue += e.credit || 0;
      totalRevenue -= e.debit || 0;
    } else if (e.account.type === 'EXPENSE') {
      totalExpense += e.debit || 0;
      totalExpense -= e.credit || 0;
    }
  });

  const netProfit = totalRevenue - totalExpense;

  res.json({ totalRevenue, totalExpense, netProfit });
});

// Balance Sheet
router.get('/balance-sheet', async (req, res) => {
  const asOf = req.query.asOf ? new Date(req.query.asOf as string) : new Date();

  const where: any = { date: { lte: asOf } };

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true }
  });

  const accountMap = new Map<string, { code: string; name: string; type: string; balance: number }>();

  entries.forEach((e) => {
    if (!accountMap.has(e.accountId)) {
      accountMap.set(e.accountId, {
        code: e.account.code,
        name: e.account.name,
        type: e.account.type,
        balance: 0
      });
    }
    const acc = accountMap.get(e.accountId)!;
    acc.balance += (e.debit || 0) - (e.credit || 0);
  });

  const assets = Array.from(accountMap.values()).filter((a) => a.type === 'ASSET');
  const liabilities = Array.from(accountMap.values()).filter((a) => a.type === 'LIABILITY');
  const equity = Array.from(accountMap.values()).filter((a) => a.type === 'EQUITY');

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

  res.json({
    asOf,
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
  });
});

// Party Outstanding Report
router.get('/outstanding', async (req, res) => {
  const parties = await prisma.party.findMany({ where: { isActive: true } });

  const outstanding = await Promise.all(
    parties.map(async (party) => {
      const entries = await prisma.journalEntry.findMany({
        where: { partyId: party.id }
      });

      let balance = 0;
      entries.forEach((e) => {
        balance += (e.debit || 0) - (e.credit || 0);
      });

      const daysDue = Math.floor((Date.now() - party.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return { partyId: party.id, partyName: party.name, partyType: party.type, balance, daysDue };
    })
  );

  res.json(outstanding);
});

// Sales Report
router.get('/sales', async (req, res) => {
  const { startDate, endDate } = req.query;

  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { party: true, items: true }
  });

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const byCustomer = new Map<string, number>();

  sales.forEach((s) => {
    byCustomer.set(s.party.name, (byCustomer.get(s.party.name) || 0) + s.total);
  });

  res.json({
    totalSales,
    count: sales.length,
    byCustomer: Array.from(byCustomer.entries()).map(([name, amount]) => ({ name, amount }))
  });
});

// Purchase Report
router.get('/purchases', async (req, res) => {
  const { startDate, endDate } = req.query;

  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { party: true, items: true }
  });

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const bySupplier = new Map<string, number>();

  purchases.forEach((p) => {
    bySupplier.set(p.party.name, (bySupplier.get(p.party.name) || 0) + p.total);
  });

  res.json({
    totalPurchases,
    count: purchases.length,
    bySupplier: Array.from(bySupplier.entries()).map(([name, amount]) => ({ name, amount }))
  });
});

export default router;
