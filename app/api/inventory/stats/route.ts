import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all marbles with their stock entries
    const marbles = await prisma.marble.findMany({
      include: {
        stockEntries: true,
      },
    });

    // Calculate stats from stock entries
    let totalQuantity = 0;
    let totalInventoryValue = 0;
    const statusCounts = {
      'In Stock': 0,
      'Low Stock': 0,
      'Out of Stock': 0,
    };

    for (const marble of marbles) {
      // Calculate total quantity from stock entries
      const marbleQuantity = marble.stockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      totalQuantity += marbleQuantity;

      // Calculate inventory value using cost prices
      if (marble.shadeAA && marble.costPriceAA) {
        const shadeQuantity = marble.stockEntries
          .filter(e => e.shade === 'AA')
          .reduce((sum, e) => sum + e.quantity, 0);
        totalInventoryValue += shadeQuantity * marble.costPriceAA;
      }
      if (marble.shadeA && marble.costPriceA) {
        const shadeQuantity = marble.stockEntries
          .filter(e => e.shade === 'A')
          .reduce((sum, e) => sum + e.quantity, 0);
        totalInventoryValue += shadeQuantity * marble.costPriceA;
      }
      if (marble.shadeB && marble.costPriceB) {
        const shadeQuantity = marble.stockEntries
          .filter(e => e.shade === 'B')
          .reduce((sum, e) => sum + e.quantity, 0);
        totalInventoryValue += shadeQuantity * marble.costPriceB;
      }
      if (marble.shadeBMinus && marble.costPriceBMinus) {
        const shadeQuantity = marble.stockEntries
          .filter(e => e.shade === 'B-')
          .reduce((sum, e) => sum + e.quantity, 0);
        totalInventoryValue += shadeQuantity * marble.costPriceBMinus;
      }

      // Count status
      if (marble.status in statusCounts) {
        statusCounts[marble.status as keyof typeof statusCounts]++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalItems: marbles.length,
        totalQuantity,
        lowStockCount: statusCounts['Low Stock'],
        outOfStockCount: statusCounts['Out of Stock'],
        totalInventoryValue,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
