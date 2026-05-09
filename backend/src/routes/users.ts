import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';


const router = Router();

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'VIEWER']).default('ACCOUNTANT')
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'VIEWER']).optional(),
  isActive: z.boolean().optional()
});

router.use(authenticate);

// POST /users/change-password - Change current user's password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

// POST /users/change-password - Change current user's password
router.post('/change-password', validateBody(changePasswordSchema), asyncHandler(async (req: AuthRequest, res) => {
  const authUser = (req as AuthRequest).user;
  if (!authUser) return res.status(401).json({ message: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;

  const currentUser = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, passwordHash: true, isActive: true }
  });

  if (!currentUser || !currentUser.isActive) {
    throw new AppError('Unauthorized', 401);
  }

  const valid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { passwordHash }
  });

  res.json({ message: 'Password updated successfully' });
}));

// GET /users - List all users (admin only)
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'ADMIN') throw new AppError('Only admins can view users', 403);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(users);
}));

// POST /users - Create new user (admin only)
router.post('/', asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'ADMIN') throw new AppError('Only admins can create users', 403);

  const { name, email, password, role } = createUserSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  res.status(201).json(newUser);
}));

// GET /users/:id - Get user details
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const targetUser = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true
    }
  });

  if (!targetUser) throw new AppError('User not found', 404);

  // Only admins or the user themselves can view details
  if (user.role !== 'ADMIN' && user.userId !== req.params.id) {
    throw new AppError('You can only view your own details', 403);
  }

  res.json(targetUser);
}));

// PATCH /users/:id - Update user
router.patch('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  // Only admins or the user themselves can update
  if (user.role !== 'ADMIN' && user.userId !== req.params.id) {
    throw new AppError('You can only update your own details', 403);
  }

  const data = updateUserSchema.parse(req.body);
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser && existingUser.id !== req.params.id) {
      throw new AppError('Email already in use', 409);
    }
    updateData.email = data.email;
  }
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
  }
  
  // Only admins can change role or isActive status
  if (user.role === 'ADMIN') {
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  res.json(updatedUser);
}));

// POST /users/change-password - Change current user's password
router.post('/change-password', validateBody(changePasswordSchema), asyncHandler(async (req: AuthRequest, res) => {
  const authUser = (req as AuthRequest).user;
  if (!authUser) return res.status(401).json({ message: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;

  const currentUser = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, passwordHash: true, isActive: true }
  });

  if (!currentUser || !currentUser.isActive) {
    throw new AppError('Unauthorized', 401);
  }

  const valid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { passwordHash }
  });

  res.json({ message: 'Password updated successfully' });
}));

// DELETE /users/:id - Deactivate user (admin only)
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {

  const user = (req as AuthRequest).user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'ADMIN') throw new AppError('Only admins can delete users', 403);

  // Prevent deleting self
  if (user.userId === req.params.id) {
    throw new AppError('You cannot deactivate yourself', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  res.json(updatedUser);
}));

export default router;
