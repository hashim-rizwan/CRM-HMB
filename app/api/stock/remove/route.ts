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

    // Find marble by type
    const marble = await prisma.marble.findFirst({
      where: {
        marbleType,
      },
    });

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble type not found' },
        { status: 404 }
      );
    }

    if (marble.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available' },
        { status: 400 }
      );
    }

    // Update marble quantity
    const updatedMarble = await prisma.marble.update({
      where: { id: marble.id },
      data: {
        quantity: {
          decrement: quantity,
        },
        updatedAt: new Date(),
      },
    });

    // Update status based on new quantity
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

    // Create stock transaction
    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'OUT',
        quantity,
        reason: reason || null,
        requestedBy: requestedBy || null,
        notes: notes || null,
      },
    });

    // Create notification if stock is low
    if (status === 'Low Stock' || status === 'Out of Stock') {
      await prisma.notification.create({
        data: {
          type: 'low-stock',
          message: `Low stock alert: ${marble.marbleType} ${marble.color} is ${status.toLowerCase()} (${updatedMarble.quantity} ${updatedMarble.unit} remaining)`,
          read: false,
        },
      });
    }

    return NextResponse.json({ success: true, marble: updatedMarble });
  } catch (error) {
    console.error('Error removing stock:', error);
    return NextResponse.json(
      { error: 'Failed to remove stock' },
      { status: 500 }
    );
  }
}

