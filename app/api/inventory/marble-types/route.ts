import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all unique marble types with their available shades
    const marbles = await prisma.marble.findMany({
      where: {
        quantity: {
          gt: 0, // Only marbles with stock
        },
      },
      select: {
        marbleType: true,
        color: true,
      },
      distinct: ['marbleType', 'color'],
      orderBy: {
        marbleType: 'asc',
      },
    });

    // Group by marble type
    const marbleTypesMap = new Map<string, string[]>();
    
    for (const marble of marbles) {
      const existing = marbleTypesMap.get(marble.marbleType);
      if (existing) {
        if (!existing.includes(marble.color)) {
          existing.push(marble.color);
        }
      } else {
        marbleTypesMap.set(marble.marbleType, [marble.color]);
      }
    }

    // Convert to array format
    const marbleTypes = Array.from(marbleTypesMap.entries()).map(([marbleType, shades]) => ({
      marbleType,
      shades: shades.sort(), // Sort shades alphabetically
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
