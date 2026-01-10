import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    // Create a default admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: 'admin123', // In production, hash this password!
        fullName: 'Administrator',
        email: 'admin@marblefactory.com',
        role: 'Admin',
        status: 'Active',
        department: 'Management',
      },
    });

    console.log('✅ Default admin user created:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





