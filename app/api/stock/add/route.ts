import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const {
      marbleType,
      color,
      quantity,
      unit,
      location,
      supplier,
      batchNumber,
      costPrice,
      salePrice,
      notes,
      barcode,
    } = await request.json();

    // Validation
    if (!marbleType || !color || !quantity || !unit || !location) {
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

    // Check if marble with same type, color, and location exists
    let marble = await prisma.marble.findFirst({
      where: {
        marbleType,
        color,
        location,
      },
    });

    if (marble) {
      // Update existing marble
      marble = await prisma.marble.update({
        where: { id: marble.id },
        data: {
          quantity: {
            increment: quantity,
          },
          costPrice: costPrice || marble.costPrice,
          salePrice: salePrice || marble.salePrice,
          supplier: supplier || marble.supplier,
          batchNumber: batchNumber || marble.batchNumber,
          barcode: barcode || marble.barcode,
          notes: notes || marble.notes,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new marble
      marble = await prisma.marble.create({
        data: {
          marbleType,
          color,
          quantity,
          unit,
          location,
          supplier: supplier || null,
          batchNumber: batchNumber || null,
          barcode: barcode || null,
          costPrice: costPrice || null,
          salePrice: salePrice || null,
          notes: notes || null,
          status: 'In Stock',
        },
      });
    }

    // Create stock transaction
    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'IN',
        quantity,
        notes: notes || null,
      },
    });

    // Update status based on quantity
    let status = 'In Stock';
    if (marble.quantity < 100) {
      status = 'Low Stock';
    } else if (marble.quantity === 0) {
      status = 'Out of Stock';
    }

    if (marble.status !== status) {
      marble = await prisma.marble.update({
        where: { id: marble.id },
        data: { status },
      });
    }

    return NextResponse.json({ success: true, marble }, { status: 201 });
  } catch (error) {
    console.error('Error adding stock:', error);
    return NextResponse.json(
      { error: 'Failed to add stock' },
      { status: 500 }
    );
  }
}

