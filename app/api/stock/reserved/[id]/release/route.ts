import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    // Find the reserved stock
    const reservedStock = await prisma.reservedStock.findUnique({
      where: { id },
      include: {
        marble: true,
      },
    });

    if (!reservedStock) {
      return NextResponse.json(
        { error: 'Reserved stock not found' },
        { status: 404 }
      );
    }

    if (reservedStock.status !== 'Reserved') {
      return NextResponse.json(
        { error: `Cannot release reservation with status: ${reservedStock.status}` },
        { status: 400 }
      );
    }

    // Update reserved stock status
    await prisma.reservedStock.update({
      where: { id },
      data: {
        status: 'Released',
        releasedAt: new Date(),
      },
    });

    // Restore stock by creating a new StockEntry
    await prisma.stockEntry.create({
      data: {
        marbleId: reservedStock.marbleId,
        shade: reservedStock.shade,
        quantity: reservedStock.quantity,
        slabSizeLength: reservedStock.slabSizeLength,
        slabSizeWidth: reservedStock.slabSizeWidth,
        numberOfSlabs: reservedStock.numberOfSlabs,
        notes: `Released reservation for ${reservedStock.clientName}${reservedStock.notes ? ` - ${reservedStock.notes}` : ''}`,
      },
    });

    // Create stock transaction
    await prisma.stockTransaction.create({
      data: {
        marbleId: reservedStock.marbleId,
        type: 'IN',
        quantity: reservedStock.quantity,
        reason: `Released reservation for ${reservedStock.clientName}`,
        notes: reservedStock.notes || null,
      },
    });

    // Recalculate total quantity and update marble status
    const stockEntries = await prisma.stockEntry.findMany({
      where: {
        marbleId: reservedStock.marbleId,
        shade: reservedStock.shade,
      },
    });

    const totalQuantity = stockEntries.reduce((sum, entry) => sum + entry.quantity, 0);

    let status = 'In Stock';
    if (totalQuantity === 0) {
      status = 'Out of Stock';
    } else if (totalQuantity < 100) {
      status = 'Low Stock';
    }

    const marble = await prisma.marble.findUnique({
      where: { id: reservedStock.marbleId },
    });

    if (marble && marble.status !== status) {
      await prisma.marble.update({
        where: { id: reservedStock.marbleId },
        data: { status },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation released successfully',
    });
  } catch (error) {
    console.error('Error releasing reservation:', error);
    return NextResponse.json(
      { error: 'Failed to release reservation' },
      { status: 500 }
    );
  }
}
