import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';

const router = Router();
const accountSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().nullable().optional()
});

router.use(authenticate);

router.get('/', asyncHandler(async (_req, res) => {
  const accounts = await prisma.account.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
  res.json(accounts);
}));

router.post('/', validateBody(accountSchema), asyncHandler(async (req, res) => {
  const { code, name, type, parentId } = req.body;
  const account = await prisma.account.create({
    data: { code, name, type, parentId: parentId || null, isActive: true }
  });
  res.status(201).json(account);
}));

export default router;
