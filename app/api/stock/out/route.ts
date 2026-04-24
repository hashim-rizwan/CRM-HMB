import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { responseIfDatabaseUnavailable } from '@/lib/prismaErrors';

export const dynamic = 'force-dynamic';

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
      include: { stockEntries: true },
    });

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble not found' },
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

    const shadeEntries = marble.stockEntries
      .filter(e => e.shade === shade)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const availableQuantity = shadeEntries.reduce((s, e) => s + e.quantity, 0);

    if (availableQuantity < qty) {
      return NextResponse.json(
        { error: `Insufficient stock for shade ${shade}. Available: ${availableQuantity.toFixed(2)} sq ft` },
        { status: 400 }
      );
    }

    const { totalQuantity, shadeQuantity } = await prisma.$transaction(async (tx) => {
      // FIFO deduction
      let remaining = qty;
      for (const entry of shadeEntries) {
        if (remaining <= 0) break;
        const toRemove = Math.min(remaining, entry.quantity);
        if (toRemove >= entry.quantity) {
          await tx.stockEntry.delete({ where: { id: entry.id } });
        } else {
          await tx.stockEntry.update({
            where: { id: entry.id },
            data: { quantity: entry.quantity - toRemove },
          });
        }
        remaining -= toRemove;
      }

      await tx.stockTransaction.create({
        data: {
          marbleId: marble.id,
          type: 'OUT',
          quantity: qty,
          notes: `Stock removed for shade ${shade} via barcode scan`,
        },
      });

      // Recalculate quantities from DB
      const allEntries = await tx.stockEntry.findMany({ where: { marbleId: marble.id } });
      const totalQuantity = allEntries.reduce((s, e) => s + e.quantity, 0);
      const shadeQuantity = allEntries.filter(e => e.shade === shade).reduce((s, e) => s + e.quantity, 0);

      let status = 'In Stock';
      if (totalQuantity === 0) status = 'Out of Stock';
      else if (totalQuantity < 100) status = 'Low Stock';

      if (marble.status !== status) {
        await tx.marble.update({ where: { id: marble.id }, data: { status } });
      }

      // Notify based on shade-specific quantity
      if (shadeQuantity < 100) {
        const notifStatus = shadeQuantity === 0 ? 'Out of Stock' : 'Low Stock';
        await tx.notification.create({
          data: {
            type: 'low-stock',
            message: `Low stock alert: ${marble.marbleType} (${shade}) is ${notifStatus.toLowerCase()} (${shadeQuantity.toFixed(2)} sq ft remaining)`,
            read: false,
          },
        });
      }

      return { totalQuantity, shadeQuantity };
    });

    return NextResponse.json({
      success: true,
      marble: { ...marble, quantity: totalQuantity },
    });
  } catch (error: any) {
    console.error('Error removing stock:', error);
    const dbError = responseIfDatabaseUnavailable(error);
    if (dbError) return dbError;
    return NextResponse.json(
      { error: `Failed to remove stock: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
