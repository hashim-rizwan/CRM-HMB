import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate unique barcode: HMB-XXXXXX format
async function generateUniqueBarcode(): Promise<string> {
  let barcode: string;
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
      supplier,
      batchNumber,
      costPrice,
      salePrice,
      notes,
      barcode,
    } = await request.json();

    // Validation - only marbleType is required
    if (!marbleType) {
      return NextResponse.json(
        { error: 'Marble type is required' },
        { status: 400 }
      );
    }

    // Check if marble type already exists (by type only, not location)
    const existingMarble = await prisma.marble.findFirst({
      where: {
        marbleType,
      },
    });

    if (existingMarble) {
      return NextResponse.json(
        { error: 'Marble type already exists in database' },
        { status: 400 }
      );
    }

    // Derive color from marble type (use type name as default since each type has unique color)
    const finalColor = marbleType;

    // Generate barcode if not provided
    let finalBarcode = barcode;
    if (!finalBarcode || finalBarcode.trim() === '') {
      finalBarcode = await generateUniqueBarcode();
    }

    // Create new marble type entry with default stock values (quantity: 0, not in stock)
    const marble = await prisma.marble.create({
      data: {
        marbleType,
        color: finalColor,
        quantity: 0, // No stock initially
        unit: 'square feet', // Default unit
        location: 'N/A', // Not in stock yet
        supplier: supplier || null,
        batchNumber: batchNumber || null,
        barcode: finalBarcode || null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        salePrice: salePrice ? parseFloat(salePrice) : null,
        notes: notes || null,
        status: 'Out of Stock', // No stock yet
      },
    });

    return NextResponse.json({ success: true, marble }, { status: 201 });
  } catch (error) {
    console.error('Error creating marble type:', error);
    return NextResponse.json(
      { error: 'Failed to create marble type' },
      { status: 500 }
    );
  }
}

