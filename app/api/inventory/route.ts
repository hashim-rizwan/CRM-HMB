import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let marbles = await prisma.marble.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      marbles = marbles.filter(
        (marble) =>
          marble.marbleType.toLowerCase().includes(searchLower) ||
          marble.color.toLowerCase().includes(searchLower) ||
          marble.location.toLowerCase().includes(searchLower) ||
          marble.batchNumber?.toLowerCase().includes(searchLower) ||
          marble.barcode?.includes(search)
      );
    }

    return NextResponse.json({ success: true, marbles });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

