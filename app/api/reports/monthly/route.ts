import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { responseIfDatabaseUnavailable } from '@/lib/prismaErrors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Usage by type for the requested month (OUT transactions)
    const monthTransactions = await prisma.stockTransaction.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
      include: { marble: true },
      orderBy: { createdAt: 'asc' },
    });

    const usageByTypeMap = new Map<string, number>();
    monthTransactions.forEach((t) => {
      if (t.type === 'OUT') {
        const type = t.marble.marbleType;
        usageByTypeMap.set(type, (usageByTypeMap.get(type) || 0) + t.quantity);
      }
    });

    const totalUsage = Array.from(usageByTypeMap.values()).reduce((s, v) => s + v, 0);
    const usageByType = Array.from(usageByTypeMap.entries())
      .map(([type, usage]) => ({
        type,
        usage: Math.round(usage),
        percentage: totalUsage > 0 ? Math.round((usage / totalUsage) * 100) : 0,
      }))
      .sort((a, b) => b.usage - a.usage);

    // Last 6 months — real IN/OUT totals and running inventory trend
    const monthlyData = [];
    const trendData = [];

    // Get all transactions up to end of last 6-month window for trend calculation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const allTransactions = await prisma.stockTransaction.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      orderBy: { createdAt: 'asc' },
    });

    // Baseline inventory before the 6-month window
    const allStockEntries = await prisma.stockEntry.findMany({ select: { quantity: true } });
    const currentTotal = allStockEntries.reduce((s, e) => s + e.quantity, 0);

    // Compute inventory at end of each month by working backwards from current
    const monthlyNet: Map<string, { added: number; removed: number }> = new Map();
    allTransactions.forEach((t) => {
      const key = t.createdAt.toISOString().slice(0, 7);
      if (!monthlyNet.has(key)) monthlyNet.set(key, { added: 0, removed: 0 });
      const entry = monthlyNet.get(key)!;
      if (t.type === 'IN') entry.added += t.quantity;
      else entry.removed += t.quantity;
    });

    // Build 6-month array
    const now = new Date();
    let runningInventory = currentTotal;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const net = monthlyNet.get(key) || { added: 0, removed: 0 };
      monthlyData.push({
        month: monthName,
        added: Math.round(net.added),
        removed: Math.round(net.removed),
        net: Math.round(net.added - net.removed),
      });
    }

    // Trend: reconstruct inventory level at the END of each month
    // Work forward from baseline (currentTotal minus future nets)
    let inv = currentTotal;
    const orderedMonths = [];
    for (let i = 0; i <= 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      orderedMonths.unshift({ key, month: d.toLocaleString('en-US', { month: 'short' }) });
    }
    // Walk backwards to reconstruct historical levels
    for (let i = orderedMonths.length - 1; i >= 0; i--) {
      const { key, month } = orderedMonths[i];
      trendData.unshift({ month, inventory: Math.round(inv) });
      const net = monthlyNet.get(key) || { added: 0, removed: 0 };
      inv = inv - net.added + net.removed; // undo this month going backwards
    }

    return NextResponse.json({ success: true, monthlyData, usageByType, trendData });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    const dbError = responseIfDatabaseUnavailable(error);
    if (dbError) return dbError;
    return NextResponse.json({ error: 'Failed to fetch monthly report' }, { status: 500 });
  }
}
