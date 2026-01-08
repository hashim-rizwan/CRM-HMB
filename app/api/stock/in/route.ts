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
      marble = await prisma.marble.create({
        data: {
          barcode,
          name: `Marble ${barcode}`,
          color: 'Unknown',
          size: 'Unknown',
          quantity: 0,
        },
      })
    }

    const updatedMarble = await prisma.marble.update({
      where: { id: marble.id },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    })

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

