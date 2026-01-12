import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate unique barcode for a specific marble type and shade
// Format: {PREFIX}-{SHADE}-{RANDOM}
// Example: TRA-AA-1234
async function generateUniqueBarcodeForShade(
  marbleType: string,
  shade: string
): Promise<string> {
  const prefix = marbleType.replace(/\s+/g, '').toUpperCase().slice(0, 3) || 'HMB';
  const shadeCode = shade.replace(/-/g, '').toUpperCase();
  
  // Try 4-digit numbers first (1000-9999 = 9000 possibilities)
  let maxAttempts = 10000; // Safety limit to prevent infinite loops
  let attempts = 0;
  let digitLength = 4;
  let minNum = 1000;
  let maxNum = 9999;
  
  while (attempts < maxAttempts) {
    // Generate random number based on current digit length
    const randomNum = Math.floor(minNum + Math.random() * (maxNum - minNum + 1));
    const barcode = `${prefix}-${shadeCode}-${randomNum}`;
    
    // Check if barcode already exists in any barcode field
    const existing = await prisma.marble.findFirst({
      where: {
        OR: [
          { barcodeAA: barcode },
          { barcodeA: barcode },
          { barcodeB: barcode },
          { barcodeBMinus: barcode },
        ],
      },
    });
    
    if (existing === null) {
      // Found a unique barcode
      return barcode;
    }
    
    attempts++;
    
    // If we've tried many times with 4-digit, extend to 5-digit
    if (attempts > 8000 && digitLength === 4) {
      digitLength = 5;
      minNum = 10000;
      maxNum = 99999;
      attempts = 0; // Reset counter for 5-digit attempts
    }
    // If 5-digit is also getting exhausted, extend to 6-digit
    else if (attempts > 80000 && digitLength === 5) {
      digitLength = 6;
      minNum = 100000;
      maxNum = 999999;
      attempts = 0; // Reset counter for 6-digit attempts
    }
  }
  
  // If we somehow exhausted all attempts, throw an error
  throw new Error(`Unable to generate unique barcode for ${marbleType}-${shade} after ${maxAttempts} attempts. Please contact support.`);
}

export async function POST(request: NextRequest) {
  try {
    const {
      marbleType,
      notes,
      shades, // Array of shade objects: [{ shade: 'AA', costPrice: 100, salePrice: 150 }, ...]
    } = await request.json();

    // Validation - marbleType is required
    if (!marbleType || !marbleType.trim()) {
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
    const shadeMap: Record<string, { costPrice: number; salePrice: number }> = {};
    
    for (const shadeData of shades) {
      if (!shadeData.shade) {
        return NextResponse.json(
          { error: 'Shade name is required for all entries' },
          { status: 400 }
        );
      }
      
      // Convert to numbers and validate
      const costPrice = typeof shadeData.costPrice === 'string' 
        ? parseFloat(shadeData.costPrice) 
        : Number(shadeData.costPrice);
      const salePrice = typeof shadeData.salePrice === 'string' 
        ? parseFloat(shadeData.salePrice) 
        : Number(shadeData.salePrice);
      
      if (isNaN(costPrice) || costPrice === null || costPrice === undefined) {
        return NextResponse.json(
          { error: `Valid cost price is required for shade ${shadeData.shade}` },
          { status: 400 }
        );
      }
      if (isNaN(salePrice) || salePrice === null || salePrice === undefined) {
        return NextResponse.json(
          { error: `Valid sale price is required for shade ${shadeData.shade}` },
          { status: 400 }
        );
      }
      if (costPrice < 0 || salePrice < 0) {
        return NextResponse.json(
          { error: `Prices must be non-negative for shade ${shadeData.shade}` },
          { status: 400 }
        );
      }
      
      shadeMap[shadeData.shade] = { costPrice, salePrice };
    }

    // Check if marble type already exists
    const existingMarble = await prisma.marble.findUnique({
      where: {
        marbleType: marbleType.trim(),
      },
    });

    if (existingMarble) {
      return NextResponse.json(
        { error: 'Marble type already exists. Use "Add Stock" to add inventory for this type.' },
        { status: 400 }
      );
    }

    // Generate barcodes for each active shade
    const barcodePromises: Promise<[string, string]>[] = [];
    for (const shade of Object.keys(shadeMap)) {
      barcodePromises.push(
        generateUniqueBarcodeForShade(marbleType, shade).then(barcode => [shade, barcode] as [string, string])
      );
    }
    const barcodes = await Promise.all(barcodePromises);
    const barcodeMap = Object.fromEntries(barcodes);

    // Build data object for Prisma
    const marbleData: any = {
      marbleType: marbleType.trim(),
      shadeAA: shadeMap['AA'] ? true : false,
      shadeA: shadeMap['A'] ? true : false,
      shadeB: shadeMap['B'] ? true : false,
      shadeBMinus: shadeMap['B-'] ? true : false,
      status: 'Out of Stock', // No stock yet
      notes: notes || null,
    };

    // Set prices and barcodes for each active shade
    if (shadeMap['AA']) {
      marbleData.costPriceAA = shadeMap['AA'].costPrice;
      marbleData.salePriceAA = shadeMap['AA'].salePrice;
      marbleData.barcodeAA = barcodeMap['AA'];
    }
    if (shadeMap['A']) {
      marbleData.costPriceA = shadeMap['A'].costPrice;
      marbleData.salePriceA = shadeMap['A'].salePrice;
      marbleData.barcodeA = barcodeMap['A'];
    }
    if (shadeMap['B']) {
      marbleData.costPriceB = shadeMap['B'].costPrice;
      marbleData.salePriceB = shadeMap['B'].salePrice;
      marbleData.barcodeB = barcodeMap['B'];
    }
    if (shadeMap['B-']) {
      marbleData.costPriceBMinus = shadeMap['B-'].costPrice;
      marbleData.salePriceBMinus = shadeMap['B-'].salePrice;
      marbleData.barcodeBMinus = barcodeMap['B-'];
    }

    // Create single marble entry with all shade information
    const marble = await prisma.marble.create({
      data: marbleData,
    });

    // Return response with barcode information
    const barcodeInfo = Object.entries(barcodeMap).map(([shade, barcode]) => ({
      shade,
      barcode,
    }));

    return NextResponse.json({ 
      success: true, 
      marble,
      barcodes: barcodeInfo,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating marble type:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A marble entry with this marble type or barcode already exists. Please try again.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create marble type' },
      { status: 500 }
    );
  }
}
