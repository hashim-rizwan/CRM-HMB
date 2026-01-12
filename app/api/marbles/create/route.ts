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

// Generate unique barcode for a specific marble type, shade, cost price, and sale price
// Format: {PREFIX}-{SHADE}-{COST}-{SALE}-{RANDOM}
// Example: TRA-AA-100-150-1234
async function generateUniqueBarcodeForShade(
  marbleType: string,
  shade: string,
  costPrice: number,
  salePrice: number
): Promise<string> {
  let barcode: string = '';
  let exists = true;
  const prefix = marbleType.replace(/\s+/g, '').toUpperCase().slice(0, 3) || 'HMB';
  const shadeCode = shade.replace(/-/g, '').toUpperCase();
  const costCode = Math.round(costPrice).toString().padStart(4, '0'); // 4-digit cost code
  const saleCode = Math.round(salePrice).toString().padStart(4, '0'); // 4-digit sale code
  
  while (exists) {
    // Generate 4-digit random number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    barcode = `${prefix}-${shadeCode}-${costCode}-${saleCode}-${randomNum}`;
    
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
      notes,
      shades, // Array of shade objects: [{ shade: 'AA', costPrice: 100, salePrice: 150 }, ...]
    } = await request.json();

    // Validation - marbleType is required
    if (!marbleType) {
      return NextResponse.json(
        { error: 'Marble type is required' },
        { status: 400 }
      );
    }

    // Validate shades array
    if (!shades || !Array.isArray(shades) || shades.length === 0) {
      return NextResponse.json(
        { error: 'At least one shade with pricing must be provided' },
        { status: 400 }
      );
    }

    // Validate each shade has both prices
    for (const shadeData of shades) {
      if (!shadeData.shade) {
        return NextResponse.json(
          { error: 'Shade name is required for all entries' },
          { status: 400 }
        );
      }
      if (shadeData.costPrice === undefined || shadeData.costPrice === null) {
        return NextResponse.json(
          { error: `Cost price is required for shade ${shadeData.shade}` },
          { status: 400 }
        );
      }
      if (shadeData.salePrice === undefined || shadeData.salePrice === null) {
        return NextResponse.json(
          { error: `Sale price is required for shade ${shadeData.shade}` },
          { status: 400 }
        );
      }
      if (shadeData.costPrice < 0 || shadeData.salePrice < 0) {
        return NextResponse.json(
          { error: `Prices must be non-negative for shade ${shadeData.shade}` },
          { status: 400 }
        );
      }
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

    // Create one marble entry for each shade with its pricing
    const createdMarbles = [];
    
    for (const shadeData of shades) {
      const { shade, costPrice, salePrice } = shadeData;
      
      // Generate unique barcode for this marble type, shade, cost price, and sale price
      const shadeBarcode = await generateUniqueBarcodeForShade(
        marbleType,
        shade,
        parseFloat(costPrice),
        parseFloat(salePrice)
      );

      // Create marble entry for this shade
      const marble = await prisma.marble.create({
        data: {
          marbleType,
          color: shade, // Store shade in color field
          quantity: 0, // No stock initially
          unit: 'square feet', // Default unit
          location: 'N/A', // Required by schema but not used
          supplier: null,
          batchNumber: null, // No batch number for template entries
          barcode: shadeBarcode,
          costPrice: parseFloat(costPrice),
          salePrice: parseFloat(salePrice),
          notes: notes || null,
          status: 'Out of Stock', // No stock yet
        },
      });

      createdMarbles.push(marble);
    }

    return NextResponse.json({ success: true, marbles: createdMarbles }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating marble type:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A marble entry with this barcode already exists. Please try again.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create marble type' },
      { status: 500 }
    );
  }
}

