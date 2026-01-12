import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearMarbleData() {
  try {
    console.log('Starting to clear Marble and StockTransaction tables...');

    // First, delete all StockTransaction records (they have foreign key to Marble)
    console.log('Deleting StockTransaction records...');
    const deletedTransactions = await prisma.stockTransaction.deleteMany({});
    console.log(`Deleted ${deletedTransactions.count} StockTransaction records`);

    // Then, delete all Marble records
    console.log('Deleting Marble records...');
    const deletedMarbles = await prisma.marble.deleteMany({});
    console.log(`Deleted ${deletedMarbles.count} Marble records`);

    console.log('✅ Successfully cleared all Marble and StockTransaction data!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearMarbleData();
