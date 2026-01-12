import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate unique barcode: HMB-XXXXXX format
async function generateUniqueBarcode(): Promise<string> {
  let barcode: string = '';
  let exists = true;
  
  while (exists) {
    // Generate 6-digit random number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    barcode = `HMB-${randomNum}`;
    
    // Check if barcode already exists
    const existing = await prisma.marble.findUnique({
      where: { barcode },
    });
    
    exists = existing !== null;
  }
  
  return barcode;
}

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
      isNewItem, // Flag to indicate if this is a new item creation
    } = await request.json();

    // Validation
    if (!marbleType || !quantity || !unit || !location) {
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

    // If color is not provided, try to get it from existing marble of same type, or use marble type as default
    let finalColor = color;
    if (!finalColor || finalColor.trim() === '') {
      const existingMarble = await prisma.marble.findFirst({
        where: { marbleType },
      });
      finalColor = existingMarble?.color || marbleType; // Use existing color or marble type as default
    }

    // Generate barcode if this is a new item and no barcode provided
    let finalBarcode = barcode;
    if (isNewItem && (!finalBarcode || finalBarcode.trim() === '')) {
      finalBarcode = await generateUniqueBarcode();
    }

    // Check if marble with same type and location exists (color is now derived from type)
    let marble = await prisma.marble.findFirst({
      where: {
        marbleType,
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
          barcode: finalBarcode || marble.barcode,
          notes: notes || marble.notes,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new marble
      marble = await prisma.marble.create({
        data: {
          marbleType,
          color: finalColor,
          quantity,
          unit,
          location,
          supplier: supplier || null,
          batchNumber: batchNumber || null,
          barcode: finalBarcode || null,
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

