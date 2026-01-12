import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { barcode, quantity } = await request.json();

    if (!barcode || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid barcode or quantity' },
        { status: 400 }
      );
    }

    // Find marble by barcode (check all barcode fields)
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
        { error: 'Marble with this barcode not found. Please add it first.' },
        { status: 404 }
      );
    }

    // Determine which shade this barcode belongs to
    let shade: string | null = null;
    if (marble.barcodeAA === barcode) shade = 'AA';
    else if (marble.barcodeA === barcode) shade = 'A';
    else if (marble.barcodeB === barcode) shade = 'B';
    else if (marble.barcodeBMinus === barcode) shade = 'B-';

    if (!shade) {
      return NextResponse.json(
        { error: 'Could not determine shade from barcode' },
        { status: 400 }
      );
    }

    // Create a new stock entry for this addition
    await prisma.stockEntry.create({
      data: {
        marbleId: marble.id,
        shade,
        quantity,
        slabSizeLength: null,
        slabSizeWidth: null,
        numberOfSlabs: null,
        notes: `Stock added via barcode scan`,
      },
    });

    // Calculate total quantity from all stock entries
    const totalQuantity = marble.stockEntries.reduce((sum, e) => sum + e.quantity, 0) + quantity;

    // Update status based on new total quantity
    let status = 'In Stock';
    if (totalQuantity === 0) {
      status = 'Out of Stock';
    } else if (totalQuantity < 100) {
      status = 'Low Stock';
    }

    const updatedMarble = await prisma.marble.update({
      where: { id: marble.id },
      data: { status },
    });

    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'IN',
        quantity,
        notes: `Stock added for shade ${shade} via barcode scan`,
      },
    });

    return NextResponse.json({ 
      success: true, 
      marble: {
        ...updatedMarble,
        quantity: totalQuantity, // Return calculated quantity for backward compatibility
      }
    });
  } catch (error: any) {
    console.error('Error adding stock:', error);
    return NextResponse.json(
      { error: `Failed to add stock: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
