import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const partySchema = z.object({
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']),
  name: z.string().min(2),
  contactPerson: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  ntn: z.string().nullable().optional(),
  openingBalance: z.number().optional(),
  openingBalanceType: z.enum(['DR', 'CR']).optional(),
  creditLimit: z.number().nonnegative().optional(),
  paymentTerms: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

router.use(authenticate);

router.get('/', asyncHandler(async (_req, res) => {
  const parties = await prisma.party.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json(parties);
}));

router.post('/', validateBody(partySchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create parties', 403);
  
  // Note: `validateBody(partySchema)` guarantees `type` and `name` at runtime.
  // We also shape `data` so Prisma sees `type` as non-optional at compile time.
  const data = req.body as z.infer<typeof partySchema>;

  const party = await prisma.party.create({
    data: {
      type: data.type,
      name: data.name,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      ntn: data.ntn ?? null,
      openingBalance: data.openingBalance ?? 0,
      openingBalanceType: data.openingBalanceType ?? 'DR',
      creditLimit: data.creditLimit ?? 0,
      paymentTerms: data.paymentTerms ?? null,
      notes: data.notes ?? null,
      isActive: true,
    }
  });
  res.status(201).json(party);
}));

router.put('/:id', validateBody(partySchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update parties', 403);
  
  const { id } = req.params;
  const data = req.body;
  const party = await prisma.party.update({
    where: { id },
    data
  });
  res.json(party);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role !== 'ADMIN') throw new AppError('Only admins can delete parties', 403);
  
  const { id } = req.params;
  await prisma.party.update({
    where: { id },
    data: { isActive: false }
  });
  res.status(204).send();
}));

export default router;
