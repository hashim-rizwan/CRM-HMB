import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Parse slab information from notes field
// Format: "Slab Size: LENGTHxWIDTH, Number of Slabs: COUNT"
function parseSlabInfo(notes: string | null): { length: number; width: number; numberOfSlabs: number } | null {
  if (!notes) return null;
  
  try {
    const slabSizeMatch = notes.match(/Slab Size:\s*([\d.]+)x([\d.]+)/i);
    const slabsMatch = notes.match(/Number of Slabs:\s*(\d+)/i);
    
    if (slabSizeMatch && slabsMatch) {
      return {
        length: parseFloat(slabSizeMatch[1]),
        width: parseFloat(slabSizeMatch[2]),
        numberOfSlabs: parseInt(slabsMatch[1], 10),
      };
    }
  } catch (error) {
    console.error('Error parsing slab info:', error);
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Fetch all marbles with their individual entries
    const rawMarbles = await prisma.marble.findMany({
      orderBy: [
        { marbleType: 'asc' },
        { color: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Group by marble type, then by shade, keeping all individual entries
    const marbleTypesMap = new Map<string, {
      id: number; // Use the oldest entry's ID as the consistent ID
      shades: Map<string, {
        entries: Array<{
          id: number;
          quantity: number;
          unit: string | null;
          costPrice: number | null;
          salePrice: number | null;
          status: string;
          notes: string | null;
          slabInfo: { length: number; width: number; numberOfSlabs: number } | null;
          updatedAt: Date;
          createdAt: Date;
        }>;
        costPrice: number | null;
        salePrice: number | null;
        totalQuantity: number;
        shadeStatus: string;
        lastUpdated: Date;
      }>;
      totalQuantity: number;
      overallStatus: string;
      lastUpdated: Date;
    }>();

    for (const marble of rawMarbles) {
      const marbleType = marble.marbleType;
      const shade = marble.color;

      if (!marbleTypesMap.has(marbleType)) {
        marbleTypesMap.set(marbleType, {
          id: marble.id, // First entry becomes the ID
          shades: new Map(),
          totalQuantity: 0,
          overallStatus: 'In Stock',
          lastUpdated: marble.updatedAt,
        });
      }

      const marbleTypeData = marbleTypesMap.get(marbleType)!;
      
      if (!marbleTypeData.shades.has(shade)) {
        marbleTypeData.shades.set(shade, {
          entries: [],
          costPrice: marble.costPrice,
          salePrice: marble.salePrice,
          totalQuantity: 0,
          shadeStatus: marble.status,
          lastUpdated: marble.updatedAt,
        });
      }

      const shadeData = marbleTypeData.shades.get(shade)!;
      shadeData.entries.push({
        id: marble.id,
        quantity: marble.quantity,
        unit: marble.unit,
        costPrice: marble.costPrice,
        salePrice: marble.salePrice,
        status: marble.status,
        notes: marble.notes,
        slabInfo: parseSlabInfo(marble.notes),
        updatedAt: marble.updatedAt,
        createdAt: marble.createdAt,
      });

      // Update shade totals
      shadeData.totalQuantity += marble.quantity;
      if (marble.updatedAt > shadeData.lastUpdated) {
        shadeData.lastUpdated = marble.updatedAt;
        shadeData.costPrice = marble.costPrice;
        shadeData.salePrice = marble.salePrice;
        shadeData.shadeStatus = marble.status;
      }

      // Update marble type totals
      marbleTypeData.totalQuantity += marble.quantity;
      if (marble.updatedAt > marbleTypeData.lastUpdated) {
        marbleTypeData.lastUpdated = marble.updatedAt;
      }
    }

    // Calculate overall status for each marble type
    for (const [marbleType, data] of marbleTypesMap.entries()) {
      const shades = Array.from(data.shades.values());
      const hasLowStock = shades.some(s => s.shadeStatus === 'Low Stock');
      const hasOutOfStock = shades.some(s => s.shadeStatus === 'Out of Stock');
      
      if (hasOutOfStock && data.totalQuantity === 0) {
        data.overallStatus = 'Out of Stock';
      } else if (hasLowStock || hasOutOfStock) {
        data.overallStatus = 'Low Stock';
      } else {
        data.overallStatus = 'In Stock';
      }
    }

    // Convert to array format
    const marbleTypes = Array.from(marbleTypesMap.entries()).map(([marbleType, data]) => {
      const shades = Array.from(data.shades.entries()).map(([shade, shadeData]) => ({
        shade,
        costPrice: shadeData.costPrice,
        salePrice: shadeData.salePrice,
        totalQuantity: shadeData.totalQuantity,
        shadeStatus: shadeData.shadeStatus,
        lastUpdated: shadeData.lastUpdated.toISOString(),
        entries: shadeData.entries.map(e => ({
          id: e.id,
          quantity: e.quantity,
          unit: e.unit,
          slabInfo: e.slabInfo,
          notes: e.notes,
        })),
      }));

      return {
        id: data.id,
        marbleType,
        availableShades: shades.map(s => s.shade).sort(),
        totalQuantity: data.totalQuantity,
        overallStatus: data.overallStatus,
        lastUpdated: data.lastUpdated.toISOString(),
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
  } catch (error) {
    console.error('Error fetching grouped inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
