import("file:///C:/Users/Muhammad Ahmed/Desktop/projects/supremefactory/backend/node_modules/.prisma/client").then(async ({ PrismaClient }) => {
  const prisma = new PrismaClient();
  
  const bcrypt = await import('bcryptjs');
  
  try {
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
    console.log('Created admin user:', admin.email);

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

    console.log('Seed data created.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
});