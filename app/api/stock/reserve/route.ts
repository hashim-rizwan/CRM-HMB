import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  allocateSlabs,
  hasEnoughQuantity,
  type SlabRequest,
  type AvailableSlab,
} from '@/lib/slabMatching';

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

    // Find the marble type
    const marble = await prisma.marble.findUnique({
      where: { marbleType: marbleType.trim() },
    });

    if (!marble) {
      return NextResponse.json(
        { error: `Marble type "${marbleType}" not found.` },
        { status: 404 }
      );
    }

    // Verify shade is active
    let isShadeActive = false;
    if (shade === 'AA' && marble.shadeAA) isShadeActive = true;
    else if (shade === 'A' && marble.shadeA) isShadeActive = true;
    else if (shade === 'B' && marble.shadeB) isShadeActive = true;
    else if (shade === 'B-' && marble.shadeBMinus) isShadeActive = true;

    if (!isShadeActive) {
      return NextResponse.json(
        { error: `Shade "${shade}" is not active for marble type "${marbleType}".` },
        { status: 400 }
      );
    }

    // If barcode is provided, verify it matches
    if (barcode) {
      let barcodeMatches = false;
      if (shade === 'AA' && marble.barcodeAA === barcode) barcodeMatches = true;
      else if (shade === 'A' && marble.barcodeA === barcode) barcodeMatches = true;
      else if (shade === 'B' && marble.barcodeB === barcode) barcodeMatches = true;
      else if (shade === 'B-' && marble.barcodeBMinus === barcode) barcodeMatches = true;

      if (!barcodeMatches) {
        return NextResponse.json(
          { error: `Barcode "${barcode}" does not match marble type "${marbleType}" shade "${shade}".` },
          { status: 400 }
        );
      }
    }

    // Get all stock entries for this marble and shade, ordered by creation date (FIFO)
    // Exclude already reserved stock
    const stockEntries = await prisma.stockEntry.findMany({
      where: {
        marbleId: marble.id,
        shade: shade,
      },
      orderBy: {
        createdAt: 'asc', // FIFO - oldest first
      },
    });

    if (!stockEntries || stockEntries.length === 0) {
      return NextResponse.json(
        { error: `No stock found for marble type "${marbleType}" with shade "${shade}".` },
        { status: 404 }
      );
    }

    // Convert stock entries to available slabs format
    const availableSlabs: AvailableSlab[] = stockEntries
      .filter(entry => entry.slabSizeLength && entry.slabSizeWidth && entry.numberOfSlabs)
      .map(entry => ({
        stockEntryId: entry.id,
        marbleId: entry.marbleId,
        shade: entry.shade,
        length: entry.slabSizeLength!,
        width: entry.slabSizeWidth!,
        numberOfSlabs: entry.numberOfSlabs!,
        totalQuantity: entry.quantity,
      }));

    if (availableSlabs.length === 0) {
      return NextResponse.json(
        { error: `No valid slab configurations found for marble type "${marbleType}" shade "${shade}". Stock entries must have slab dimensions.` },
        { status: 404 }
      );
    }

    // Create slab request
    const slabRequest: SlabRequest = {
      length,
      width,
      numberOfSlabs: slabs,
    };

    // Quick check for sufficient quantity
    if (!hasEnoughQuantity(slabRequest, availableSlabs)) {
      const totalAvailable = availableSlabs.reduce((sum, s) => sum + s.totalQuantity, 0);
      const requestedArea = length * width * slabs;
      return NextResponse.json(
        {
          error: `Insufficient total quantity. Requested: ${requestedArea.toFixed(2)} sq ft, Available: ${totalAvailable.toFixed(2)} sq ft.`,
        },
        { status: 400 }
      );
    }

    // Allocate slabs using intelligent matching
    const allocationResult = allocateSlabs(slabRequest, availableSlabs);

    if (!allocationResult.canFulfill) {
      return NextResponse.json(
        { error: allocationResult.message || 'Unable to fulfill request with available slab configurations.' },
        { status: 400 }
      );
    }

    // Process allocations and create reserved stock records
    const reservedStocks = [];
    const updatedEntries = [];
    const deletedEntryIds = [];
    const newRemnantEntries = [];
    const transactionIds = [];

    for (const allocation of allocationResult.allocations) {
      const stockEntry = stockEntries.find(e => e.id === allocation.stockEntryId);
      if (!stockEntry) continue;

      const { slabsUsed, quantityUsed, remainingSlabs, remainingLength, remainingWidth, allocationType } = allocation;

      // Create reserved stock record
      const reservedStock = await prisma.reservedStock.create({
        data: {
          marbleId: marble.id,
          shade: shade,
          clientName,
          clientPhone: clientPhone || null,
          clientEmail: clientEmail || null,
          quantity: quantityUsed,
          slabSizeLength: length,
          slabSizeWidth: width,
          numberOfSlabs: slabsUsed,
          reservedBy: null, // Can be set from session/auth later
          notes: notes
            ? `${notes} (Allocated from ${stockEntry.slabSizeLength}x${stockEntry.slabSizeWidth} ft slabs, Type: ${allocationType})`
            : `Reserved: ${slabsUsed} slab(s) of ${length}x${width} ft from ${stockEntry.slabSizeLength}x${stockEntry.slabSizeWidth} ft slabs (${allocationType})`,
          status: 'Reserved',
        },
      });
      reservedStocks.push(reservedStock);

      // Create stock transaction
      const transaction = await prisma.stockTransaction.create({
        data: {
          marbleId: marble.id,
          type: 'OUT',
          quantity: quantityUsed,
          reason: `Reserved for ${clientName}`,
          notes: notes
            ? `${notes} (Shade: ${shade}, ${slabsUsed} slab(s) of ${length}x${width} ft, Type: ${allocationType})`
            : `Stock reserved: ${slabsUsed} slab(s) of ${length}x${width} ft from ${stockEntry.slabSizeLength}x${stockEntry.slabSizeWidth} ft slabs (${allocationType})`,
        },
      });
      transactionIds.push(transaction.id);

      if (allocationType === 'exact') {
        // Exact match - just reduce the number of slabs
        if (remainingSlabs && remainingSlabs > 0) {
          // Update the stock entry with remaining slabs
          const remainingQuantity = remainingSlabs * stockEntry.slabSizeLength! * stockEntry.slabSizeWidth!;
          const updated = await prisma.stockEntry.update({
            where: { id: stockEntry.id },
            data: {
              numberOfSlabs: remainingSlabs,
              quantity: remainingQuantity,
              updatedAt: new Date(),
            },
          });
          updatedEntries.push(updated);
        } else {
          // All slabs used - delete the entry
          await prisma.stockEntry.delete({
            where: { id: stockEntry.id },
          });
          deletedEntryIds.push(stockEntry.id);
        }
      } else {
        // Cut/partial - need to handle cutting logic
        if (remainingSlabs && remainingSlabs > 0) {
          // Some slabs remain - update the entry
          const remainingQuantity = remainingSlabs * stockEntry.slabSizeLength! * stockEntry.slabSizeWidth!;
          const updated = await prisma.stockEntry.update({
            where: { id: stockEntry.id },
            data: {
              numberOfSlabs: remainingSlabs,
              quantity: remainingQuantity,
              updatedAt: new Date(),
            },
          });
          updatedEntries.push(updated);

          // If there are remnants from cutting, create a new StockEntry for them
          if (allocation.waste && allocation.waste > 0.1) {
            const remnantArea = allocation.waste / slabsUsed;
            if (remnantArea > 1) {
              const remnantLength = remainingLength || stockEntry.slabSizeLength!;
              const remnantWidth = remainingWidth || stockEntry.slabSizeWidth!;
              
              if (remnantLength > 0.5 && remnantWidth > 0.5) {
                const remnantEntry = await prisma.stockEntry.create({
                  data: {
                    marbleId: marble.id,
                    shade: shade,
                    quantity: allocation.waste,
                    slabSizeLength: remnantLength,
                    slabSizeWidth: remnantWidth,
                    numberOfSlabs: slabsUsed,
                    notes: `Remnant from cutting ${slabsUsed} slab(s) to ${length}x${width} ft (reserved for ${clientName})`,
                  },
                });
                newRemnantEntries.push(remnantEntry);
              }
            }
          }
        } else {
          // All slabs used - delete the entry
          await prisma.stockEntry.delete({
            where: { id: stockEntry.id },
          });
          deletedEntryIds.push(stockEntry.id);
        }
      }
    }

    // Recalculate total quantity for this shade and update marble status
    const remainingStockEntries = await prisma.stockEntry.findMany({
      where: {
        marbleId: marble.id,
        shade: shade,
      },
    });

    const totalRemaining = remainingStockEntries.reduce((sum, e) => sum + e.quantity, 0);

    // Update marble status
    let newStatus = 'In Stock';
    if (totalRemaining === 0) {
      newStatus = 'Out of Stock';
    } else if (totalRemaining < 100) {
      newStatus = 'Low Stock';
    }

    if (marble.status !== newStatus) {
      await prisma.marble.update({
        where: { id: marble.id },
        data: { status: newStatus },
      });
    }

    // Create notification if stock is low
    if (totalRemaining < 100) {
      const notificationStatus = totalRemaining === 0 ? 'Out of Stock' : 'Low Stock';
      await prisma.notification.create({
        data: {
          type: 'low-stock',
          message: `Low stock alert: ${marbleType} (${shade}) is ${notificationStatus.toLowerCase()} (${totalRemaining.toFixed(2)} sq ft remaining)`,
          read: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reservedStock: reservedStocks[0] || null,
      totalReserved: allocationResult.totalQuantityAllocated,
      totalRemaining,
      waste: allocationResult.totalWaste,
      allocations: allocationResult.allocations.map(a => ({
        stockEntryId: a.stockEntryId,
        slabsUsed: a.slabsUsed,
        quantityUsed: a.quantityUsed,
        allocationType: a.allocationType,
      })),
      updatedEntries: updatedEntries.length,
      deletedEntries: deletedEntryIds.length,
      newRemnantEntries: newRemnantEntries.length,
    });
  } catch (error: any) {
    console.error('Error reserving stock:', error);

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
