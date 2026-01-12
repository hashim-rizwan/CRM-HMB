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

// Generate unique barcode for a specific marble type and shade
async function generateUniqueBarcodeForShade(marbleType: string, shade: string): Promise<string> {
  let barcode: string = '';
  let exists = true;
  const prefix = marbleType.replace(/\s+/g, '').toUpperCase().slice(0, 3) || 'HMB';
  const shadeCode = shade.replace(/-/g, '').toUpperCase();
  
  while (exists) {
    // Generate 4-digit random number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    barcode = `${prefix}-${shadeCode}-${randomNum}`;
    
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
      shades, // Array of selected shades: ['AA', 'A', 'B', 'B-']
    } = await request.json();

    // Validation - only marbleType is required
    if (!marbleType) {
      return NextResponse.json(
        { error: 'Marble type is required' },
        { status: 400 }
      );
    }

    // Validate shades array
    if (!shades || !Array.isArray(shades) || shades.length === 0) {
      return NextResponse.json(
        { error: 'At least one shade must be selected' },
        { status: 400 }
      );
    }

    // Check if marble type already exists (check for any entry with this marble type)
    const existingEntries = await prisma.marble.findMany({
      where: {
        marbleType,
      },
    });

    // Prevent creation if any entry exists
    if (existingEntries.length > 0) {
      return NextResponse.json(
        { error: 'Marble type already exists. Use "Add Stock" to add inventory for this type.' },
        { status: 400 }
      );
    }

    // Create one marble entry for each selected shade
    const createdMarbles = [];
    
    for (const shade of shades) {
      // Generate unique barcode for this marble type and shade combination
      const shadeBarcode = await generateUniqueBarcodeForShade(marbleType, shade);

      // Create marble entry for this shade
      const marble = await prisma.marble.create({
        data: {
          marbleType,
          color: shade, // Store shade in color field
          quantity: 0, // No stock initially
          unit: 'square feet', // Default unit
          location: 'N/A', // Not in stock yet
          supplier: supplier || null,
          batchNumber: null, // No batch number for template entries
          barcode: shadeBarcode,
          costPrice: costPrice ? parseFloat(costPrice) : null,
          salePrice: salePrice ? parseFloat(salePrice) : null,
          notes: notes || null,
          status: 'Out of Stock', // No stock yet
        },
      });

      createdMarbles.push(marble);
    }

    return NextResponse.json({ success: true, marbles: createdMarbles }, { status: 201 });
  } catch (error) {
    console.error('Error creating marble type:', error);
    return NextResponse.json(
      { error: 'Failed to create marble type' },
      { status: 500 }
    );
  }
}

