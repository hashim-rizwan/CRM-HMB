import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Fetch all marbles with their stock entries
    const marbles = await prisma.marble.findMany({
      include: {
        stockEntries: true,
      },
      orderBy: {
        marbleType: 'asc',
      },
    });

    // Transform to the expected format (grouping stock entries by shade)
    const transformedMarbles: any[] = [];

    for (const marble of marbles) {
      // Get active shades
      const activeShades: string[] = [];
      if (marble.shadeAA) activeShades.push('AA');
      if (marble.shadeA) activeShades.push('A');
      if (marble.shadeB) activeShades.push('B');
      if (marble.shadeBMinus) activeShades.push('B-');

      // Group stock entries by shade
      const shadeStockMap = new Map<string, number>();
      for (const entry of marble.stockEntries) {
        const current = shadeStockMap.get(entry.shade) || 0;
        shadeStockMap.set(entry.shade, current + entry.quantity);
      }

      // Create an entry for each shade that has stock or is active
      for (const shade of activeShades) {
        const quantity = shadeStockMap.get(shade) || 0;
        
        // Get prices for this shade
        let costPrice: number | null = null;
        let salePrice: number | null = null;
        
        if (shade === 'AA') {
          costPrice = marble.costPriceAA;
          salePrice = marble.salePriceAA;
        } else if (shade === 'A') {
          costPrice = marble.costPriceA;
          salePrice = marble.salePriceA;
        } else if (shade === 'B') {
          costPrice = marble.costPriceB;
          salePrice = marble.salePriceB;
        } else if (shade === 'B-') {
          costPrice = marble.costPriceBMinus;
          salePrice = marble.salePriceBMinus;
        }

        transformedMarbles.push({
          id: marble.id,
          marbleType: marble.marbleType,
          color: shade, // For backward compatibility
          quantity,
          unit: 'square feet',
          costPrice,
          salePrice,
          status: quantity === 0 ? 'Out of Stock' : (quantity < 100 ? 'Low Stock' : 'In Stock'),
          updatedAt: marble.updatedAt,
          createdAt: marble.createdAt,
        });
      }
    }

    // Filter by search query if provided
    let filteredMarbles = transformedMarbles;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMarbles = transformedMarbles.filter(
        (marble) =>
          marble.marbleType.toLowerCase().includes(searchLower) ||
          marble.color.toLowerCase().includes(searchLower)
      );
    }

    // Sort results
    const validSortFields: Record<string, string> = {
      id: 'id',
      marbleType: 'marbleType',
      color: 'color',
      quantity: 'quantity',
      costPrice: 'costPrice',
      salePrice: 'salePrice',
      status: 'status',
      updatedAt: 'updatedAt',
      createdAt: 'createdAt',
    };

    const sortField = validSortFields[sortBy] || 'updatedAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    filteredMarbles.sort((a: any, b: any) => {
      const dir = order === 'asc' ? 1 : -1;
      const av = a[sortField];
      const bv = b[sortField];

      if (av === bv) return 0;
      if (av === null || av === undefined) return 1 * dir;
      if (bv === null || bv === undefined) return -1 * dir;

      if (av > bv) return 1 * dir;
      if (av < bv) return -1 * dir;
      return 0;
    });

    return NextResponse.json({ success: true, marbles: filteredMarbles });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
