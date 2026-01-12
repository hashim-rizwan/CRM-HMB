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

    // Check if marble type already exists
    // Check for template entries (batchNumber is null) or batches (with batch numbers)
    const existingTemplates = await prisma.marble.findMany({
      where: {
        marbleType,
        batchNumber: null, // Template entries
      },
    });

    const existingBatches = await prisma.marble.findMany({
      where: {
        marbleType,
        batchNumber: {
          not: null, // Has batches
        },
      },
    });

    // If duplicates exist, clean them up first
    if (existingTemplates.length > 1) {
      // Keep only the oldest template, delete duplicates
      const oldestTemplate = existingTemplates.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      const duplicateIds = existingTemplates
        .filter(t => t.id !== oldestTemplate.id)
        .map(t => t.id);
      
      if (duplicateIds.length > 0) {
        await prisma.marble.deleteMany({
          where: {
            id: {
              in: duplicateIds,
            },
          },
        });
      }
    }

    // Prevent creation if any entry exists (template or batch)
    if (existingTemplates.length > 0 || existingBatches.length > 0) {
      return NextResponse.json(
        { error: 'Marble type already exists. Use "Add Stock" to add inventory for this type.' },
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
        unit: 'kg', // Default unit
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

