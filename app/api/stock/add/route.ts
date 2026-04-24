import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { responseIfDatabaseUnavailable } from '@/lib/prismaErrors';

export async function POST(request: NextRequest) {
  try {
    const {
      marbleType,
      color, // Shade: AA, A, B, B-
      quantity,
      notes,
      slabSizeLength,
      slabSizeWidth,
      numberOfSlabs,
    } = await request.json();

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

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    // Parse slab dimensions — prefer direct fields, fallback to notes
    let finalSlabSizeLength: number | null = null;
    let finalSlabSizeWidth: number | null = null;
    let finalNumberOfSlabs: number | null = null;

    if (slabSizeLength != null && slabSizeWidth != null) {
      const l = parseFloat(slabSizeLength.toString());
      const w = parseFloat(slabSizeWidth.toString());
      if (!isNaN(l) && !isNaN(w)) {
        finalSlabSizeLength = l;
        finalSlabSizeWidth = w;
      }
    }
    if (numberOfSlabs != null) {
      const n = parseInt(numberOfSlabs.toString(), 10);
      if (!isNaN(n)) finalNumberOfSlabs = n;
    }

    if (finalSlabSizeLength === null && notes) {
      const m = notes.match(/Slab Size:\s*([\d.]+)x([\d.]+)/i);
      if (m) { finalSlabSizeLength = parseFloat(m[1]); finalSlabSizeWidth = parseFloat(m[2]); }
    }
    if (finalNumberOfSlabs === null && notes) {
      const m = notes.match(/Number of Slabs:\s*(\d+)/i);
      if (m) finalNumberOfSlabs = parseInt(m[1], 10);
    }

    const marble = await prisma.marble.findUnique({
      where: { marbleType: marbleType.trim() },
      include: { stockEntries: true },
    });

    if (!marble) {
      return NextResponse.json(
        { error: `Marble type "${marbleType}" not found. Please create it first using "Add New Item".` },
        { status: 404 }
      );
    }

    const isShadeActive =
      (shade === 'AA' && marble.shadeAA) ||
      (shade === 'A' && marble.shadeA) ||
      (shade === 'B' && marble.shadeB) ||
      (shade === 'B-' && marble.shadeBMinus);

    if (!isShadeActive) {
      return NextResponse.json(
        { error: `Shade "${shade}" is not active for marble type "${marbleType}". Please activate it first.` },
        { status: 400 }
      );
    }

    // All DB writes are atomic
    const { stockEntry, newStatus } = await prisma.$transaction(async (tx) => {
      const stockEntry = await tx.stockEntry.create({
        data: {
          marbleId: marble.id,
          shade,
          quantity: qty,
          slabSizeLength: finalSlabSizeLength,
          slabSizeWidth: finalSlabSizeWidth,
          numberOfSlabs: finalNumberOfSlabs,
          notes: notes || null,
        },
      });

      await tx.stockTransaction.create({
        data: {
          marbleId: marble.id,
          type: 'IN',
          quantity: qty,
          notes: notes || `Stock added for shade ${shade}`,
        },
      });

      // Recalculate from DB (includes the entry we just created)
      const allEntries = await tx.stockEntry.findMany({ where: { marbleId: marble.id } });
      const totalQty = allEntries.reduce((s, e) => s + e.quantity, 0);

      let newStatus = 'In Stock';
      if (totalQty === 0) newStatus = 'Out of Stock';
      else if (totalQty < 100) newStatus = 'Low Stock';

      if (marble.status !== newStatus) {
        await tx.marble.update({ where: { id: marble.id }, data: { status: newStatus } });
      }

      return { stockEntry, newStatus };
    });

    return NextResponse.json({
      success: true,
      stockEntry,
      marble: { ...marble, status: newStatus },
      shade,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding stock:', error);
    const dbError = responseIfDatabaseUnavailable(error);
    if (dbError) return dbError;
    let errorMessage = 'Failed to add stock';
    if (error.code === 'P2002') {
      errorMessage = 'A record with this information already exists. Please check for duplicates.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
