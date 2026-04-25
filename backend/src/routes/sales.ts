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

  const sales = await prisma.sale.findMany({
    where,
    include: { party: true, items: true },
    orderBy: { date: 'desc' }
  });

  res.json(sales);
});

router.get('/:id', async (req, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: { party: true, items: true }
  });

  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  res.json(sale);
});

router.post('/', async (req, res) => {
  const { partyId, customerPo, salesperson, items, subtotal, discount, tax, total, dueDate, remarks } = req.body;
  const user = (req as any).user;

  const lastSale = await prisma.sale.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastSale ? parseInt(lastSale.invoiceNo.split('-')[2]) : 0;
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(5, '0')}`;

  const sale = await prisma.sale.create({
    data: {
      invoiceNo,
      date: new Date(),
      partyId,
      customerPo,
      salesperson,
      subtotal,
      discount,
      tax,
      total,
      receivedAmount: 0,
      paymentStatus: 'UNPAID',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      remarks,
      createdById: user.userId,
      items: { create: items }
    },
    include: { items: true }
  });

  res.status(201).json(sale);
});

router.patch('/:id', async (req, res) => {
  const { customerPo, salesperson, items, subtotal, discount, tax, total, dueDate, remarks } = req.body;

  const sale = await prisma.sale.update({
    where: { id: req.params.id },
    data: {
      customerPo,
      salesperson,
      subtotal,
      discount,
      tax,
      total,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      remarks,
      items: {
        deleteMany: {},
        create: items
      }
    },
    include: { items: true }
  });

  res.json(sale);
});

export default router;
