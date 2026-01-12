import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      );
    }

    // Search for barcode in any of the barcode fields
    const marble = await prisma.marble.findFirst({
      where: {
        OR: [
          { barcodeAA: barcode },
          { barcodeA: barcode },
          { barcodeB: barcode },
          { barcodeBMinus: barcode },
        ],
      },
      include: {
        stockEntries: true,
      },
    });

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble not found' },
        { status: 404 }
      );
    }

    // Determine which shade this barcode belongs to
    let shade: string | null = null;
    if (marble.barcodeAA === barcode) shade = 'AA';
    else if (marble.barcodeA === barcode) shade = 'A';
    else if (marble.barcodeB === barcode) shade = 'B';
    else if (marble.barcodeBMinus === barcode) shade = 'B-';

    // Get prices for this shade
    let costPrice: number | null = null;
    let salePrice: number | null = null;
    
    if (shade === 'AA') {
      costPrice = marble.costPriceAA;
      salePrice = marble.salePriceAA;
    } else if (shade === 'A') {
      costPrice = marble.costPriceA;
      salePrice = marble.salePriceA;
    } else if (shade === 'B') {
      costPrice = marble.costPriceB;
      salePrice = marble.salePriceB;
    } else if (shade === 'B-') {
      costPrice = marble.costPriceBMinus;
      salePrice = marble.salePriceBMinus;
    }

    // Calculate total quantity for this shade from stock entries
    const totalQuantity = marble.stockEntries
      .filter(e => e.shade === shade)
      .reduce((sum, e) => sum + e.quantity, 0);

    // Return in the expected format (for backward compatibility)
    return NextResponse.json({ 
      success: true, 
      marble: {
        id: marble.id,
        marbleType: marble.marbleType,
        color: shade, // For backward compatibility
        quantity: totalQuantity,
        unit: 'square feet',
        costPrice,
        salePrice,
        status: totalQuantity === 0 ? 'Out of Stock' : (totalQuantity < 100 ? 'Low Stock' : 'In Stock'),
        barcode,
        notes: marble.notes,
        updatedAt: marble.updatedAt,
        createdAt: marble.createdAt,
      }
    });
  } catch (error) {
    console.error('Error fetching marble by barcode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marble' },
      { status: 500 }
    );
  }
}
