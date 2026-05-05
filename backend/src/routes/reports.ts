import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateQuery } from '../middleware/validate';

const router = Router();
const dateRangeQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});
const asOfQuerySchema = z.object({
  asOf: z.string().date().optional()
});

router.use(authenticate);

// Trial Balance
router.get('/trial-balance', validateQuery(dateRangeQuerySchema), asyncHandler(async (req, res) => {
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

  entries.forEach((e: any) => {
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
}));

// Profit & Loss
router.get('/profit-loss', validateQuery(dateRangeQuerySchema), asyncHandler(async (req, res) => {
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

  entries.forEach((e: any) => {
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
}));

// Balance Sheet
router.get('/balance-sheet', validateQuery(asOfQuerySchema), asyncHandler(async (req, res) => {
  const asOf = req.query.asOf ? new Date(req.query.asOf as string) : new Date();

  const where: any = { date: { lte: asOf } };

  const entries = await prisma.journalEntry.findMany({
    where,
    include: { account: true }
  });

  const accountMap = new Map<string, { code: string; name: string; type: string; balance: number }>();

  entries.forEach((e: any) => {
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
}));

// Party Outstanding Report
router.get('/outstanding', asyncHandler(async (req, res) => {
  const parties = await prisma.party.findMany({ where: { isActive: true } });

  const outstanding = await Promise.all(
    parties.map(async (party: any) => {
      const entries = await prisma.journalEntry.findMany({
        where: { partyId: party.id }
      });

      let balance = 0;
      entries.forEach((e: any) => {
        balance += (e.debit || 0) - (e.credit || 0);
      });

      const daysDue = Math.floor((Date.now() - party.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return { partyId: party.id, partyName: party.name, partyType: party.type, balance, daysDue };
    })
  );

  res.json(outstanding);
}));

// Sales Report
router.get('/sales', validateQuery(dateRangeQuerySchema), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

let sales = await prisma.sale.findMany({
    where,
    include: { party: true, items: true }
  });

  // Log bad totals but include all
  const badThreshold = 1e10;
  const badSales = sales.filter((s: any) => !Number.isFinite(s.total) || s.total <= 0 || s.total >= badThreshold);
  if (badSales.length > 0) {
    console.warn(`Found ${badSales.length} questionable sales records:`, badSales.map((s: any) => ({id: s.id, total: s.total})));
  }

  const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
  const byCustomer = new Map<string, number>();

  sales.forEach((s: any) => {
    byCustomer.set(s.party.name, (byCustomer.get(s.party.name) || 0) + Number(s.total || 0));
  });

  res.json({
    totalSales,
    count: sales.length,
    totalRecords: sales.length,
    badRecords: badSales.length,
    byCustomer: Array.from(byCustomer.entries()).map(([name, amount]) => ({ name, amount }))
  });
}));

// Purchase Report
router.get('/purchases', validateQuery(dateRangeQuerySchema), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

let purchases = await prisma.purchase.findMany({
    where,
    include: { party: true, items: true }
  });

  // Log bad totals but include all
  const badThreshold = 1e10;
  const badPurchases = purchases.filter((p: any) => !Number.isFinite(p.total) || p.total <= 0 || p.total >= badThreshold);
  if (badPurchases.length > 0) {
    console.warn(`Found ${badPurchases.length} questionable purchase records:`, badPurchases.map((p: any) => ({id: p.id, total: p.total})));
  }

  const totalPurchases = purchases.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);
  const bySupplier = new Map<string, number>();

  purchases.forEach((p: any) => {
    bySupplier.set(p.party.name, (bySupplier.get(p.party.name) || 0) + Number(p.total || 0));
  });

  res.json({
    totalPurchases,
    totalRecords: purchases.length,
    badRecords: badPurchases.length,
    bySupplier: Array.from(bySupplier.entries()).map(([name, amount]) => ({ name, amount }))
  });
}));

export default router;
