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

router.post('/login', validateBody(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_REFRESH_SECRET!, 
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return res.json({ 
      accessToken, 
      refreshToken, 
      user: userWithoutPassword 
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Login error:', error);
    throw new AppError('Authentication failed', 500);
  }
}));


const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

router.post('/refresh', validateBody(refreshSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ 
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '15m' }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_REFRESH_SECRET!, 
      { expiresIn: '7d' }
    );

    return res.json({ 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken, 
      user 
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Refresh error:', error);
    throw new AppError('Invalid or expired refresh token', 401);
  }
}));

export default router;
