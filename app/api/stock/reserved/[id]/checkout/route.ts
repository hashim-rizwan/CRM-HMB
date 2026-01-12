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
        { error: `Cannot checkout reservation with status: ${reservedStock.status}. Only 'Reserved' items can be checked out.` },
        { status: 400 }
      );
    }

    // Update reserved stock status to Delivered (does NOT restore stock to inventory)
    await prisma.reservedStock.update({
      where: { id },
      data: {
        status: 'Delivered',
        releasedAt: new Date(), // Using releasedAt to track delivery date
      },
    });

    // Create stock transaction to record the delivery (type OUT - stock leaving)
    await prisma.stockTransaction.create({
      data: {
        marbleId: reservedStock.marbleId,
        type: 'OUT',
        quantity: reservedStock.quantity,
        reason: `Delivered to ${reservedStock.clientName}`,
        notes: `Checkout/Delivery: ${reservedStock.numberOfSlabs} slab(s) of ${reservedStock.slabSizeLength}x${reservedStock.slabSizeWidth} ft. ${reservedStock.notes || ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reservation marked as delivered successfully',
    });
  } catch (error) {
    console.error('Error checking out reservation:', error);
    return NextResponse.json(
      { error: 'Failed to checkout reservation' },
      { status: 500 }
    );
  }
}
