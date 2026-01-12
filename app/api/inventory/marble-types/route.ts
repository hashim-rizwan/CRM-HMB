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

    // Group by marble type and get ALL active shades (not just those with stock)
    const marbleTypesMap = new Map<string, Set<string>>();
    
    for (const marble of marbles) {
      // Get ALL active shades for this marble type
      const activeShades = new Set<string>();
      
      if (marble.shadeAA) activeShades.add('AA');
      if (marble.shadeA) activeShades.add('A');
      if (marble.shadeB) activeShades.add('B');
      if (marble.shadeBMinus) activeShades.add('B-');

      // Add to the map (include all active shades, even if no stock)
      if (activeShades.size > 0) {
        const existing = marbleTypesMap.get(marble.marbleType);
        if (existing) {
          activeShades.forEach(shade => existing.add(shade));
        } else {
          marbleTypesMap.set(marble.marbleType, activeShades);
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
