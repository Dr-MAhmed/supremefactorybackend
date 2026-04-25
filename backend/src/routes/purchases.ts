import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const { partyId, status, startDate, endDate } = req.query;
  const where: any = {};

  if (partyId) where.partyId = partyId as string;
  if (status) where.paymentStatus = status as string;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { party: true, items: true },
    orderBy: { date: 'desc' }
  });

  res.json(purchases);
});

router.get('/:id', async (req, res) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: req.params.id },
    include: { party: true, items: true }
  });

  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
  res.json(purchase);
});

router.post('/', async (req, res) => {
  const { partyId, supplierInvoiceNo, items, subtotal, discount, tax, total, remarks } = req.body;
  const user = (req as any).user;

  const lastPurchase = await prisma.purchase.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastPurchase ? parseInt(lastPurchase.voucherNo.split('-')[2]) : 0;
  const voucherNo = `PUR-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const purchase = await prisma.purchase.create({
    data: {
      voucherNo,
      date: new Date(),
      partyId,
      supplierInvoiceNo,
      subtotal,
      discount,
      tax,
      total,
      paidAmount: 0,
      paymentStatus: 'UNPAID',
      remarks,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true }
  });

  res.status(201).json(purchase);
});

router.patch('/:id', async (req, res) => {
  const { supplierInvoiceNo, items, subtotal, discount, tax, total, remarks } = req.body;

  const purchase = await prisma.purchase.update({
    where: { id: req.params.id },
    data: {
      supplierInvoiceNo,
      subtotal,
      discount,
      tax,
      total,
      remarks,
      items: {
        deleteMany: {},
        create: items
      }
    },
    include: { items: true }
  });

  res.json(purchase);
});

export default router;
