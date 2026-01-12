import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const {
      marbleType,
      color, // Shade: AA, A, B, B-
      quantity,
      unit,
      supplier,
      notes,
      barcode,
      slabSizeLength, // Direct field from frontend
      slabSizeWidth, // Direct field from frontend
      numberOfSlabs, // Direct field from frontend
    } = await request.json();

    // Validation
    if (!marbleType || !color || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: marbleType, shade (color), and quantity are required' },
        { status: 400 }
      );
    }

    const shade = color.trim();
    if (!['AA', 'A', 'B', 'B-'].includes(shade)) {
      return NextResponse.json(
        { error: 'Invalid shade. Must be one of: AA, A, B, B-' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Parse slab information - prefer direct fields, fallback to parsing notes
    let parsedSlabSizeLength: number | null = null;
    let parsedSlabSizeWidth: number | null = null;
    let parsedNumberOfSlabs: number | null = null;

    // First, try to use direct fields if provided
    if (slabSizeLength !== undefined && slabSizeLength !== null && slabSizeWidth !== undefined && slabSizeWidth !== null) {
      parsedSlabSizeLength = parseFloat(slabSizeLength.toString());
      parsedSlabSizeWidth = parseFloat(slabSizeWidth.toString());
    }
    if (numberOfSlabs !== undefined && numberOfSlabs !== null) {
      parsedNumberOfSlabs = parseInt(numberOfSlabs.toString(), 10);
    }

    // If direct fields not provided, try parsing from notes
    if ((!parsedSlabSizeLength || !parsedSlabSizeWidth || !parsedNumberOfSlabs) && notes) {
      const slabSizeMatch = notes.match(/Slab Size:\s*([\d.]+)x([\d.]+)/i);
      const slabsMatch = notes.match(/Number of Slabs:\s*(\d+)/i);
      
      if (slabSizeMatch && (!parsedSlabSizeLength || !parsedSlabSizeWidth)) {
        parsedSlabSizeLength = parseFloat(slabSizeMatch[1]);
        parsedSlabSizeWidth = parseFloat(slabSizeMatch[2]);
      }
      if (slabsMatch && !parsedNumberOfSlabs) {
        parsedNumberOfSlabs = parseInt(slabsMatch[1], 10);
      }
    }

    // Use parsed values
    const finalSlabSizeLength = parsedSlabSizeLength && !isNaN(parsedSlabSizeLength) ? parsedSlabSizeLength : null;
    const finalSlabSizeWidth = parsedSlabSizeWidth && !isNaN(parsedSlabSizeWidth) ? parsedSlabSizeWidth : null;
    const finalNumberOfSlabs = parsedNumberOfSlabs && !isNaN(parsedNumberOfSlabs) ? parsedNumberOfSlabs : null;

    // Find the marble type entry
    const marble = await prisma.marble.findUnique({
      where: {
        marbleType: marbleType.trim(),
      },
      include: {
        stockEntries: true,
      },
    });

    if (!marble) {
      return NextResponse.json(
        { error: `Marble type "${marbleType}" not found. Please create it first using "Add New Item".` },
        { status: 404 }
      );
    }

    // Verify the shade is active for this marble type
    let isShadeActive = false;
    if (shade === 'AA' && marble.shadeAA) isShadeActive = true;
    else if (shade === 'A' && marble.shadeA) isShadeActive = true;
    else if (shade === 'B' && marble.shadeB) isShadeActive = true;
    else if (shade === 'B-' && marble.shadeBMinus) isShadeActive = true;

    if (!isShadeActive) {
      return NextResponse.json(
        { error: `Shade "${shade}" is not active for marble type "${marbleType}". Please activate it first.` },
        { status: 400 }
      );
    }

    // Create a new StockEntry for this stock addition
    const stockEntry = await prisma.stockEntry.create({
      data: {
        marbleId: marble.id,
        shade,
        quantity,
        slabSizeLength: finalSlabSizeLength,
        slabSizeWidth: finalSlabSizeWidth,
        numberOfSlabs: finalNumberOfSlabs,
        notes: notes || null,
      },
    });

    // Create stock transaction
    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'IN',
        quantity,
        notes: notes || `Stock added for shade ${shade}`,
      },
    });

    // Calculate total quantity for this marble type from all stock entries
    const totalQuantity = marble.stockEntries.reduce((sum, e) => sum + e.quantity, 0) + quantity;

    // Update marble status based on total quantity
    let newStatus = 'In Stock';
    if (totalQuantity === 0) {
      newStatus = 'Out of Stock';
    } else if (totalQuantity < 100) {
      newStatus = 'Low Stock';
    }

    if (marble.status !== newStatus) {
      await prisma.marble.update({
        where: { id: marble.id },
        data: { status: newStatus },
      });
    }

    return NextResponse.json({ 
      success: true, 
      stockEntry,
      marble: {
        ...marble,
        status: newStatus,
      },
      shade,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding stock:', error);
    
    // Return more specific error messages
    let errorMessage = 'Failed to add stock';
    
    if (error.code === 'P2002') {
      errorMessage = 'A record with this information already exists. Please check for duplicates.';
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
