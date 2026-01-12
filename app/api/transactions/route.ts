import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // 'IN' or 'OUT' or null for all
    const marbleType = searchParams.get('marbleType');
    const requestedBy = searchParams.get('requestedBy');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by type (IN/OUT)
    if (type && (type === 'IN' || type === 'OUT')) {
      where.type = type;
    }

    // Filter by marble type
    if (marbleType && marbleType !== 'all') {
      where.marble = {
        marbleType: marbleType,
      };
    }

    // Filter by requestedBy
    if (requestedBy && requestedBy !== 'all') {
      where.requestedBy = requestedBy;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    const validSortFields: Record<string, string> = {
      id: 'id',
      createdAt: 'createdAt',
      quantity: 'quantity',
      type: 'type',
    };
    const sortField = validSortFields[sortBy] || 'createdAt';
    orderBy[sortField] = sortOrder === 'asc' ? 'asc' : 'desc';

    let transactions;
    let totalCount;

    // If search is provided, we need to fetch all and filter client-side
    // Otherwise, we can use database pagination for better performance
    if (search) {
      // Fetch all matching transactions (for search filtering)
      const allTransactions = await prisma.stockTransaction.findMany({
        where,
        include: {
          marble: {
            select: {
              id: true,
              marbleType: true,
              color: true,
              batchNumber: true,
              unit: true,
            },
          },
        },
        orderBy,
      });

      // Apply search filter
      const searchLower = search.toLowerCase();
      const filtered = allTransactions.filter((txn) => {
        return (
          txn.id.toString().includes(search) ||
          txn.marble.marbleType.toLowerCase().includes(searchLower) ||
          txn.marble.batchNumber?.toLowerCase().includes(searchLower) ||
          txn.requestedBy?.toLowerCase().includes(searchLower) ||
          txn.reason?.toLowerCase().includes(searchLower) ||
          txn.notes?.toLowerCase().includes(searchLower)
        );
      });

      totalCount = filtered.length;
      // Apply pagination after search
      transactions = filtered.slice(skip, skip + limit);
    } else {
      // Get total count
      totalCount = await prisma.stockTransaction.count({ where });

      // Fetch paginated transactions directly from database
      transactions = await prisma.stockTransaction.findMany({
        where,
        include: {
          marble: {
            select: {
              id: true,
              marbleType: true,
              color: true,
              batchNumber: true,
              unit: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      });
    }

    // Transform transactions to match frontend interface
    const transformedTransactions = transactions.map((txn) => ({
      id: `TXN${txn.id.toString().padStart(6, '0')}`,
      type: txn.type === 'IN' ? 'added' : 'removed',
      marbleType: txn.marble.marbleType,
      color: txn.marble.color,
      quantity: txn.quantity,
      unit: txn.marble.unit || 'kg',
      batchNumber: txn.marble.batchNumber || '-',
      performedBy: txn.requestedBy || 'System',
      timestamp: new Date(txn.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      date: new Date(txn.createdAt).toISOString().split('T')[0],
      reason: txn.reason || undefined,
      notes: txn.notes || undefined,
    }));

    // Get unique marble types and users for filters
    const allTransactions = await prisma.stockTransaction.findMany({
      include: {
        marble: {
          select: {
            marbleType: true,
          },
        },
      },
    });

    const uniqueMarbleTypes = Array.from(
      new Set(allTransactions.map((t) => t.marble.marbleType))
    ).sort();

    const uniqueUsers = Array.from(
      new Set(
        allTransactions
          .map((t) => t.requestedBy)
          .filter((u): u is string => u !== null && u !== undefined)
      )
    ).sort();

    // Calculate stats from all filtered transactions (not just current page)
    let allFilteredTransactions;
    if (search) {
      // We already fetched all transactions for search filtering above
      // Re-fetch to get all filtered results for stats
      const allTransactions = await prisma.stockTransaction.findMany({
        where,
        include: {
          marble: {
            select: {
              id: true,
              marbleType: true,
              color: true,
              batchNumber: true,
              unit: true,
            },
          },
        },
        orderBy,
      });

      const searchLower = search.toLowerCase();
      allFilteredTransactions = allTransactions.filter((txn) => {
        return (
          txn.id.toString().includes(search) ||
          txn.marble.marbleType.toLowerCase().includes(searchLower) ||
          txn.marble.batchNumber?.toLowerCase().includes(searchLower) ||
          txn.requestedBy?.toLowerCase().includes(searchLower) ||
          txn.reason?.toLowerCase().includes(searchLower) ||
          txn.notes?.toLowerCase().includes(searchLower)
        );
      });
    } else {
      // Fetch all filtered transactions for stats (without pagination)
      allFilteredTransactions = await prisma.stockTransaction.findMany({
        where,
        include: {
          marble: {
            select: {
              id: true,
              marbleType: true,
              color: true,
              batchNumber: true,
              unit: true,
            },
          },
        },
        orderBy,
      });
    }

    // Calculate stats
    const stats = {
      totalAdded: allFilteredTransactions
        .filter((t) => t.type === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0),
      totalRemoved: allFilteredTransactions
        .filter((t) => t.type === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0),
    };

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions,
      filters: {
        marbleTypes: uniqueMarbleTypes,
        users: uniqueUsers,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
