import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Parse slab information from notes field
// Format: "Slab Size: LENGTHxWIDTH, Number of Slabs: COUNT"
function parseSlabInfo(notes: string | null): { length: number; width: number; numberOfSlabs: number } | null {
  if (!notes) return null;
  
  try {
    // Match pattern: "Slab Size: LENGTHxWIDTH, Number of Slabs: COUNT"
    const slabSizeMatch = notes.match(/Slab Size:\s*([\d.]+)x([\d.]+)/i);
    const slabsMatch = notes.match(/Number of Slabs:\s*(\d+)/i);
    
    if (slabSizeMatch && slabsMatch) {
      return {
        length: parseFloat(slabSizeMatch[1]),
        width: parseFloat(slabSizeMatch[2]),
        numberOfSlabs: parseInt(slabsMatch[1], 10),
      };
    }
  } catch (error) {
    console.error('Error parsing slab info from notes:', error);
  }
  
  return null;
}

// Check if two slab configurations match (with tolerance for floating point)
function slabConfigMatches(
  config1: { length: number; width: number; numberOfSlabs: number },
  config2: { length: number; width: number; numberOfSlabs: number },
  tolerance: number = 0.01
): boolean {
  return (
    Math.abs(config1.length - config2.length) < tolerance &&
    Math.abs(config1.width - config2.width) < tolerance &&
    config1.numberOfSlabs === config2.numberOfSlabs
  );
}

export async function POST(request: NextRequest) {
  try {
    const {
      barcode,
      marbleType,
      shade,
      slabSizeLength,
      slabSizeWidth,
      numberOfSlabs,
      clientName,
      clientPhone,
      clientEmail,
      notes,
    } = await request.json();

    // Validation
    if (!marbleType || !shade || !slabSizeLength || !slabSizeWidth || !numberOfSlabs || !clientName) {
      return NextResponse.json(
        { error: 'Missing required fields: marbleType, shade, slabSizeLength, slabSizeWidth, numberOfSlabs, and clientName are required' },
        { status: 400 }
      );
    }

    const length = parseFloat(slabSizeLength);
    const width = parseFloat(slabSizeWidth);
    const slabs = parseInt(numberOfSlabs.toString(), 10);

    if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(slabs) || slabs <= 0) {
      return NextResponse.json(
        { error: 'Invalid slab dimensions or number of slabs. All values must be positive numbers.' },
        { status: 400 }
      );
    }

    // Calculate total quantity to reserve
    const quantityToReserve = length * width * slabs;

    // Find marbles matching marble type and shade
    const whereClause: any = {
      marbleType,
      color: shade, // Shade is stored in color field
    };

    // If barcode is provided, also filter by barcode
    if (barcode) {
      whereClause.barcode = barcode;
    }

    const marbles = await prisma.marble.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'asc', // Reserve from oldest first (FIFO)
      },
    });

    if (!marbles || marbles.length === 0) {
      return NextResponse.json(
        { error: `No stock found for marble type "${marbleType}" with shade "${shade}"${barcode ? ` and barcode "${barcode}"` : ''}` },
        { status: 404 }
      );
    }

    // Target slab configuration to match
    const targetConfig = {
      length,
      width,
      numberOfSlabs: slabs,
    };

    // Find marbles with matching slab configuration
    const matchingMarbles = marbles.filter((marble) => {
      const slabInfo = parseSlabInfo(marble.notes);
      if (!slabInfo) return false;
      return slabConfigMatches(slabInfo, targetConfig);
    });

    if (matchingMarbles.length === 0) {
      // Provide helpful error message
      const availableConfigs = marbles
        .map((m) => {
          const info = parseSlabInfo(m.notes);
          return info ? `${info.length}x${info.width} (${info.numberOfSlabs} slabs)` : null;
        })
        .filter(Boolean)
        .join(', ');
      
      return NextResponse.json(
        { 
          error: `No matching slab configuration found. Requested: ${length}x${width} (${slabs} slabs). Available configurations: ${availableConfigs || 'None found in notes'}` 
        },
        { status: 404 }
      );
    }

    // Calculate total available quantity for matching configurations
    const totalAvailable = matchingMarbles.reduce((sum, m) => sum + m.quantity, 0);

    if (totalAvailable < quantityToReserve) {
      return NextResponse.json(
        { 
          error: `Insufficient stock available. Requested: ${quantityToReserve.toLocaleString()} sq ft, Available: ${totalAvailable.toLocaleString()} sq ft for configuration ${length}x${width} (${slabs} slabs)` 
        },
        { status: 400 }
      );
    }

    // Reserve stock from matching marbles using FIFO
    let remainingToReserve = quantityToReserve;
    const reservedStocks = [];
    const updatedMarbles = [];

    for (const marble of matchingMarbles) {
      if (remainingToReserve <= 0) break;

      const quantityToReserveFromThis = Math.min(remainingToReserve, marble.quantity);
      
      // Create reserved stock record
      const reservedStock = await prisma.reservedStock.create({
        data: {
          marbleId: marble.id,
          clientName,
          clientPhone: clientPhone || null,
          clientEmail: clientEmail || null,
          quantity: quantityToReserveFromThis,
          slabSizeLength: length,
          slabSizeWidth: width,
          numberOfSlabs: slabs,
          reservedBy: null, // Can be set from session/auth later
          notes: notes || null,
          status: 'Reserved',
        },
      });

      reservedStocks.push(reservedStock);
      
      // Update marble quantity (reduce available stock)
      const updatedMarble = await prisma.marble.update({
        where: { id: marble.id },
        data: {
          quantity: {
            decrement: quantityToReserveFromThis,
          },
          updatedAt: new Date(),
        },
      });

      updatedMarbles.push(updatedMarble);
      remainingToReserve -= quantityToReserveFromThis;

      // Create stock transaction
      await prisma.stockTransaction.create({
        data: {
          marbleId: marble.id,
          type: 'OUT',
          quantity: quantityToReserveFromThis,
          reason: `Reserved for ${clientName}`,
          notes: notes || null,
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
    }

    // Calculate total remaining for this marble type and shade
    const allMarbles = await prisma.marble.findMany({
      where: {
        marbleType,
        color: shade,
      },
    });
    const totalRemaining = allMarbles.reduce((sum, m) => sum + m.quantity, 0);

    // Create notification if total stock is low
    if (totalRemaining < 100) {
      const notificationStatus = totalRemaining === 0 ? 'Out of Stock' : 'Low Stock';
      const unit = allMarbles[0]?.unit || 'units';
      await prisma.notification.create({
        data: {
          type: 'low-stock',
          message: `Low stock alert: ${marbleType} (${shade}) is ${notificationStatus.toLowerCase()} (${totalRemaining} ${unit} remaining)`,
          read: false,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      reservedStock: reservedStocks[0] || null,
      totalReserved: quantityToReserve,
      totalRemaining,
    });
  } catch (error: any) {
    console.error('Error reserving stock:', error);
    
    // Return more specific error messages
    let errorMessage = 'Failed to reserve stock';
    
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
