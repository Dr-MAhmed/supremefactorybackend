import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const accountSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().nullable().optional()
});

router.use(authenticate);

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const accounts = await prisma.account.findMany({ orderBy: { code: 'asc' } });
  res.json(accounts);
}));

router.post('/', validateBody(accountSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot create accounts', 403);
  
  const { code, name, type, parentId } = req.body;
  const account = await prisma.account.create({
    data: { code, name, type, parentId: parentId || null, isActive: true }
  });
  res.status(201).json(account);
}));

router.put('/:id', validateBody(accountSchema.partial()), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot update accounts', 403);
  
  const { id } = req.params;
  const { code, name, type, parentId } = req.body;
  const account = await prisma.account.update({
    where: { id },
    data: { code, name, type, parentId: parentId || null }
  });
  res.json(account);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role !== 'ADMIN') throw new AppError('Only admins can delete accounts', 403);

  const { id } = req.params;
  await prisma.account.update({
    where: { id },
    data: { isActive: false }
  });
  res.status(204).send();
}));

router.patch('/:id/status', validateBody(z.object({
  isActive: z.boolean()
})), asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) throw new AppError('Unauthorized', 401);
  if (user.role === 'VIEWER') throw new AppError('Viewers cannot change account status', 403);

  const { id } = req.params;
  const { isActive } = req.body;

  const account = await prisma.account.update({
    where: { id },
    data: { isActive }
  });

  res.json(account);
}));

export default router;
