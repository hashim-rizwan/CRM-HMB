import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await prisma.reservedStock.count({ where });

    // Fetch reserved stocks with pagination
    const reservedStocks = await prisma.reservedStock.findMany({
      where,
      include: {
        marble: {
          select: {
            marbleType: true,
          },
        },
      },
      orderBy: {
        reservedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform data
    const transformedStocks = reservedStocks.map((stock) => ({
      id: stock.id,
      marbleType: stock.marble.marbleType,
      shade: stock.shade, // Use shade from ReservedStock, not from Marble
      quantity: stock.quantity,
      slabSizeLength: stock.slabSizeLength,
      slabSizeWidth: stock.slabSizeWidth,
      numberOfSlabs: stock.numberOfSlabs,
      clientName: stock.clientName,
      clientPhone: stock.clientPhone,
      clientEmail: stock.clientEmail,
      reservedBy: stock.reservedBy,
      notes: stock.notes,
      status: stock.status,
      reservedAt: stock.reservedAt.toISOString(),
      releasedAt: stock.releasedAt?.toISOString(),
    }));

    // Filter by search query if provided (client-side filtering for simplicity)
    let filteredStocks = transformedStocks;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStocks = transformedStocks.filter(
        (stock) =>
          stock.marbleType.toLowerCase().includes(searchLower) ||
          stock.shade.toLowerCase().includes(searchLower) ||
          stock.clientName.toLowerCase().includes(searchLower) ||
          (stock.clientPhone && stock.clientPhone.includes(search)) ||
          (stock.clientEmail && stock.clientEmail.toLowerCase().includes(searchLower))
      );
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      reservedStocks: filteredStocks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching reserved stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reserved stock' },
      { status: 500 }
    );
  }
}
