import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { barcode, quantity } = await request.json()

    if (!barcode || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid barcode or quantity' },
        { status: 400 }
      )
    }

    let marble = await prisma.marble.findUnique({
      where: { barcode },
    })

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble with this barcode not found. Please add it first.' },
        { status: 404 }
      )
    }

    const updatedMarble = await prisma.marble.update({
      where: { id: marble.id },
      data: {
        quantity: {
          increment: quantity,
        },
        updatedAt: new Date(),
      },
    })

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

    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'IN',
        quantity,
      },
    })

    return NextResponse.json({ success: true, marble: updatedMarble })
  } catch (error) {
    console.error('Error adding stock:', error)
    return NextResponse.json(
      { error: 'Failed to add stock' },
      { status: 500 }
    )
  }
}

