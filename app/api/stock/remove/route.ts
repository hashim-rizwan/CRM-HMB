import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const {
      marbleType,
      quantity,
      reason,
      requestedBy,
      notes,
    } = await request.json();

    // Validation
    if (!marbleType || !quantity || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Find ALL marbles of this type (across all batches/locations)
    const marbles = await prisma.marble.findMany({
      where: {
        marbleType,
      },
      orderBy: {
        updatedAt: 'asc', // Remove from oldest batches first (FIFO)
      },
    });

    if (!marbles || marbles.length === 0) {
      return NextResponse.json(
        { error: 'Marble type not found' },
        { status: 404 }
      );
    }

    // Calculate total available quantity across all batches
    const totalAvailable = marbles.reduce((sum, m) => sum + m.quantity, 0);

    if (totalAvailable < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available' },
        { status: 400 }
      );
    }

    // Remove stock from batches, starting with the oldest (FIFO)
    let remainingToRemove = quantity;
    const updatedMarbles = [];
    const transactionIds = [];

    for (const marble of marbles) {
      if (remainingToRemove <= 0) break;

      const quantityToRemove = Math.min(remainingToRemove, marble.quantity);
      
      const updatedMarble = await prisma.marble.update({
        where: { id: marble.id },
        data: {
          quantity: {
            decrement: quantityToRemove,
          },
          updatedAt: new Date(),
        },
      });

      updatedMarbles.push(updatedMarble);
      remainingToRemove -= quantityToRemove;

      // Create stock transaction for this batch
      const transaction = await prisma.stockTransaction.create({
        data: {
          marbleId: marble.id,
          type: 'OUT',
          quantity: quantityToRemove,
          reason: reason || null,
          requestedBy: requestedBy || null,
          notes: notes || null,
        },
      });
      transactionIds.push(transaction.id);

      // Update status based on new quantity for this batch
      let status = 'In Stock';
      if (updatedMarble.quantity < 100) {
        status = 'Low Stock';
      } else if (updatedMarble.quantity === 0) {
        status = 'Out of Stock';
      }

      if (updatedMarble.status !== status) {
        await prisma.marble.update({
          where: { id: marble.id },
          data: { status },
        });
      }
    }

    // Calculate total remaining across all batches
    const allMarbles = await prisma.marble.findMany({
      where: { marbleType },
    });
    const totalRemaining = allMarbles.reduce((sum, m) => sum + m.quantity, 0);

    // Create notification if total stock is low
    if (totalRemaining < 100) {
      const notificationStatus = totalRemaining === 0 ? 'Out of Stock' : 'Low Stock';
      const unit = allMarbles[0]?.unit || 'units';
      await prisma.notification.create({
        data: {
          type: 'low-stock',
          message: `Low stock alert: ${marbleType} is ${notificationStatus.toLowerCase()} (${totalRemaining} ${unit} remaining across all batches)`,
          read: false,
        },
      });
    }

    // Return the first updated marble (for backward compatibility)
    return NextResponse.json({ 
      success: true, 
      marble: updatedMarbles[0] || marbles[0],
      totalRemaining 
    });
  } catch (error) {
    console.error('Error removing stock:', error);
    return NextResponse.json(
      { error: 'Failed to remove stock' },
      { status: 500 }
    );
  }
}

