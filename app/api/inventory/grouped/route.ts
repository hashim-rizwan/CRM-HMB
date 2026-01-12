import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Fetch all marble types (one entry per marble type in new schema)
    const marbles = await prisma.marble.findMany({
      include: {
        stockEntries: true, // Include all stock entries for this marble type
      },
      orderBy: {
        marbleType: 'asc',
      },
    });

    // Process each marble type
    const marbleTypes = marbles.map((marble) => {
      // Get active shades for this marble type
      const activeShades: string[] = [];
      if (marble.shadeAA) activeShades.push('AA');
      if (marble.shadeA) activeShades.push('A');
      if (marble.shadeB) activeShades.push('B');
      if (marble.shadeBMinus) activeShades.push('B-');

      // Initialize shade map with ALL active shades (even if no stock)
      const shadeMap = new Map<string, {
        entries: Array<{
          id: number;
          quantity: number;
          slabSizeLength: number | null;
          slabSizeWidth: number | null;
          numberOfSlabs: number | null;
          notes: string | null;
        }>;
        totalQuantity: number;
        costPrice: number | null;
        salePrice: number | null;
        lastUpdated: Date;
      }>();

      // Initialize all active shades with prices (even if no stock entries exist)
      for (const shade of activeShades) {
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

        shadeMap.set(shade, {
          entries: [],
          totalQuantity: 0,
          costPrice,
          salePrice,
          lastUpdated: marble.updatedAt, // Use marble updatedAt as default
        });
      }

      // Process stock entries by shade
      for (const entry of marble.stockEntries) {
        const shade = entry.shade;
        
        // Only process if this shade is active (should already be in map)
        if (shadeMap.has(shade)) {
          const shadeData = shadeMap.get(shade)!;
          shadeData.entries.push({
            id: entry.id,
            quantity: entry.quantity,
            slabSizeLength: entry.slabSizeLength,
            slabSizeWidth: entry.slabSizeWidth,
            numberOfSlabs: entry.numberOfSlabs,
            notes: entry.notes,
          });
          shadeData.totalQuantity += entry.quantity;
          
          if (entry.updatedAt > shadeData.lastUpdated) {
            shadeData.lastUpdated = entry.updatedAt;
          }
        }
      }

      // Convert shade map to array - now includes ALL active shades
      const shades = Array.from(shadeMap.entries()).map(([shade, shadeData]) => {
        // Calculate shade status based on total quantity
        let shadeStatus = 'Out of Stock';
        if (shadeData.totalQuantity > 100) {
          shadeStatus = 'In Stock';
        } else if (shadeData.totalQuantity > 0) {
          shadeStatus = 'Low Stock';
        }

        return {
          shade,
          costPrice: shadeData.costPrice,
          salePrice: shadeData.salePrice,
          totalQuantity: shadeData.totalQuantity,
          shadeStatus,
          lastUpdated: shadeData.lastUpdated.toISOString(),
          entries: shadeData.entries.map(e => ({
            id: e.id,
            quantity: e.quantity,
            unit: 'sq ft',
            slabInfo: (e.slabSizeLength && e.slabSizeWidth && e.numberOfSlabs) ? {
              length: e.slabSizeLength,
              width: e.slabSizeWidth,
              numberOfSlabs: e.numberOfSlabs,
            } : null,
            notes: e.notes,
          })),
        };
      });

      // Calculate overall totals and status
      const totalQuantity = shades.reduce((sum, s) => sum + s.totalQuantity, 0);
      const hasLowStock = shades.some(s => s.shadeStatus === 'Low Stock');
      const hasOutOfStock = shades.some(s => s.shadeStatus === 'Out of Stock');
      
      let overallStatus = marble.status;
      if (totalQuantity === 0) {
        overallStatus = 'Out of Stock';
      } else if (hasLowStock || hasOutOfStock) {
        overallStatus = 'Low Stock';
      } else if (totalQuantity > 100) {
        overallStatus = 'In Stock';
      }

      return {
        id: marble.id,
        marbleType: marble.marbleType,
        availableShades: activeShades,
        totalQuantity,
        overallStatus,
        lastUpdated: marble.updatedAt.toISOString(),
        shades: shades.sort((a, b) => a.shade.localeCompare(b.shade)),
      };
    });

    // Filter by search query if provided
    let filteredMarbleTypes = marbleTypes;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMarbleTypes = marbleTypes.filter(
        (mt) =>
          mt.marbleType.toLowerCase().includes(searchLower) ||
          mt.availableShades.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      success: true,
      marbleTypes: filteredMarbleTypes,
    });
  } catch (error: any) {
    console.error('Error fetching grouped inventory:', error);
    return NextResponse.json(
      { error: `Failed to fetch inventory: ${error.message}` },
      { status: 500 }
    );
  }
}
