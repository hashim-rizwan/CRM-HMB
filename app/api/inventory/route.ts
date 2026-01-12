import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Define valid sort fields
    const validSortFields: Record<string, string> = {
      id: 'id',
      marbleType: 'marbleType',
      color: 'color',
      quantity: 'quantity',
      costPrice: 'costPrice',
      salePrice: 'salePrice',
      location: 'location',
      status: 'status',
      updatedAt: 'updatedAt',
      createdAt: 'createdAt',
    };

    // Validate and set sort field
    const sortField = validSortFields[sortBy] || 'updatedAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    // Always fetch raw marbles first
    const rawMarbles = await prisma.marble.findMany();

    // Aggregate marbles so each marble type (and color) appears only once
    // Use the ID of the oldest batch (first created) for consistency
    const aggregatedMap = new Map<
      string,
      {
        id: number;
        marbleType: string;
        color: string;
        quantity: number;
        unit: string | null;
        locations: Set<string>;
        costPrice: number | null;
        salePrice: number | null;
        status: string;
        updatedAt: Date;
        createdAt: Date;
      }
    >();

    // Sort by creation date to ensure we use the oldest batch's ID
    const sortedMarbles = [...rawMarbles].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    for (const marble of sortedMarbles) {
      const key = `${marble.marbleType}__${marble.color}`;
      const existing = aggregatedMap.get(key);

      if (!existing) {
        // First batch for this type - use its ID (oldest batch)
        aggregatedMap.set(key, {
          id: marble.id, // This will be the consistent ID for all batches of this type
          marbleType: marble.marbleType,
          color: marble.color,
          quantity: marble.quantity,
          unit: marble.unit,
          locations: new Set([marble.location]),
          costPrice: marble.costPrice,
          salePrice: marble.salePrice,
          status: marble.status,
          updatedAt: marble.updatedAt,
          createdAt: marble.createdAt,
        });
      } else {
        existing.quantity += marble.quantity;
        existing.locations.add(marble.location);
        // Prefer the most recently updated record for status/prices/unit
        // BUT keep the original ID (from oldest batch)
        if (marble.updatedAt > existing.updatedAt) {
          existing.unit = marble.unit;
          existing.costPrice = marble.costPrice;
          existing.salePrice = marble.salePrice;
          existing.status = marble.status;
          existing.updatedAt = marble.updatedAt;
          // ID stays the same - from the oldest batch
        }
      }
    }

    // Convert map to array and finalize fields (e.g., location display)
    let marbles = Array.from(aggregatedMap.values()).map((item) => ({
      ...item,
      location:
        item.locations.size === 1
          ? Array.from(item.locations)[0]
          : 'Multiple',
    }));

    // Filter by search query if provided (on aggregated data)
    if (search) {
      const searchLower = search.toLowerCase();
      marbles = marbles.filter(
        (marble) =>
          marble.marbleType.toLowerCase().includes(searchLower) ||
          marble.color.toLowerCase().includes(searchLower) ||
          marble.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort aggregated results
    marbles.sort((a: any, b: any) => {
      const dir = order === 'asc' ? 1 : -1;
      const field = sortField;

      const av = (a as any)[field];
      const bv = (b as any)[field];

      if (av === bv) return 0;
      if (av === null || av === undefined) return 1 * dir;
      if (bv === null || bv === undefined) return -1 * dir;

      if (av > bv) return 1 * dir;
      if (av < bv) return -1 * dir;
      return 0;
    });

    return NextResponse.json({ success: true, marbles });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

