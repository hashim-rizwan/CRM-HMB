import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const marbles = await prisma.marble.findMany();

    const totalItems = marbles.length;
    const totalQuantity = marbles.reduce((sum, m) => sum + m.quantity, 0);
    const lowStockCount = marbles.filter((m) => m.status === 'Low Stock').length;
    const outOfStockCount = marbles.filter((m) => m.status === 'Out of Stock').length;
    const totalInventoryValue = marbles.reduce(
      (sum, m) => sum + (m.quantity * (m.costPrice || 0)),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalItems,
        totalQuantity,
        lowStockCount,
        outOfStockCount,
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

