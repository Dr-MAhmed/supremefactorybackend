import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import accountsRoutes from './routes/accounts';
import partiesRoutes from './routes/parties';
import purchasesRoutes from './routes/purchases';
import salesRoutes from './routes/sales';
import vouchersRoutes from './routes/vouchers';
import ledgerRoutes from './routes/ledger';
import dashboardRoutes from './routes/dashboard';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountsRoutes);
app.use('/api/v1/parties', partiesRoutes);
app.use('/api/v1/purchases', purchasesRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/vouchers', vouchersRoutes);
app.use('/api/v1/ledger', ledgerRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'supreme-cotton-backend' });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
