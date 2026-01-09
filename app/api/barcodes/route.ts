import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let marbles = await prisma.marble.findMany({
      where: {
        barcode: {
          not: null,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform to barcode format
    const barcodes = marbles.map((marble) => ({
      id: marble.id.toString(),
      marbleName: `${marble.marbleType} ${marble.color}`,
      marbleType: marble.marbleType,
      barcodeValue: marble.barcode || '',
      lastPrinted: marble.updatedAt.toISOString().split('T')[0],
    }));

    // Filter by search query if provided
    let filteredBarcodes = barcodes;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBarcodes = barcodes.filter(
        (barcode) =>
          barcode.marbleName.toLowerCase().includes(searchLower) ||
          barcode.marbleType.toLowerCase().includes(searchLower) ||
          barcode.barcodeValue.includes(search)
      );
    }

    return NextResponse.json({ success: true, barcodes: filteredBarcodes });
  } catch (error) {
    console.error('Error fetching barcodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barcodes' },
      { status: 500 }
    );
  }
}

