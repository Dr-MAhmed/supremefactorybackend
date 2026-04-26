import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';

const router = Router();
const partySchema = z.object({
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']),
  name: z.string().min(2),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  city: z.string().nullable().optional(),
  creditLimit: z.number().nonnegative().optional(),
  openingBalance: z.number().optional(),
  address: z.string().nullable().optional(),
  remarks: z.string().nullable().optional()
});

router.use(authenticate);

router.get('/', asyncHandler(async (_req, res) => {
  const parties = await prisma.party.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json(parties);
}));

router.post('/', validateBody(partySchema), asyncHandler(async (req, res) => {
  const data = req.body as z.infer<typeof partySchema>;
  const party = await prisma.party.create({ data: { ...data, isActive: true } });
  res.status(201).json(party);
}));

export default router;
