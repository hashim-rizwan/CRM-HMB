import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      );
    }

    const marble = await prisma.marble.findUnique({
      where: { barcode },
    });

    if (!marble) {
      return NextResponse.json(
        { error: 'Marble not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, marble });
  } catch (error) {
    console.error('Error fetching marble by barcode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marble' },
      { status: 500 }
    );
  }
}

