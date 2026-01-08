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

    const marble = await prisma.marble.findUnique({
      where: { barcode },
    })

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble not found' },
        { status: 404 }
      )
    }

    if (marble.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    const updatedMarble = await prisma.marble.update({
      where: { id: marble.id },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    })

    await prisma.stockTransaction.create({
      data: {
        marbleId: marble.id,
        type: 'OUT',
        quantity,
      },
    })

    return NextResponse.json({ success: true, marble: updatedMarble })
  } catch (error) {
    console.error('Error removing stock:', error)
    return NextResponse.json(
      { error: 'Failed to remove stock' },
      { status: 500 }
    )
  }
}

