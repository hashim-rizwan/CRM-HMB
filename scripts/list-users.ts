import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n📋 Users in Database:\n');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Department: ${user.department || 'N/A'}`);
        console.log(`   Joined: ${user.joinedDate.toLocaleString()}`);
        console.log(`   Last Active: ${user.lastActive.toLocaleString()}`);
        console.log('-'.repeat(80));
      });
    }
    
    console.log(`\n✅ Total users: ${users.length}\n`);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

