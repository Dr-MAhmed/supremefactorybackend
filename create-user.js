const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  try {
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

    console.log('Done!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();