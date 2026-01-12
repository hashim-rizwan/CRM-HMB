import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Find all marbles that have at least one barcode
    let marbles = await prisma.marble.findMany({
      where: {
        OR: [
          { barcodeAA: { not: null } },
          { barcodeA: { not: null } },
          { barcodeB: { not: null } },
          { barcodeBMinus: { not: null } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform to barcode format - create one entry per barcode (shade)
    const barcodes: Array<{
      id: string;
      marbleName: string;
      marbleType: string;
      barcodeValue: string;
      lastPrinted: string;
      color?: string;
    }> = [];

    for (const marble of marbles) {
      // Add barcode for each shade that has a barcode
      if (marble.barcodeAA) {
        barcodes.push({
          id: `${marble.id}-AA`,
          marbleName: marble.marbleType,
          marbleType: marble.marbleType,
          barcodeValue: marble.barcodeAA,
          lastPrinted: marble.updatedAt.toISOString().split('T')[0],
          color: 'AA',
        });
      }
      if (marble.barcodeA) {
        barcodes.push({
          id: `${marble.id}-A`,
          marbleName: marble.marbleType,
          marbleType: marble.marbleType,
          barcodeValue: marble.barcodeA,
          lastPrinted: marble.updatedAt.toISOString().split('T')[0],
          color: 'A',
        });
      }
      if (marble.barcodeB) {
        barcodes.push({
          id: `${marble.id}-B`,
          marbleName: marble.marbleType,
          marbleType: marble.marbleType,
          barcodeValue: marble.barcodeB,
          lastPrinted: marble.updatedAt.toISOString().split('T')[0],
          color: 'B',
        });
      }
      if (marble.barcodeBMinus) {
        barcodes.push({
          id: `${marble.id}-B-`,
          marbleName: marble.marbleType,
          marbleType: marble.marbleType,
          barcodeValue: marble.barcodeBMinus,
          lastPrinted: marble.updatedAt.toISOString().split('T')[0],
          color: 'B-',
        });
      }
    }

    // Filter by search query if provided
    let filteredBarcodes = barcodes;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBarcodes = barcodes.filter(
        (barcode) =>
          barcode.marbleName.toLowerCase().includes(searchLower) ||
          barcode.marbleType.toLowerCase().includes(searchLower) ||
          barcode.barcodeValue.toLowerCase().includes(searchLower) ||
          (barcode.color && barcode.color.toLowerCase().includes(searchLower))
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

