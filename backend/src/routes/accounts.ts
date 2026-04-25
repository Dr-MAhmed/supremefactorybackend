import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (_req, res) => {
  const accounts = await prisma.account.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  res.json(accounts);
});

router.post('/', async (req, res) => {
  const { code, name, type, parentId } = req.body;
  const account = await prisma.account.create({
    data: { code, name, type, parentId: parentId || null, isActive: true }
  });
  res.status(201).json(account);
});

export default router;
