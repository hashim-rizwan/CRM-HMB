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

// Generate a unique batch number for a marble type
// Example: TRAV-B1, TRAV-B2, etc.
async function generateBatchNumber(marbleType: string): Promise<string> {
  const prefix =
    marbleType.replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'HMB';

  // Find ALL batches for this marble type (including those with batch numbers)
  const existingBatches = await prisma.marble.findMany({
    where: {
      marbleType,
      batchNumber: {
        not: null,
      },
    },
    select: {
      batchNumber: true,
    },
    orderBy: {
      createdAt: 'desc', // Get most recent first
    },
  });

  // Extract batch numbers and find the highest number
  let maxBatchNum = 0;
  // Match patterns like: ONYX-B1, TRAV-B2, etc. (case insensitive)
  const batchNumPattern = new RegExp(`^${prefix}-B(\\d+)$`, 'i');
  
  for (const batch of existingBatches) {
    if (batch.batchNumber) {
      const match = batch.batchNumber.match(batchNumPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxBatchNum) {
          maxBatchNum = num;
        }
      }
    }
  }

  // Generate next batch number
  const newBatchNum = maxBatchNum + 1;
  const newBatchNumber = `${prefix}-B${newBatchNum}`;

  // Double-check this batch number doesn't already exist (safety check)
  const exists = await prisma.marble.findFirst({
    where: {
      marbleType,
      batchNumber: newBatchNumber,
    },
  });

  // If it somehow exists, increment until we find a unique one
  if (exists) {
    let counter = newBatchNum + 1;
    let uniqueBatchNumber = `${prefix}-B${counter}`;
    while (await prisma.marble.findFirst({
      where: {
        marbleType,
        batchNumber: uniqueBatchNumber,
      },
    })) {
      counter++;
      uniqueBatchNumber = `${prefix}-B${counter}`;
    }
    return uniqueBatchNumber;
  }

  return newBatchNumber;
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

    // Always auto-generate a NEW batch number for each stock addition
    // Ignore any batch number sent from frontend to ensure uniqueness
    const finalBatchNumber = await generateBatchNumber(marbleType);

    // Always create a NEW batch for each stock addition
    // Check if there's a template entry (created via "Add New Item" - no batch number)
    let templateEntry = await prisma.marble.findFirst({
      where: {
        marbleType,
        batchNumber: null, // Template entries have no batch number
      },
    });

    let marble;

    if (templateEntry) {
      // Convert template entry to first batch
      // Update the template entry to become a real batch with stock
      marble = await prisma.marble.update({
        where: { id: templateEntry.id },
        data: {
          color: finalColor,
          quantity: quantity, // Set quantity (was 0)
          unit: unit, // Update unit
          location: location, // Update location from 'N/A'
          supplier: supplier || templateEntry.supplier,
          batchNumber: finalBatchNumber, // Assign batch number
          barcode: finalBarcode || templateEntry.barcode,
          costPrice: costPrice || templateEntry.costPrice,
          salePrice: salePrice || templateEntry.salePrice,
          notes: notes || templateEntry.notes,
          status: 'In Stock', // Update status
          updatedAt: new Date(),
        },
      });
    } else {
      // Always create a NEW batch entry (each stock addition = new batch)
      marble = await prisma.marble.create({
        data: {
          marbleType,
          color: finalColor,
          quantity,
          unit,
          location,
          supplier: supplier || null,
          batchNumber: finalBatchNumber, // New batch number for each addition
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

    return NextResponse.json({ 
      success: true, 
      marble,
      batchNumber: finalBatchNumber // Return the batch number that was used
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding stock:', error);
    
    // Return more specific error messages
    let errorMessage = 'Failed to add stock';
    
    if (error.code === 'P2002') {
      // Unique constraint violation (e.g., duplicate barcode)
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

