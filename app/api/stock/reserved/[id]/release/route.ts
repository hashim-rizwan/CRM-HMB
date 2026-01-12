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

    // Restore quantity to marble
    await prisma.marble.update({
      where: { id: reservedStock.marbleId },
      data: {
        quantity: {
          increment: reservedStock.quantity,
        },
        updatedAt: new Date(),
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

    // Update marble status
    const updatedMarble = await prisma.marble.findUnique({
      where: { id: reservedStock.marbleId },
    });

    if (updatedMarble) {
      let status = 'In Stock';
      if (updatedMarble.quantity < 100) {
        status = 'Low Stock';
      } else if (updatedMarble.quantity === 0) {
        status = 'Out of Stock';
      }

      if (updatedMarble.status !== status) {
        await prisma.marble.update({
          where: { id: reservedStock.marbleId },
          data: { status },
        });
      }
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
