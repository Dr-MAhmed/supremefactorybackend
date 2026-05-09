import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '15m'
  });
  const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh', {
    expiresIn: '7d'
  });

  // Update last login on successful authentication
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  return res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));


const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

router.post('/refresh', validateBody(refreshSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh') as any;
    const user = await prisma.user.findUnique({ 
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '15m' }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_REFRESH_SECRET || 'refresh', 
      { expiresIn: '7d' }
    );

    return res.json({ 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}));

export default router;
