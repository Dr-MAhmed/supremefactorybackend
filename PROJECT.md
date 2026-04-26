# Supreme Cotton — Complete Project Documentation

## 📋 Project Overview

**Supreme Cotton** is a comprehensive full-stack accounting and ledger management system designed specifically for textile trading operations. It provides a complete solution for managing financial transactions, inventory, parties (customers/suppliers), and generating detailed financial reports.

### 🎯 Key Features

- **Double-Entry Bookkeeping**: Complete accounting system with proper debit/credit entries
- **Multi-User Support**: Role-based access (ADMIN, ACCOUNTANT, VIEWER)
- **Progressive Web App**: Installable PWA with offline capabilities
- **Real-time Reports**: Trial Balance, Profit & Loss, Balance Sheet, and more
- **Inventory Management**: Purchase/Sales with automatic journal entries
- **Party Management**: Customer and supplier management with credit limits
- **Voucher System**: Payment, Receipt, and Journal vouchers
- **Responsive Design**: Works on desktop, tablet, and mobile devices

---

## 🏗️ Architecture & Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Caching**: Redis for session management
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, Rate limiting, bcrypt password hashing

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + React Query
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **PWA**: Vite PWA plugin with service worker

### Database Schema

#### Core Entities

**Users**
- Multi-role system (ADMIN, ACCOUNTANT, VIEWER)
- Secure password hashing with bcrypt
- Login tracking

**Accounts (Chart of Accounts)**
- Hierarchical structure (parent-child relationships)
- Account types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- Unique account codes

**Parties (Customers/Suppliers)**
- Types: CUSTOMER, SUPPLIER, BOTH
- Contact information, credit limits, payment terms
- Opening balances

**Transactions**
- **Purchases**: Supplier invoices with items
- **Sales**: Customer invoices with items
- **Purchase Returns**: Return vouchers
- **Sale Returns**: Credit notes
- **Payment Vouchers**: Supplier payments
- **Receipt Vouchers**: Customer receipts
- **Journal Vouchers**: General entries

**Journal Entries**
- Auto-generated double-entry bookkeeping
- Links to all transactions
- Running balance calculations

**Company Settings**
- Company information, logo, NTN
- Financial year configuration
- Invoice terms and conditions

---

## 📁 Project Structure

```
supremefactory/
├── backend/                          # Node.js API Server
│   ├── src/
│   │   ├── app.ts                    # Express app setup
│   │   ├── index.ts                  # Server entry point
│   │   ├── prisma.ts                 # Database client
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT authentication middleware
│   │   │   ├── errorHandler.ts      # Global error handling
│   │   │   └── validate.ts          # Request validation
│   │   └── routes/                  # API route handlers
│   │       ├── accounts.ts          # Account management
│   │       ├── auth.ts              # Authentication
│   │       ├── dashboard.ts         # Dashboard data
│   │       ├── ledger.ts            # Ledger reports
│   │       ├── parties.ts           # Customer/Supplier management
│   │       ├── purchases.ts         # Purchase transactions
│   │       ├── reports.ts           # Financial reports
│   │       ├── sales.ts              # Sales transactions
│   │       └── vouchers.ts          # Payment/Receipt/Journal vouchers
│   ├── Dockerfile                   # Backend container config
│   ├── package.json                 # Dependencies & scripts
│   └── tsconfig.json                # TypeScript config
├── frontend/                         # React PWA Frontend
│   ├── src/
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # React entry point
│   │   ├── components/
│   │   │   ├── AuthContext.tsx      # Authentication state management
│   │   │   ├── Layout.tsx           # Main layout with navigation
│   │   │   └── ToastProvider.tsx    # Notification system
│   │   ├── lib/
│   │   │   └── api.ts               # API client configuration
│   │   └── pages/                   # Page components
│   │       ├── Accounts.tsx         # Chart of accounts
│   │       ├── Dashboard.tsx        # Main dashboard
│   │       ├── Ledger.tsx           # Transaction ledger
│   │       ├── Login.tsx            # Authentication
│   │       ├── Parties.tsx          # Party management
│   │       ├── Purchases.tsx        # Purchase management
│   │       ├── Reports.tsx          # Financial reports
│   │       ├── Sales.tsx            # Sales management
│   │       ├── Settings.tsx         # Company settings
│   │       └── Vouchers.tsx         # Voucher management
│   ├── public/
│   │   └── manifest.webmanifest     # PWA manifest
│   ├── Dockerfile                   # Frontend container config
│   ├── package.json                 # Dependencies & scripts
│   ├── tailwind.config.cjs          # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite build config
│   └── index.html                   # HTML template
├── database/                         # Database Configuration
│   ├── schema.prisma                # Prisma database schema
│   ├── seed.ts                      # Database seeding script
│   └── migrations/                  # Database migrations
├── docker-compose.yml               # Multi-container setup
├── .env.example                     # Environment variables template
├── DEVELOPMENT.md                   # Development checklist
└── README.md                        # Basic setup instructions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (with npm)
- **Docker & Docker Compose** (for full setup)
- **PostgreSQL** (if running without Docker)
- **Redis** (if running without Docker)

### Quick Start with Docker (Recommended)

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd supremefactory
   cp .env.example .env
   ```

2. **Edit `.env` file**:
   ```env
   # Backend settings
   BACKEND_PORT=5000
   DATABASE_URL="postgresql://supreme:SupremePass123@postgres:5432/supremecotton?schema=public"
   REDIS_URL="redis://redis:6379"
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
   BCRYPT_SALT_ROUNDS=12
   NODE_ENV=development

   # Frontend settings
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```

3. **Start all services**:
   ```bash
   docker compose up --build
   ```

4. **Access the application**:
   - **Frontend**: http://localhost:4173
   - **Backend API**: http://localhost:5000
   - **Database**: localhost:5432
   - **Redis**: localhost:6379

### Manual Development Setup

#### Backend Setup
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Database Setup (without Docker)
```bash
# Install PostgreSQL and Redis locally
# Create database: supremecotton
# Update DATABASE_URL in .env to point to local PostgreSQL
```

---

## 🔐 Authentication & Security

### JWT Token System
- **Access Token**: 15-minute expiry for API requests
- **Refresh Token**: 7-day expiry for token renewal
- **Secure Storage**: HTTP-only cookies (production) / localStorage (development)

### User Roles
- **ADMIN**: Full system access
- **ACCOUNTANT**: Transaction and report access
- **VIEWER**: Read-only access to reports

### Security Features
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod schemas

---

## 📊 API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@supremecotton.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@supremecotton.com",
    "role": "ADMIN"
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

### Core Business Endpoints

#### Accounts
- `GET /accounts` - List all accounts
- `POST /accounts` - Create new account
- `GET /accounts/:id` - Get account details
- `PATCH /accounts/:id` - Update account
- `DELETE /accounts/:id` - Deactivate account

#### Parties
- `GET /parties` - List customers/suppliers
- `POST /parties` - Create new party
- `GET /parties/:id` - Get party details
- `PATCH /parties/:id` - Update party
- `DELETE /parties/:id` - Deactivate party

#### Transactions
- `GET /purchases` - List purchase transactions
- `POST /purchases` - Create purchase
- `GET /sales` - List sales transactions
- `POST /sales` - Create sales invoice

#### Vouchers
- `GET /vouchers/payment` - List payment vouchers
- `POST /vouchers/payment` - Create payment voucher
- `GET /vouchers/receipt` - List receipt vouchers
- `POST /vouchers/receipt` - Create receipt voucher
- `GET /vouchers/journal` - List journal vouchers
- `POST /vouchers/journal` - Create journal voucher

#### Reports
- `GET /reports/trial-balance` - Trial balance report
- `GET /reports/profit-loss` - Profit & Loss statement
- `GET /reports/balance-sheet` - Balance sheet
- `GET /reports/outstanding` - Customer/supplier outstanding
- `GET /reports/sales` - Sales summary by customer
- `GET /reports/purchases` - Purchase summary by supplier

#### Ledger
- `GET /ledger/account/:accountId` - Account-wise transactions
- `GET /ledger/party/:partyId` - Party-wise transactions

---

## 🎨 Frontend Features

### Pages & Functionality

#### Dashboard
- Financial summary cards (Total Sales, Purchases, Outstanding, etc.)
- Recent transactions table
- Top customers and suppliers
- Monthly sales/purchase charts

#### Chart of Accounts
- Hierarchical account structure
- Create/edit accounts by type
- Account code generation
- Parent-child relationships

#### Party Management
- Customer and supplier CRUD operations
- Contact information management
- Credit limit and payment terms
- Opening balance setup

#### Transaction Management
- **Purchases**: Create purchase orders with items
- **Sales**: Generate invoices with due dates
- **Returns**: Purchase and sales return processing
- Automatic journal entry creation

#### Voucher System
- **Payment Vouchers**: Supplier payments (Cash/Cheque/Bank)
- **Receipt Vouchers**: Customer receipts
- **Journal Vouchers**: General accounting entries
- Auto-generated sequential voucher numbers

#### Reports
- **Trial Balance**: All accounts with balances
- **Profit & Loss**: Revenue vs Expenses
- **Balance Sheet**: Assets, Liabilities, Equity
- **Outstanding Report**: Customer/Supplier balances
- **Sales Report**: By customer with totals
- **Purchase Report**: By supplier with totals

#### Settings
- Company information management
- Logo upload and NTN settings
- Financial year configuration
- Invoice terms and conditions

### UI/UX Features
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Professional color scheme (Navy #1a3c5e + Gold #c9a227)
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeleton loaders and spinners
- **Form Validation**: Real-time validation with error messages
- **Data Tables**: Sortable, filterable, paginated tables
- **Modal Dialogs**: Clean modal interfaces for forms

---

## 🗄️ Database Schema Details

### Key Relationships

```
Users
├── Creates → Purchases, Sales, Vouchers, Returns
└── Manages → All transaction types

Accounts (Hierarchical)
├── Parent-Child relationships
└── Linked to → Journal Entries

Parties (Customers/Suppliers)
├── Have → Opening balances
├── Make → Purchases (as suppliers)
├── Receive → Sales (as customers)
└── Receive/Pay → Vouchers

Transactions Flow:
Purchases/Sales → Auto-create Journal Entries
Vouchers → Create Journal Entries
Returns → Reverse Journal Entries
```

### Auto-Generated Fields
- **Voucher Numbers**: Sequential numbering (PUR-001, SAL-001, etc.)
- **Journal Entries**: Automatic double-entry bookkeeping
- **Running Balances**: Calculated on-the-fly for ledgers
- **Payment Status**: Auto-updated based on payments received

---

## 🔧 Development Workflow

### Database Operations
```bash
# Generate Prisma client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Reset database (development only)
npm run prisma:reset

# Seed with sample data
npm run seed

# View database
npm run prisma:studio
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting (if configured)
- **Prettier**: Code formatting (if configured)
- **Zod**: Runtime type validation

### Testing
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing

---

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-host:5432/db"
REDIS_URL="redis://prod-redis:6379"
JWT_SECRET=strong_production_secret
JWT_REFRESH_SECRET=strong_production_refresh_secret
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Docker Production Build
```bash
# Build for production
docker compose -f docker-compose.prod.yml up --build
```

### PWA Deployment
- Service worker automatically caches assets
- Installable on mobile devices
- Offline-capable for basic viewing

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs supremefactory-postgres-1

# Reset database
cd backend
npm run prisma:reset
npm run seed
```

#### Authentication Problems
- Check JWT secrets in `.env`
- Verify token expiry times
- Clear browser localStorage/cookies

#### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

#### PWA Issues
- Clear service worker cache in browser dev tools
- Check manifest.json configuration
- Verify HTTPS in production

---

## 📈 Future Enhancements

### Planned Features
- **Multi-Company Support**: Multiple business entities
- **Inventory Tracking**: Stock levels and reorder points
- **Email Notifications**: Invoice/payment reminders
- **API Documentation**: Swagger/OpenAPI specs
- **Backup & Restore**: Database backup utilities
- **Audit Trail**: Complete transaction history
- **Multi-Currency**: Foreign currency transactions
- **Tax Reports**: GST/Sales tax calculations
- **Bank Reconciliation**: Bank statement import
- **Recurring Transactions**: Automated entries

### Technical Improvements
- **GraphQL API**: More flexible data fetching
- **Real-time Updates**: WebSocket notifications
- **Advanced Caching**: Redis caching strategies
- **File Uploads**: Document attachment support
- **API Rate Limiting**: Advanced throttling
- **Logging**: Structured logging with Winston
- **Monitoring**: Application performance monitoring

---

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use Zod for all data validation
3. Implement proper error handling
4. Write descriptive commit messages
5. Test all new features
6. Update documentation

### Code Style
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Imports**: Group by external libraries, then internal modules
- **Error Handling**: Try-catch with proper error messages
- **State Management**: React Context for global state, local state for components

---

## 📄 License

This project is proprietary software for Supreme Cotton textile trading operations.

---

## 📞 Support

For technical support or feature requests, please contact the development team.

---

*Last updated: April 27, 2026*
*Version: 1.0.0*</content>
<parameter name="filePath">c:\Users\Muhammad Ahmed\Desktop\projects\supremefactory\PROJECT.md