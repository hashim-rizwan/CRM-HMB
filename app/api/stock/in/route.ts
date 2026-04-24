import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { responseIfDatabaseUnavailable } from '@/lib/prismaErrors';

export async function POST(request: NextRequest) {
  try {
    const { barcode, quantity } = await request.json();

    const qty = parseFloat(quantity);
    if (!barcode || isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Invalid barcode or quantity' },
        { status: 400 }
      );
    }

    const marble = await prisma.marble.findFirst({
      where: {
        OR: [
          { barcodeAA: barcode },
          { barcodeA: barcode },
          { barcodeB: barcode },
          { barcodeBMinus: barcode },
        ],
      },
    });

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble with this barcode not found. Please add it first.' },
        { status: 404 }
      );
    }

    let shade: string | null = null;
    if (marble.barcodeAA === barcode) shade = 'AA';
    else if (marble.barcodeA === barcode) shade = 'A';
    else if (marble.barcodeB === barcode) shade = 'B';
    else if (marble.barcodeBMinus === barcode) shade = 'B-';

    if (!shade) {
      return NextResponse.json(
        { error: 'Could not determine shade from barcode' },
        { status: 400 }
      );
    }

    const { updatedMarble, totalQuantity, shadeQuantity } = await prisma.$transaction(async (tx) => {
      await tx.stockEntry.create({
        data: {
          marbleId: marble.id,
          shade,
          quantity: qty,
          slabSizeLength: null,
          slabSizeWidth: null,
          numberOfSlabs: null,
          notes: `Stock added via barcode scan`,
        },
      });

      await tx.stockTransaction.create({
        data: {
          marbleId: marble.id,
          type: 'IN',
          quantity: qty,
          notes: `Stock added for shade ${shade} via barcode scan`,
        },
      });

      // Recalculate from DB (sees the entry we just created)
      const allEntries = await tx.stockEntry.findMany({ where: { marbleId: marble.id } });
      const totalQuantity = allEntries.reduce((s, e) => s + e.quantity, 0);
      const shadeQuantity = allEntries.filter(e => e.shade === shade).reduce((s, e) => s + e.quantity, 0);

      let status = 'In Stock';
      if (totalQuantity === 0) status = 'Out of Stock';
      else if (totalQuantity < 100) status = 'Low Stock';

      let updatedMarble = marble;
      if (marble.status !== status) {
        updatedMarble = await tx.marble.update({ where: { id: marble.id }, data: { status } });
      }

      // Notify if still low after adding (e.g. added to a depleted shade)
      if (status === 'Low Stock' || status === 'Out of Stock') {
        await tx.notification.create({
          data: {
            type: 'low-stock',
            message: `Low stock alert: ${marble.marbleType} (${shade}) is ${status.toLowerCase()} (${shadeQuantity.toFixed(2)} sq ft remaining)`,
            read: false,
          },
        });
      }

      return { updatedMarble, totalQuantity, shadeQuantity };
    });

    return NextResponse.json({
      success: true,
      marble: { ...updatedMarble, quantity: totalQuantity },
    });
  } catch (error: any) {
    console.error('Error adding stock:', error);
    const dbError = responseIfDatabaseUnavailable(error);
    if (dbError) return dbError;
    return NextResponse.json(
      { error: `Failed to add stock: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
