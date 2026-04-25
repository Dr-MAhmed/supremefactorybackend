import { Router } from 'express';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (_req, res) => {
  const parties = await prisma.party.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json(parties);
});

router.post('/', async (req, res) => {
  const data = req.body;
  const party = await prisma.party.create({ data: { ...data, isActive: true } });
  res.status(201).json(party);
});

export default router;
