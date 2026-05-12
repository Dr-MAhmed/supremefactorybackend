import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.journalEntry.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.party.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companySetting.deleteMany();

  const passwordHash = await bcrypt.hash('Password123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@supremecotton.com',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const accountantHash = await bcrypt.hash('Accountant123', 12);
  await prisma.user.create({
    data: {
      name: 'Accountant User',
      email: 'accountant@supremecotton.com',
      passwordHash: accountantHash,
      role: 'ACCOUNTANT'
    }
  });

  const viewerHash = await bcrypt.hash('Viewer123', 12);
  await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@supremecotton.com',
      passwordHash: viewerHash,
      role: 'VIEWER'
    }
  });

  await prisma.companySetting.create({
    data: {
      companyName: 'Supreme Cotton',
      address: 'Faisalabad, Pakistan',
      phone: '+92 41 1234567',
      email: 'info@supremecotton.com',
      ntn: '1234567-8',
      financialYearStart: new Date('2025-07-01'),
      invoiceTerms: 'Due within 30 days'
    }
  });

  const cash = await prisma.account.create({ data: { code: '1001', name: 'Cash', type: 'ASSET', isActive: true } });
  const bank = await prisma.account.create({ data: { code: '1002', name: 'Bank', type: 'ASSET', isActive: true } });
  const ar = await prisma.account.create({ data: { code: '1101', name: 'Accounts Receivable', type: 'ASSET', isActive: true } });
  const ap = await prisma.account.create({ data: { code: '2001', name: 'Accounts Payable', type: 'LIABILITY', isActive: true } });
  const sales = await prisma.account.create({ data: { code: '4001', name: 'Sales Revenue', type: 'REVENUE', isActive: true } });
  const purchases = await prisma.account.create({ data: { code: '5001', name: 'Purchase Cost', type: 'EXPENSE', isActive: true } });

  const customers = await Promise.all([
    prisma.party.create({ data: { type: 'CUSTOMER', name: 'Faisal Traders', contactPerson: 'Ali Khan', phone: '+92 300 1112233', city: 'Faisalabad', openingBalance: 0, openingBalanceType: 'DR', creditLimit: 250000, paymentTerms: 'Net 30', notes: 'Top customer' } }),
    prisma.party.create({ data: { type: 'CUSTOMER', name: 'Textile Hub', contactPerson: 'Sara Ahmad', phone: '+92 301 2223344', city: 'Lahore', openingBalance: 0, openingBalanceType: 'DR', creditLimit: 180000, paymentTerms: 'Net 30' } }),
    prisma.party.create({ data: { type: 'CUSTOMER', name: 'Cotton World', contactPerson: 'Hamid Raza', phone: '+92 333 5556677', city: 'Karachi', openingBalance: 0, openingBalanceType: 'DR', creditLimit: 150000, paymentTerms: 'Net 45' } })
  ]);

  const suppliers = await Promise.all([
    prisma.party.create({ data: { type: 'SUPPLIER', name: 'Khan Cotton Mills', contactPerson: 'Usman Khan', phone: '+92 304 1234567', city: 'Gujranwala', openingBalance: 0, openingBalanceType: 'CR', notes: 'Primary cotton supplier' } }),
    prisma.party.create({ data: { type: 'SUPPLIER', name: 'Punjab Traders', contactPerson: 'Naveed Malik', phone: '+92 305 9876543', city: 'Sialkot', openingBalance: 0, openingBalanceType: 'CR' } }),
    prisma.party.create({ data: { type: 'BOTH', name: 'Awan Enterprises', contactPerson: 'Ayesha Awan', phone: '+92 306 5566778', city: 'Islamabad', openingBalance: 0, openingBalanceType: 'DR' } })
  ]);

  await prisma.purchase.create({
    data: {
      voucherNo: 'PUR-2025-00001',
      date: new Date(),
      partyId: suppliers[0].id,
      supplierInvoiceNo: 'SC-PI-001',
      subtotal: 50000,
      discount: 0,
      tax: 9000,
      total: 59000,
      paidAmount: 20000,
      paymentStatus: 'PARTIAL',
      remarks: 'Cotton bale purchase',
      createdById: admin.id,
      items: {
        create: [{ description: 'Cotton bales', quantity: 20, unit: 'bales', rate: 2500, amount: 50000 }]
      }
    }
  });

  await prisma.sale.create({
    data: {
      invoiceNo: 'INV-2025-00001',
      date: new Date(),
      partyId: customers[0].id,
      customerPo: 'PO-101',
      salesperson: 'Raza',
      subtotal: 42000,
      discount: 0,
      tax: 7560,
      total: 49560,
      receivedAmount: 25000,
      paymentStatus: 'PARTIAL',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      remarks: 'Yarn delivery',
      createdById: admin.id,
      items: {
        create: [{ description: 'Cotton yarn', quantity: 10, unit: 'rolls', rate: 4200, amount: 42000 }]
      }
    }
  });

  await prisma.purchase.create({
    data: {
      voucherNo: 'PUR-2025-00002',
      date: new Date(),
      partyId: suppliers[1].id,
      supplierInvoiceNo: 'SC-PI-002',
      subtotal: 32000,
      discount: 0,
      tax: 5760,
      total: 37760,
      paidAmount: 37760,
      paymentStatus: 'PAID',
      remarks: 'Accessories purchase',
      createdById: admin.id,
      items: {
        create: [{ description: 'Spinning accessories', quantity: 16, unit: 'pcs', rate: 2000, amount: 32000 }]
      }
    }
  });

  console.log('Seed data created.');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
