import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import accountsRoutes from './routes/accounts';
import partiesRoutes from './routes/parties';
import purchasesRoutes from './routes/purchases';
import salesRoutes from './routes/sales';
import purchaseReturnsRoutes from './routes/purchaseReturns';
import saleReturnsRoutes from './routes/saleReturns';
import vouchersRoutes from './routes/vouchers';
import ledgerRoutes from './routes/ledger';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import { errorHandler, notFoundHandler } from './middleware/errorHandler'; 

const app = express();

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://supremefactory.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.options('*', (_req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://supremefactory.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ['https://supremefactory.vercel.app', 'http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please wait a few minutes and try again.'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please wait a few minutes and try again.'
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1', apiLimiter);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/parties', partiesRoutes);
app.use('/api/v1/purchases', purchasesRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/purchase-returns', purchaseReturnsRoutes);
app.use('/api/v1/sale-returns', saleReturnsRoutes);
app.use('/api/v1/vouchers', vouchersRoutes);
app.use('/api/v1/ledger', ledgerRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportsRoutes);

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'supreme-cotton-backend' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
