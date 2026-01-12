import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all marble types with their active shades and stock entries
    const marbles = await prisma.marble.findMany({
      include: {
        stockEntries: true,
      },
      orderBy: {
        marbleType: 'asc',
      },
    });

    // Group by marble type and get available shades (those with stock > 0)
    const marbleTypesMap = new Map<string, Set<string>>();
    
    for (const marble of marbles) {
      // Get shades that have stock
      const shadesWithStock = new Set<string>();
      
      // Group stock entries by shade
      const shadeStockMap = new Map<string, number>();
      for (const entry of marble.stockEntries) {
        const current = shadeStockMap.get(entry.shade) || 0;
        shadeStockMap.set(entry.shade, current + entry.quantity);
      }

      // Check which shades have stock > 0
      for (const [shade, quantity] of shadeStockMap.entries()) {
        if (quantity > 0) {
          shadesWithStock.add(shade);
        }
      }

      // Add to the map
      if (shadesWithStock.size > 0) {
        const existing = marbleTypesMap.get(marble.marbleType);
        if (existing) {
          shadesWithStock.forEach(shade => existing.add(shade));
        } else {
          marbleTypesMap.set(marble.marbleType, shadesWithStock);
        }
      }
    }

    // Convert to array format
    const marbleTypes = Array.from(marbleTypesMap.entries()).map(([marbleType, shades]) => ({
      marbleType,
      shades: Array.from(shades).sort(),
    }));

    return NextResponse.json({ 
      success: true, 
      marbleTypes 
    });
  } catch (error) {
    console.error('Error fetching marble types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marble types' },
      { status: 500 }
    );
  }
}
