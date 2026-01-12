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

    // Get ALL marbles for this type (including those without batch numbers)
    // to find the oldest one and use its ID (matching main inventory logic)
    const allMarbles = await prisma.marble.findMany({
      where: { 
        marbleType,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get the consistent ID from the oldest marble (matching main inventory aggregation logic)
    const consistentId = allMarbles.length > 0 ? allMarbles[0].id : null;

    // Now get only batches (those with batch numbers) for display
    const batches = allMarbles.filter(marble => marble.batchNumber !== null);

    // Map batches to include the consistent ID for all batches of this type
    const batchesWithConsistentId = batches.map(batch => ({
      ...batch,
      consistentId, // All batches share the same ID (from oldest marble of this type)
    }));

    return NextResponse.json({
      success: true,
      batches: batchesWithConsistentId,
      consistentId, // Also return the consistent ID separately
    });
  } catch (error) {
    console.error('Error fetching inventory details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory details' },
      { status: 500 }
    );
  }
}

