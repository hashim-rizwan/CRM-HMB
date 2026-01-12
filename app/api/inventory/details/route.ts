import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marbleType = searchParams.get('marbleType');

    if (!marbleType) {
      return NextResponse.json(
        { error: 'marbleType is required' },
        { status: 400 }
      );
    }

    // Get ALL marbles for this type to find the oldest one and use its ID (matching main inventory logic)
    const allMarbles = await prisma.marble.findMany({
      where: { 
        marbleType,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get the consistent ID from the oldest marble (matching main inventory aggregation logic)
    const consistentId = allMarbles.length > 0 ? allMarbles[0].id : null;

    // Return all stock entries for this marble type
    // Since we're using shades instead of batch numbers, return all entries
    const stockEntries = await prisma.stockEntry.findMany({
      where: {
        marbleId: allMarbles[0]?.id || 0,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      batches: stockEntries.map(entry => ({
        ...entry,
        consistentId,
      })),
      consistentId, // Also return the consistent ID separately
      // Note: "batches" is kept for backward compatibility, but these are actually stock entries grouped by shade
    });
  } catch (error) {
    console.error('Error fetching inventory details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory details' },
      { status: 500 }
    );
  }
}

