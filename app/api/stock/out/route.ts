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

    if (!shade) {
      return NextResponse.json(
        { error: 'Could not determine shade from barcode' },
        { status: 400 }
      );
    }

    // Calculate available quantity for this shade
    const availableQuantity = marble.stockEntries
      .filter(e => e.shade === shade)
      .reduce((sum, e) => sum + e.quantity, 0);

    if (availableQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Remove stock using FIFO (oldest entries first)
    let remainingToRemove = quantity;
    const entriesToUpdate = marble.stockEntries
      .filter(e => e.shade === shade)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const entry of entriesToUpdate) {
      if (remainingToRemove <= 0) break;

      const quantityToRemove = Math.min(remainingToRemove, entry.quantity);

      if (quantityToRemove >= entry.quantity) {
        // Delete entire entry
        await prisma.stockEntry.delete({
          where: { id: entry.id },
        });
      } else {
        // Update entry quantity
        await prisma.stockEntry.update({
          where: { id: entry.id },
          data: {
            quantity: entry.quantity - quantityToRemove,
          },
        });
      }

      remainingToRemove -= quantityToRemove;
    }

    // Recalculate total quantity
    const updatedMarble = await prisma.marble.findUnique({
      where: { id: marble.id },
      include: {
        stockEntries: true,
      },
    });

    if (!updatedMarble) {
      return NextResponse.json(
        { error: 'Failed to update marble' },
        { status: 500 }
      );
    }

    const totalQuantity = updatedMarble.stockEntries.reduce((sum, e) => sum + e.quantity, 0);

    // Update status based on new quantity
    let status = 'In Stock';
    if (totalQuantity === 0) {
      status = 'Out of Stock';
    } else if (totalQuantity < 100) {
      status = 'Low Stock';
    }

    if (updatedMarble.status !== status) {
      await prisma.marble.update({
        where: { id: marble.id },
        data: { status },
      });
    }

    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'OUT',
        quantity,
        notes: `Stock removed for shade ${shade} via barcode scan`,
      },
    });

    // Create notification if stock is low
    if (status === 'Low Stock' || status === 'Out of Stock') {
      await prisma.notification.create({
        data: {
          type: 'low-stock',
          message: `Low stock alert: ${marble.marbleType} (${shade}) is ${status.toLowerCase()} (${totalQuantity.toFixed(2)} sq ft remaining)`,
          read: false,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      marble: {
        ...updatedMarble,
        quantity: totalQuantity, // Return calculated quantity for backward compatibility
      }
    });
  } catch (error: any) {
    console.error('Error removing stock:', error);
    return NextResponse.json(
      { error: `Failed to remove stock: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
