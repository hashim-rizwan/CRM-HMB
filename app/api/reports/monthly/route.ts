import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get all stock transactions for the specified month
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const transactions = await prisma.stockTransaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        marble: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate monthly data (grouped by month)
    const monthlyData = [];
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonthIndex - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      monthlyData.push({
        month: monthName,
        added: Math.floor(Math.random() * 2000) + 2000, // Placeholder - calculate from transactions
        removed: Math.floor(Math.random() * 2000) + 2000,
        net: 0,
      });
    }

    // Calculate usage by type
    const usageByTypeMap = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction.type === 'OUT') {
        const type = transaction.marble.marbleType;
        usageByTypeMap.set(type, (usageByTypeMap.get(type) || 0) + transaction.quantity);
      }
    });

    const totalUsage = Array.from(usageByTypeMap.values()).reduce((sum, val) => sum + val, 0);
    const usageByType = Array.from(usageByTypeMap.entries())
      .map(([type, usage]) => ({
        type,
        usage: Math.round(usage),
        percentage: totalUsage > 0 ? Math.round((usage / totalUsage) * 100) : 0,
      }))
      .sort((a, b) => b.usage - a.usage);

    // Calculate trend data (inventory levels over time)
    const trendData = [];
    const marbles = await prisma.marble.findMany({
      include: {
        stockEntries: true,
      },
    });
    const totalInventory = marbles.reduce((sum, m) => 
      sum + m.stockEntries.reduce((entrySum, e) => entrySum + e.quantity, 0), 0
    );
    
    for (let i = 0; i < 6; i++) {
      trendData.push({
        month: months[(currentMonthIndex - 5 + i + 12) % 12],
        inventory: Math.round(totalInventory * (0.8 + Math.random() * 0.2)), // Placeholder
      });
    }

    return NextResponse.json({
      success: true,
      monthlyData,
      usageByType,
      trendData,
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly report' },
      { status: 500 }
    );
  }
}

