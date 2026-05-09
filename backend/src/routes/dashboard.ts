import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/summary', asyncHandler(async (req, res) => {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Total sales this month
  const totalSales = await prisma.sale.aggregate({
    _sum: { total: true },
    where: {
      date: {
        gte: currentMonth,
        lt: nextMonth
      }
    }
  });

  // Total purchases this month
  const totalPurchases = await prisma.purchase.aggregate({
    _sum: { total: true },
    where: {
      date: {
        gte: currentMonth,
        lt: nextMonth
      }
    }
  });

  // Receivable: sum of sales total - received
  const receivable = await prisma.sale.aggregate({
    _sum: {
      total: true,
      receivedAmount: true
    }
  });

  const totalReceivable = Number(receivable._sum.total || 0) - Number(receivable._sum.receivedAmount || 0);

  // Payable: sum of purchases total - paid
  const payable = await prisma.purchase.aggregate({
    _sum: {
      total: true,
      paidAmount: true
    }
  });

  const totalPayable = Number(payable._sum.total || 0) - Number(payable._sum.paidAmount || 0);

  // Net profit: sales - purchases this month
  const netProfit = Number(totalSales._sum.total || 0) - Number(totalPurchases._sum.total || 0);

  // Cash in hand: assume from journal entries to cash account
  const cashAccount = await prisma.account.findFirst({ where: { name: { contains: 'Cash' } } });
  let cashBalance = 0;
  if (cashAccount) {
    const cashDebits = await prisma.journalEntry.aggregate({
      _sum: { debit: true },
      where: { accountId: cashAccount.id }
    });
    const cashCredits = await prisma.journalEntry.aggregate({
      _sum: { credit: true },
      where: { accountId: cashAccount.id }
    });
    cashBalance = Number(cashDebits._sum.debit || 0) - Number(cashCredits._sum.credit || 0);
  }

  // Recent transactions: last 10 journal entries
  const recentTransactions = await prisma.journalEntry.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { account: true, party: true }
  });

  // Top customers: sales by party
  const topCustomersData = await prisma.sale.groupBy({
    by: ['partyId'],
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5,
  });

  const partyIds = topCustomersData.map((c: typeof topCustomersData[0]) => c.partyId).filter(Boolean);
  const parties = await prisma.party.findMany({
    where: { id: { in: partyIds } },
    select: { id: true, name: true }
  });
  const partyMap = new Map(parties.map((p: typeof parties[0]) => [p.id, p.name]));

  const topCustomers = topCustomersData.map((c: typeof topCustomersData[0]) => ({
    name: partyMap.get(c.partyId!) || 'Unknown',
    total: Number(c._sum.total || 0)
  }));

  res.json({
    totalSales: Number(totalSales._sum.total || 0),
    totalPurchases: Number(totalPurchases._sum.total || 0),
    totalReceivable,
    totalPayable,
    netProfit,
    cashInHand: cashBalance,
    recentTransactions: recentTransactions.map((t: typeof recentTransactions[0]) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      account: t.account.name,
      party: t.party?.name
    })),
    topCustomers: topCustomers.map((c: typeof topCustomers[0]) => ({
      name: c.name,
      total: c.total
    }))
  });
}));

export default router;